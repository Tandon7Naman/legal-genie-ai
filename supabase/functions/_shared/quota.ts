// Shared per-user daily AI quota helpers (student tier enforcement).
// The ledger lives in public.ai_daily_usage and is mutated only by the
// security-definer RPCs, so clients can never edit their own counters.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface QuotaResult {
  allowed: boolean;
  unlimited?: boolean;
  used?: number;
  limit?: number;
  remaining?: number;
  reason?: string;
}

export function checkQuota(authHeader: string): Promise<QuotaResult> {
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  return supabase
    .rpc("try_consume_ai_query")
    .then(({ data, error }) => {
      if (error) {
        // Fail open on infrastructure errors; never block research because the meter is down.
        console.error("quota rpc error:", error.message);
        return { allowed: true, unlimited: true } as QuotaResult;
      }
      return data as QuotaResult;
    });
}

export function refundQuota(authHeader: string): Promise<void> {
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  return supabase.rpc("refund_ai_query").then(() => undefined);
}

export function quotaExceededResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Daily limit reached: free student accounts get 5 AI queries per day. Upgrade to Individual for unlimited queries.",
      code: "daily_limit_reached",
      limit: 5,
    }),
    { status: 429, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
  );
}
