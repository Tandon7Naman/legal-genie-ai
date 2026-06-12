import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "lastActivityAt";
const PREF_KEY = "idleTimeoutMinutes";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export function useIdleLogout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);
  const timeoutMsRef = useRef<number>(15 * 60 * 1000);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const doLogout = async () => {
      localStorage.removeItem(STORAGE_KEY);
      await signOut();
      toast({ title: "Signed out", description: "You were signed out due to inactivity." });
      navigate("/auth");
    };

    const resetTimer = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (timeoutMsRef.current <= 0) return;
      timerRef.current = window.setTimeout(doLogout, timeoutMsRef.current);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        if (last && timeoutMsRef.current > 0 && Date.now() - last > timeoutMsRef.current) {
          doLogout();
          return;
        }
        resetTimer();
      }
    };

    // Load preference
    const cachedMin = parseInt(localStorage.getItem(PREF_KEY) || "", 10);
    if (!isNaN(cachedMin)) timeoutMsRef.current = cachedMin * 60 * 1000;

    supabase
      .from("user_preferences")
      .select("idle_timeout_minutes")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const mins = data?.idle_timeout_minutes ?? 15;
        timeoutMsRef.current = mins * 60 * 1000;
        localStorage.setItem(PREF_KEY, mins.toString());
        resetTimer();
      });

    // Initial check on mount (tab was closed/reopened)
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    if (last && timeoutMsRef.current > 0 && Date.now() - last > timeoutMsRef.current) {
      doLogout();
      return;
    }
    resetTimer();

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, signOut, navigate, toast]);
}
