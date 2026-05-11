import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingState {
  loading: boolean;
  sampleDataSeeded: boolean;
  sampleDataCleared: boolean;
  onboardingCompleted: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    loading: true,
    sampleDataSeeded: false,
    sampleDataCleared: false,
    onboardingCompleted: false,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("sample_data_seeded, sample_data_cleared, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    setState({
      loading: false,
      sampleDataSeeded: !!data?.sample_data_seeded,
      sampleDataCleared: !!data?.sample_data_cleared,
      onboardingCompleted: !!data?.onboarding_completed,
    });
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-seed on first ever load
  useEffect(() => {
    if (!user || state.loading) return;
    if (!state.sampleDataSeeded && !state.sampleDataCleared) {
      supabase.functions.invoke("seed-sample-data").then(() => refresh());
    }
  }, [user, state.loading, state.sampleDataSeeded, state.sampleDataCleared, refresh]);

  const markOnboardingCompleted = useCallback(async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
    setState((s) => ({ ...s, onboardingCompleted: true }));
  }, [user]);

  const clearSampleData = useCallback(async () => {
    const { error } = await supabase.functions.invoke("clear-sample-data");
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const hasSampleData = state.sampleDataSeeded && !state.sampleDataCleared;
  const shouldShowTour = hasSampleData && !state.onboardingCompleted;

  return { ...state, hasSampleData, shouldShowTour, markOnboardingCompleted, clearSampleData, refresh };
}