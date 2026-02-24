import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Loader2, History, Sparkles, FileSearch, Filter } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SmartSuggestions } from "@/components/research/SmartSuggestions";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamFromEdge({
  functionName,
  body,
  onDelta,
  onDone,
}: {
  functionName: string;
  body: Record<string, unknown>;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
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
        if (content) onDelta(content);
      } catch {}
    }
  }
  onDone();
}

const ResearchPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search tab
  const [query, setQuery] = useState("");
  const [courtLevel, setCourtLevel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [actSection, setActSection] = useState("");
  const [subjectArea, setSubjectArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Case analysis tab
  const [caseDetails, setCaseDetails] = useState("");

  // Shared
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [searchHistory, setSearchHistory] = useState<{ id: string; query_text: string; query_type: string; created_at: string }[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    if (historyLoaded) return;
    const { data } = await supabase
      .from("search_history")
      .select("id, query_text, query_type, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSearchHistory(data);
    setHistoryLoaded(true);
  };

  const saveToHistory = async (queryText: string, queryType: string, filters: Record<string, string>) => {
    if (!user) return;
    await supabase.from("search_history").insert({
      user_id: user.id,
      query_text: queryText,
      query_type: queryType,
      filters,
    });
    setHistoryLoaded(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult("");
    let accumulated = "";

    const filters: Record<string, string> = {};
    if (courtLevel) filters.courtLevel = courtLevel;
    if (yearFrom) filters.yearFrom = yearFrom;
    if (yearTo) filters.yearTo = yearTo;
    if (actSection) filters.actSection = actSection;
    if (subjectArea) filters.subjectArea = subjectArea;

    try {
      await streamFromEdge({
        functionName: "legal-search",
        body: { query, filters: Object.keys(filters).length > 0 ? filters : undefined },
        onDelta: (chunk) => {
          accumulated += chunk;
          setResult(accumulated);
        },
        onDone: () => setLoading(false),
      });
      saveToHistory(query, "search", filters);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!caseDetails.trim()) return;
    setLoading(true);
    setResult("");
    let accumulated = "";

    try {
      await streamFromEdge({
        functionName: "case-analyze",
        body: { caseDetails },
        onDelta: (chunk) => {
          accumulated += chunk;
          setResult(accumulated);
        },
        onDone: () => setLoading(false),
      });
      saveToHistory(caseDetails.slice(0, 200), "analyze", {});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="border-b border-border/20 bg-primary/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground/60 hover:text-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="font-serif text-xl font-bold text-primary-foreground">
              Tandon <span className="text-gradient-gold">Associates</span>
            </Link>
          </div>
          <span className="text-sm text-primary-foreground/40">AI Legal Research</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResult(""); }}>
          <TabsList className="bg-primary/30 border border-border/20 mb-6">
            <TabsTrigger value="search" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Search className="w-4 h-4 mr-2" /> Legal Search
            </TabsTrigger>
            <TabsTrigger value="analyze" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <FileSearch className="w-4 h-4 mr-2" /> Case Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground" onClick={loadHistory}>
              <History className="w-4 h-4 mr-2" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search Indian case law, statutes, legal principles..."
                  className="pl-12 py-6 text-lg bg-primary/20 border-border/30 text-primary-foreground placeholder:text-muted-foreground/50"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                >
                  <Filter className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary text-secondary-foreground hover:bg-accent"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>

              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-primary/20 border border-border/20">
                  <div>
                    <Label className="text-xs text-muted-foreground">Court Level</Label>
                    <Select value={courtLevel} onValueChange={setCourtLevel}>
                      <SelectTrigger className="bg-primary/20 border-border/30 text-primary-foreground text-sm">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supreme_court">Supreme Court</SelectItem>
                        <SelectItem value="high_court">High Court</SelectItem>
                        <SelectItem value="district_court">District Court</SelectItem>
                        <SelectItem value="tribunal">Tribunal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Year From</Label>
                    <Input type="number" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="e.g. 2000" className="bg-primary/20 border-border/30 text-primary-foreground text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Year To</Label>
                    <Input type="number" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="e.g. 2024" className="bg-primary/20 border-border/30 text-primary-foreground text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Act / Section</Label>
                    <Input value={actSection} onChange={(e) => setActSection(e.target.value)} placeholder="e.g. IPC 302" className="bg-primary/20 border-border/30 text-primary-foreground text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <Label className="text-xs text-muted-foreground">Subject Area</Label>
                    <Select value={subjectArea} onValueChange={setSubjectArea}>
                      <SelectTrigger className="bg-primary/20 border-border/30 text-primary-foreground text-sm">
                        <SelectValue placeholder="All areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="criminal">Criminal Law</SelectItem>
                        <SelectItem value="civil">Civil Law</SelectItem>
                        <SelectItem value="corporate">Corporate Law</SelectItem>
                        <SelectItem value="constitutional">Constitutional Law</SelectItem>
                        <SelectItem value="family">Family Law</SelectItem>
                        <SelectItem value="ip">Intellectual Property</SelectItem>
                        <SelectItem value="tax">Tax Law</SelectItem>
                        <SelectItem value="labour">Labour Law</SelectItem>
                        <SelectItem value="cyber">Cyber Law</SelectItem>
                        <SelectItem value="environmental">Environmental Law</SelectItem>
                        <SelectItem value="banking">Banking & Finance</SelectItem>
                        <SelectItem value="arbitration">Arbitration & ADR</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
              <SmartSuggestions onSuggestionClick={(s) => { setQuery(s); }} />
            </motion.div>
          </TabsContent>

          <TabsContent value="analyze">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Textarea
                value={caseDetails}
                onChange={(e) => setCaseDetails(e.target.value)}
                placeholder="Paste or type your case details here for AI analysis. Include facts, parties involved, legal issues, and any specific questions you have..."
                rows={8}
                className="bg-primary/20 border-border/30 text-primary-foreground placeholder:text-muted-foreground/50"
              />
              <Button onClick={handleAnalyze} disabled={loading || !caseDetails.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSearch className="w-4 h-4 mr-2" />}
                Analyze Case
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {searchHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No search history yet</p>
              ) : (
                searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.query_type === "analyze") {
                        setCaseDetails(item.query_text);
                        setActiveTab("analyze");
                      } else {
                        setQuery(item.query_text);
                        setActiveTab("search");
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg bg-primary/20 border border-border/20 hover:border-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary capitalize">{item.query_type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-primary-foreground truncate">{item.query_text}</p>
                  </button>
                ))
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Results area */}
        {(result || loading) && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 rounded-xl bg-primary/20 border border-border/20"
          >
            <h3 className="font-serif text-lg font-semibold text-primary-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              {activeTab === "search" ? "Research Results" : "Case Analysis"}
            </h3>
            <div className="prose prose-sm prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary [&_a]:text-secondary">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating response...</span>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ResearchPage;
