import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SearchEntry {
  id: string;
  query_text: string;
  query_type: string;
  created_at: string;
}

export const ResearchHistoryWidget = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("search_history")
      .select("id, query_text, query_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => data && setHistory(data));
  }, [user]);

  if (!history.length) return <p className="text-sm text-muted-foreground">No research history yet.</p>;

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/20 transition-colors">
          <Search className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm truncate">{h.query_text}</p>
            <p className="text-xs text-muted-foreground">
              {h.query_type} • {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
