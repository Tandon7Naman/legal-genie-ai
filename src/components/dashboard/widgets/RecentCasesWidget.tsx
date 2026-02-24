import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface CaseRow {
  id: string;
  title: string;
  status: string;
  case_number: string | null;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  closed: "bg-muted text-muted-foreground border-border",
  won: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  lost: "bg-destructive/20 text-destructive border-destructive/30",
  settled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const RecentCasesWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cases")
      .select("id, title, status, case_number, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5)
      .then(({ data }) => data && setCases(data));
  }, [user]);

  if (!cases.length) return <p className="text-sm text-muted-foreground">No cases yet.</p>;

  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/cases/${c.id}`)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{c.title}</p>
            {c.case_number && <p className="text-xs text-muted-foreground">{c.case_number}</p>}
          </div>
          <Badge variant="outline" className={statusColors[c.status] || ""}>
            {c.status}
          </Badge>
        </button>
      ))}
    </div>
  );
};
