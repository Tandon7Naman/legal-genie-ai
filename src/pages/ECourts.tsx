import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Search, Loader2, AlertCircle, CheckCircle2, Clock, Calendar, MapPin, Gavel } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ECourtsPage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [cnrNumber, setCnrNumber] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    const trimmed = cnrNumber.trim().toUpperCase();
    if (!trimmed) {
      toast({ title: "Enter a CNR number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const token = session?.access_token || "";
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ecourts-track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cnrNumber: trimmed }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

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
              setResult(accumulated);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-7 h-7 text-secondary" />
          <h1 className="font-serif text-2xl font-bold">eCourts Case Tracker</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6 ml-10">
          Track case status using CNR (Case Number Record) numbers from Indian courts
        </p>

        {/* CNR Info */}
        <div className="mb-6 p-4 rounded-xl bg-card/50 border border-border/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-secondary" />
            What is a CNR Number?
          </h3>
          <p className="text-xs text-muted-foreground">
            CNR (Case Number Record) is a unique 16-character alphanumeric number assigned to each case filed in Indian courts.
            Format: <code className="px-1 py-0.5 rounded bg-muted text-foreground">XXHC01-000001-2024</code> (State Code + District Code + Case Number + Year).
            You can find it on your court order or case filing receipt.
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">CNR Number</Label>
            <Input
              value={cnrNumber}
              onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              placeholder="e.g. DLHC01-000123-2024"
              className="bg-card/50 border-border/30 font-mono tracking-wider"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleTrack} disabled={loading || !cnrNumber.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Track
            </Button>
          </div>
        </div>

        {/* Quick reference badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { icon: MapPin, label: "Delhi HC", code: "DLHC" },
            { icon: MapPin, label: "Bombay HC", code: "MHHC" },
            { icon: MapPin, label: "Madras HC", code: "TNHC" },
            { icon: MapPin, label: "Calcutta HC", code: "WBHC" },
          ].map((court) => (
            <button
              key={court.code}
              onClick={() => setCnrNumber(court.code)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted/50 border border-border/20 hover:border-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <court.icon className="w-3 h-3" />
              {court.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {(result || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-6 rounded-xl bg-card/50 border border-border/20"
          >
            <h3 className="font-serif text-lg font-semibold flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-secondary" />
              Case Status
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Fetching case details...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ECourtsPage;
