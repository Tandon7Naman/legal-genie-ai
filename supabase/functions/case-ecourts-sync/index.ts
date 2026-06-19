import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ECOURTS_BASE = "https://webapi.ecourtsindia.com/api/partner";
const CNR_RE = /^[A-Z]{4}[0-9]{12}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseDate(v: unknown): string | null {
  if (!v || typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  // try dd-mm-yyyy / dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T10:30:00+05:30`;
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

export async function syncCase(opts: {
  caseId: string;
  userId: string;
  serviceClient: ReturnType<typeof createClient>;
  ecourtsKey: string;
}) {
  const { caseId, userId, serviceClient, ecourtsKey } = opts;

  // Load case, scoped to the owner
  const { data: caseRow, error: caseErr } = await serviceClient
    .from("cases")
    .select("id, user_id, cnr_number")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (caseErr) throw new Error(caseErr.message);
  if (!caseRow) return { ok: false, error: "Case not found" };

  const cnr = (caseRow.cnr_number || "").toUpperCase().trim();
  if (!CNR_RE.test(cnr)) {
    await serviceClient
      .from("cases")
      .update({
        ecourts_sync_status: "failed",
        ecourts_sync_error: "Invalid CNR format",
        ecourts_last_synced_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    return { ok: false, error: "Invalid CNR format" };
  }

  // Fetch from eCourts
  const resp = await fetch(`${ECOURTS_BASE}/case/${cnr}`, {
    headers: { Authorization: `Bearer ${ecourtsKey}` },
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    console.error("ecourts case fetch failed", resp.status, errBody);
    await serviceClient
      .from("cases")
      .update({
        ecourts_sync_status: "failed",
        ecourts_sync_error: `eCourts error ${resp.status}`,
        ecourts_last_synced_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    return { ok: false, error: `eCourts error ${resp.status}` };
  }

  const payload = await resp.json();
  const ccd = payload?.data?.courtCaseData ?? payload?.data ?? {};
  const d: any = ccd;

  const judge = d.judge || d.judgeName || d.coramName || d.bench || null;
  const court = d.courtName || d.court || d.establishmentName || null;
  const courtComplex = d.courtComplex || d.complexName || null;
  const caseStatus = d.caseStatus || d.status || d.stage || null;
  const nextDateRaw =
    d.nextHearingDate || d.nextDate || d.nextHearing || d.next_listing_date || null;
  const nextDateIso = parseDate(nextDateRaw);

  // Build upcoming hearings list from history if available
  const upcoming: Array<{ date: string; purpose: string | null; judge: string | null; court: string | null }> = [];
  const seen = new Set<string>();
  const pushIfFuture = (dateStr: unknown, purpose: unknown) => {
    const iso = parseDate(dateStr);
    if (!iso) return;
    if (new Date(iso).getTime() < Date.now() - 6 * 3600 * 1000) return;
    const p = purpose ? String(purpose) : null;
    const key = `${iso}|${p ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    upcoming.push({ date: iso, purpose: p, judge, court });
  };

  if (nextDateIso) pushIfFuture(nextDateRaw, d.purposeOfHearing || d.nextPurpose || "Next Hearing");

  const histArr =
    d.caseHistory || d.history || d.businessHistory || d.hearingHistory || [];
  if (Array.isArray(histArr)) {
    for (const h of histArr) {
      pushIfFuture(
        h?.nextDate || h?.nextHearingDate || h?.date,
        h?.purpose || h?.businessOnDate || h?.stage || "Hearing",
      );
    }
  }

  // Update case
  const caseUpdate: Record<string, unknown> = {
    ecourts_sync_status: "success",
    ecourts_sync_error: null,
    ecourts_last_synced_at: new Date().toISOString(),
  };
  if (judge) caseUpdate.judge = judge;
  if (court) caseUpdate.court = court;
  if (courtComplex) caseUpdate.court_complex = courtComplex;
  if (caseStatus) caseUpdate.case_status = caseStatus;
  if (nextDateIso) caseUpdate.next_hearing_date = nextDateIso.slice(0, 10);

  const { error: updErr } = await serviceClient
    .from("cases")
    .update(caseUpdate)
    .eq("id", caseId);
  if (updErr) console.error("case update error", updErr);

  // Upsert hearings + calendar events
  let hearingCount = 0;
  for (const h of upcoming) {
    const { error: hErr } = await serviceClient
      .from("hearings")
      .upsert(
        {
          case_id: caseId,
          user_id: userId,
          date: h.date,
          purpose: h.purpose,
          court: h.court,
          judge: h.judge,
          source: "ecourts",
        },
        { onConflict: "case_id,date,purpose", ignoreDuplicates: false },
      );
    if (hErr) {
      // The COALESCE-based unique index may not match this onConflict literally;
      // fall back to a manual check.
      const { data: existing } = await serviceClient
        .from("hearings")
        .select("id")
        .eq("case_id", caseId)
        .eq("date", h.date)
        .eq("purpose", h.purpose ?? "")
        .maybeSingle();
      if (!existing) {
        await serviceClient.from("hearings").insert({
          case_id: caseId,
          user_id: userId,
          date: h.date,
          purpose: h.purpose,
          court: h.court,
          judge: h.judge,
          source: "ecourts",
        });
      }
    }
    hearingCount++;

    // Mirror into calendar_events
    const title = `Hearing: ${h.purpose || "Court Listing"}`;
    const { data: existingCal } = await serviceClient
      .from("calendar_events")
      .select("id")
      .eq("case_id", caseId)
      .eq("date", h.date)
      .eq("title", title)
      .eq("source", "ecourts")
      .maybeSingle();
    if (!existingCal) {
      await serviceClient.from("calendar_events").insert({
        user_id: userId,
        case_id: caseId,
        title,
        date: h.date,
        type: "hearing",
        location: h.court,
        description: h.judge ? `Before ${h.judge}` : null,
        source: "ecourts",
      });
    }
  }

  return {
    ok: true,
    judge,
    court,
    courtComplex,
    caseStatus,
    nextHearing: nextDateIso,
    hearingCount,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supaService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ecourtsKey = Deno.env.get("ECOURTS_API_KEY");
    if (!ecourtsKey) return json({ error: "Service unavailable" }, 503);

    const userClient = createClient(supaUrl, supaAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const caseId = typeof body?.caseId === "string" ? body.caseId : null;
    if (!caseId) return json({ error: "caseId required" }, 400);

    const serviceClient = createClient(supaUrl, supaService);
    const result = await syncCase({ caseId, userId, serviceClient, ecourtsKey });
    return json(result, result.ok ? 200 : 400);
  } catch (e) {
    console.error("case-ecourts-sync error", e);
    return json({ error: "Internal server error" }, 500);
  }
});