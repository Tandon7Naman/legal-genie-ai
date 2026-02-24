import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, TrendingUp } from "lucide-react";

interface SmartSuggestionsProps {
  onSuggestionClick: (query: string) => void;
}

export const SmartSuggestions = ({ onSuggestionClick }: SmartSuggestionsProps) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Analyze recent search patterns to suggest related queries
      const { data } = await supabase
        .from("search_history")
        .select("query_text, query_type, filters")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (!data || data.length === 0) return;

      // Extract practice areas and keywords from history
      const keywords = new Set<string>();
      data.forEach((item: any) => {
        // Extract subject areas from filters
        const filters = item.filters as Record<string, string> | null;
        if (filters?.subjectArea) keywords.add(filters.subjectArea);
        if (filters?.actSection) keywords.add(filters.actSection);
      });

      // Generate contextual suggestions based on patterns
      const recentQueries = data.slice(0, 5).map((d: any) => d.query_text);
      const areas = [...keywords];
      
      const generated: string[] = [];
      if (areas.includes("criminal")) generated.push("Latest amendments to BNS 2023 replacing IPC");
      if (areas.includes("civil")) generated.push("Recent CPC amendments on commercial disputes");
      if (areas.includes("corporate")) generated.push("SEBI regulations on insider trading 2024");
      if (areas.includes("family")) generated.push("Supreme Court on maintenance under Section 125 CrPC");
      if (areas.includes("constitutional")) generated.push("Article 21 right to privacy recent judgments");
      if (areas.includes("labour")) generated.push("Industrial Relations Code 2020 key provisions");
      if (areas.includes("tax")) generated.push("GST appellate tribunal recent decisions");
      if (areas.includes("ip")) generated.push("Patent infringement remedies in Indian courts");
      
      // Add general suggestions if not enough
      if (generated.length < 3) {
        generated.push("Landmark Supreme Court judgments 2025");
        generated.push("Bharatiya Nyaya Sanhita key changes from IPC");
        generated.push("Arbitration Act Section 11 recent developments");
      }

      setSuggestions(generated.slice(0, 4));
    };
    load();
  }, [user]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-secondary" />
        <span className="text-xs font-medium text-muted-foreground">Suggested for you</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-primary/20 border border-border/20 text-primary-foreground/70 hover:border-secondary/40 hover:text-secondary transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
