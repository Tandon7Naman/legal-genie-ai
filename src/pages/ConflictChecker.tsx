import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, Loader2, History } from "lucide-react";

interface ConflictResult {
  name: string;
  type: "Direct" | "Indirect" | "None";
  matchScore: number;
  details: string;
}

const ConflictChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<ConflictResult[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from("conflict_checks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    if (data) setHistory(data);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;
    setChecking(true);
    setResults([]);

    // Check against existing clients and cases
    const [clientsRes, casesRes] = await Promise.all([
      supabase.from("clients").select("name, email").eq("user_id", user.id),
      supabase.from("cases").select("title, case_number").eq("user_id", user.id),
    ]);

    const searchLower = query.toLowerCase();
    const foundResults: ConflictResult[] = [];

    clientsRes.data?.forEach((cl) => {
      if (cl.name.toLowerCase().includes(searchLower)) {
        foundResults.push({ name: cl.name, type: "Direct", matchScore: 95, details: `Existing client match: ${cl.email || "N/A"}` });
      }
    });

    casesRes.data?.forEach((cs) => {
      if (cs.title.toLowerCase().includes(searchLower)) {
        foundResults.push({ name: cs.title, type: "Indirect", matchScore: 60, details: `Related case: ${cs.case_number || "N/A"}` });
      }
    });

    if (foundResults.length === 0) {
      foundResults.push({ name: query, type: "None", matchScore: 0, details: "No conflicts found in current records." });
    }

    setResults(foundResults);
    setChecking(false);

    // Save check
    await supabase.from("conflict_checks").insert({ user_id: user.id, query_text: query, results: foundResults as any, status: foundResults.some((r) => r.type === "Direct") ? "conflict_found" : "clear" });
    toast({ title: foundResults.some((r) => r.type === "Direct") ? "⚠️ Conflict detected" : "✅ No conflicts found" });
    fetchHistory();
  };

  const TYPE_COLORS: Record<string, string> = {
    Direct: "bg-destructive/15 text-destructive",
    Indirect: "bg-amber-500/15 text-amber-400",
    None: "bg-emerald-500/15 text-emerald-400",
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Conflict Checker</h1>
        <p className="text-muted-foreground text-sm mt-1">Screen for conflicts of interest before accepting new clients or cases.</p>
      </motion.div>

      <Card className="border-border/30">
        <CardContent className="p-6">
          <form onSubmit={handleCheck} className="flex gap-3">
            <div className="relative flex-1">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Enter party name, company, or individual..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" disabled={checking} className="gap-1.5">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="font-semibold text-sm">Results</h3>
            {results.map((r, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${r.type === "Direct" ? "bg-destructive/10" : r.type === "Indirect" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                    {r.type === "None" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="outline" className={TYPE_COLORS[r.type]}>{r.type} Conflict</Badge>
                      {r.matchScore > 0 && <span className="text-xs text-muted-foreground">{r.matchScore}% match</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.details}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <Card className="border-border/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Recent Checks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <span className="text-sm">{h.query_text}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={h.status === "clear" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}>{h.status === "clear" ? "Clear" : "Conflict"}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConflictChecker;
