import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookOpen, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function StatuteSimplifier({ token, initialStatute }: { token: string; initialStatute?: string }) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStatute && !input) setInput(initialStatute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatute]);

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setOut("");
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/statute-simplify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statute: input }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(j.error);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx); buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) { acc += c; setOut(acc); } } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="w-4 h-4 text-secondary" /> Paste any Indian statute, section or rule — get a plain-English explanation.
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder="e.g. Section 138 of the Negotiable Instruments Act, 1881" className="bg-card/50 border-border/30" />
      <Button onClick={run} disabled={loading || !input.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Simplify
      </Button>
      {(out || loading) && (
        <div className="p-5 rounded-xl bg-card/50 border border-border/20">
          <div className="prose prose-sm dark:prose-invert max-w-none [&_strong]:text-secondary">
            <ReactMarkdown>{out}</ReactMarkdown>
          </div>
          {loading && <div className="flex items-center gap-2 mt-3 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Simplifying...</div>}
        </div>
      )}
    </motion.div>
  );
}