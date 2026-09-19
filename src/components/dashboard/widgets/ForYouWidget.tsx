import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, BookOpen, Scale, FileText, GraduationCap, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Recommendation {
  title: string;
  description: string;
  category: "case_law" | "statute" | "document" | "learning" | "action";
  priority: "high" | "medium" | "low";
  actionLabel: string;
  actionRoute: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  case_law: <Scale className="w-3.5 h-3.5" />,
  statute: <BookOpen className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  learning: <GraduationCap className="w-3.5 h-3.5" />,
  action: <Zap className="w-3.5 h-3.5" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-accent/20 text-accent",
  low: "bg-muted text-muted-foreground",
};

export const ForYouWidget = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchRecommendations = async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    const accessToken = current?.access_token;
    if (!accessToken) {
      setLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err: any) {
      console.error("Recommendations error:", err);
      const msg = String(err?.message ?? "");
      if (!msg.includes("401")) {
        toast({ title: "Could not load recommendations", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (session && !loaded) fetchRecommendations();
  }, [session, loaded]);

  if (loading && !loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-muted-foreground">Analyzing your patterns...</span>
      </div>
    );
  }

  if (recommendations.length === 0 && loaded) {
    return (
      <div className="text-center py-6">
        <Sparkles className="w-8 h-8 text-accent/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Use the platform more to get personalized suggestions</p>
        <Button variant="ghost" size="sm" onClick={fetchRecommendations} className="mt-2 text-accent">
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Personalized</span>
        <Button variant="ghost" size="sm" onClick={fetchRecommendations} disabled={loading} className="h-6 px-2 text-muted-foreground hover:text-accent">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      </div>
      {recommendations.slice(0, 4).map((rec, i) => (
        <button
          key={i}
          onClick={() => navigate(rec.actionRoute)}
          className="w-full text-left p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-accent/30 transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 text-accent mt-0.5">
              {CATEGORY_ICONS[rec.category] || <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">{rec.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${PRIORITY_COLORS[rec.priority]}`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
              <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
                {rec.actionLabel} →
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
