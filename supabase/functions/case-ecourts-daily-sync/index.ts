import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncCase } from "../case-ecourts-sync/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ecourtsKey = Deno.env.get("ECOURTS_API_KEY");
  if (!ecourtsKey) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(supaUrl, supaService);

  // Authorization: require an authenticated admin caller.
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: userData, error: userErr } = await serviceClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: adminRow } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Pick cases with a CNR that haven't been synced in 20+ hours
  const cutoff = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const { data: cases, error } = await serviceClient
    .from("cases")
    .select("id, user_id, ecourts_last_synced_at")
    .not("cnr_number", "is", null)
    .or(`ecourts_last_synced_at.is.null,ecourts_last_synced_at.lt.${cutoff}`)
    .limit(200);

  if (error) {
    console.error("daily-sync select error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let ok = 0, failed = 0;
  for (const c of cases ?? []) {
    try {
      const r = await syncCase({
        caseId: c.id as string,
        userId: c.user_id as string,
        serviceClient,
        ecourtsKey,
      });
      if (r.ok) ok++; else failed++;
      // gentle pacing
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      failed++;
      console.error("daily-sync case error", c.id, e);
    }
  }

  // Log to activity_log (best-effort)
  try {
    await serviceClient.from("activity_log").insert({
      user_id: null,
      action: "ecourts_daily_sync",
      entity_type: "system",
      metadata: { total: cases?.length ?? 0, ok, failed },
    });
  } catch (_) { /* table may require user_id */ }

  return new Response(JSON.stringify({ total: cases?.length ?? 0, ok, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});