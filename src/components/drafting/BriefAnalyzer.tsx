import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Upload, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface BriefAnalyzerProps {
  documentType?: string;
  onInsightGenerated?: (insight: string) => void;
}

export const BriefAnalyzer = ({ documentType, onInsightGenerated }: BriefAnalyzerProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [briefText, setBriefText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!briefText.trim()) {
      toast({ title: "Enter or paste your case brief", variant: "destructive" });
      return;
    }
    setLoading(true);
    setAnalysis("");
    let accumulated = "";

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/brief-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ briefText: briefText.trim(), documentType }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setAnalysis(accumulated);
            }
          } catch {}
        }
      }
      onInsightGenerated?.(accumulated);
    } catch (err: any) {
      toast({ title: "Analysis Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="border-border/30 text-muted-foreground hover:text-secondary">
        <Brain className="w-4 h-4 mr-2" /> Analyze Brief
      </Button>
    );
  }

  return (
    <div className="rounded-xl bg-card/50 border border-border/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-secondary" /> Brief Analysis
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        value={briefText}
        onChange={(e) => setBriefText(e.target.value)}
        placeholder="Paste your case brief, facts, or summary here for AI analysis..."
        rows={5}
        className="bg-background/50 border-border/30 text-sm"
      />
      <Button onClick={handleAnalyze} disabled={loading || !briefText.trim()} size="sm" className="bg-secondary text-secondary-foreground hover:bg-accent">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {loading ? "Analyzing..." : "Analyze Brief"}
      </Button>

      {(analysis || loading) && (
        <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/20 max-h-80 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
          {loading && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs">
              <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
