import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface Hearing {
  id: string;
  date: string;
  court: string | null;
  purpose: string | null;
  cases: { title: string } | null;
}

export const UpcomingHearingsWidget = () => {
  const { user } = useAuth();
  const [hearings, setHearings] = useState<Hearing[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("hearings")
      .select("id, date, court, purpose, cases(title)")
      .eq("user_id", user.id)
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(5)
      .then(({ data }) => data && setHearings(data as any));
  }, [user]);

  if (!hearings.length) return <p className="text-sm text-muted-foreground">No upcoming hearings.</p>;

  return (
    <div className="space-y-3">
      {hearings.map((h) => (
        <div key={h.id} className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/10 p-2 mt-0.5">
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{format(new Date(h.date), "MMM d, yyyy")}</p>
            <p className="text-xs text-muted-foreground truncate">
              {h.cases?.title || "Unknown case"} {h.court ? `• ${h.court}` : ""}
            </p>
            {h.purpose && <p className="text-xs text-muted-foreground/70">{h.purpose}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
