import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AiQuotaState {
  /** Whether this account is metered (free student accounts only). */
  limited: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export function useAiQuota(userId?: string) {
  const [quota, setQuota] = useState<AiQuotaState>({ limited: false, used: 0, limit: 5, remaining: 5 });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_ai_usage_today");
    if (!error && data) {
      setQuota({
        limited: !!data.limited,
        used: data.used ?? 0,
        limit: data.limit ?? 5,
        remaining: data.remaining ?? 0,
      });
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId, refresh]);

  return { quota, refresh };
}
