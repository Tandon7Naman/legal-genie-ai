import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { GraduationCap, Gavel, FileText, BookOpen, Loader2, Sparkles, Copy, Check, Users, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function streamAI({
  functionName, body, onDelta, onDone, token,
}: {
  functionName: string; body: Record<string, unknown>; onDelta: (t: string) => void; onDone: () => void; token: string;
}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

const MOOT_TOPICS = [
  "Right to Privacy vs National Security",
  "Freedom of Speech in Digital Age",
  "Environmental Protection vs Industrial Development",
  "Reservation Policy - Constitutional Validity",
  "Death Penalty - Constitutional Morality",
  "Uniform Civil Code - Article 44",
  "Right to Education - Private Institutions",
  "Euthanasia and Right to Die with Dignity",
];

const StudentToolsPage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("moot");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Moot Court
  const [mootTopic, setMootTopic] = useState("");
  const [mootSide, setMootSide] = useState<string>("");
  const [mootArguments, setMootArguments] = useState("");

  // Case Brief
  const [caseText, setCaseText] = useState("");

  // Statute Simplifier
  const [statuteText, setStatuteText] = useState("");
  const [simplifyLevel, setSimplifyLevel] = useState("beginner");

  const getToken = () => session?.access_token || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleMootCourt = async () => {
    if (!mootTopic || !mootSide) {
      toast({ title: "Select topic and side", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    let accumulated = "";
    try {
      await streamAI({
        functionName: "student-tools",
        body: { tool: "moot_court", topic: mootTopic, side: mootSide, arguments: mootArguments },
        onDelta: (c) => { accumulated += c; setResult(accumulated); },
        onDone: () => setLoading(false),
        token: getToken(),
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleCaseBrief = async () => {
    if (!caseText.trim()) {
      toast({ title: "Enter case details", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    let accumulated = "";
    try {
      await streamAI({
        functionName: "student-tools",
        body: { tool: "case_brief", caseText },
        onDelta: (c) => { accumulated += c; setResult(accumulated); },
        onDone: () => setLoading(false),
        token: getToken(),
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleStatuteSimplify = async () => {
    if (!statuteText.trim()) {
      toast({ title: "Enter statute text", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    let accumulated = "";
    try {
      await streamAI({
        functionName: "student-tools",
        body: { tool: "statute_simplifier", statuteText, level: simplifyLevel },
        onDelta: (c) => { accumulated += c; setResult(accumulated); },
        onDone: () => setLoading(false),
        token: getToken(),
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-bold mb-1 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-secondary" />
          Student Hub
        </h1>
        <p className="text-muted-foreground text-sm mb-6">AI-powered tools for law students — moot court, case briefs, and statute simplification</p>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResult(""); }}>
          <TabsList className="bg-card/50 border border-border/20 mb-6">
            <TabsTrigger value="moot" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Gavel className="w-4 h-4 mr-2" /> Moot Court
            </TabsTrigger>
            <TabsTrigger value="brief" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <FileText className="w-4 h-4 mr-2" /> Case Brief
            </TabsTrigger>
            <TabsTrigger value="statute" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <BookOpen className="w-4 h-4 mr-2" /> Statute Simplifier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moot">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-card/50 border border-border/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" /> Moot Court Simulator
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Practice your argumentation skills. Select a topic, choose your side, and the AI judge will evaluate your arguments.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Topic</Label>
                    <Select value={mootTopic} onValueChange={setMootTopic}>
                      <SelectTrigger className="bg-background/50 border-border/30">
                        <SelectValue placeholder="Select moot topic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOOT_TOPICS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Your Side</Label>
                    <Select value={mootSide} onValueChange={setMootSide}>
                      <SelectTrigger className="bg-background/50 border-border/30">
                        <SelectValue placeholder="Choose side..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petitioner">Petitioner / Appellant</SelectItem>
                        <SelectItem value="respondent">Respondent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground">Your Arguments (optional)</Label>
                  <Textarea
                    value={mootArguments}
                    onChange={(e) => setMootArguments(e.target.value)}
                    placeholder="Present your arguments here for the AI judge to evaluate, or leave blank for the AI to generate a full moot court simulation..."
                    rows={5}
                    className="bg-background/50 border-border/30 placeholder:text-muted-foreground/50"
                  />
                </div>

                <Button onClick={handleMootCourt} disabled={loading || !mootTopic || !mootSide} className="bg-secondary text-secondary-foreground hover:bg-accent">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gavel className="w-4 h-4 mr-2" />}
                  Start Moot Court
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="brief">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-card/50 border border-border/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" /> Case Brief Generator
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Paste a case judgment or case details and get a structured IRAC-format brief with facts, issues, rules, analysis, and conclusion.
                </p>
                <Textarea
                  value={caseText}
                  onChange={(e) => setCaseText(e.target.value)}
                  placeholder="Paste the full case text, or enter the case name and key facts for the AI to generate a brief..."
                  rows={8}
                  className="bg-background/50 border-border/30 placeholder:text-muted-foreground/50 mb-4"
                />
                <Button onClick={handleCaseBrief} disabled={loading || !caseText.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Brief
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="statute">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-card/50 border border-border/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-secondary" /> Statute Simplifier
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Enter any Indian statute or legal section and get a plain-language explanation with examples.
                </p>
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground">Simplification Level</Label>
                  <Select value={simplifyLevel} onValueChange={setSimplifyLevel}>
                    <SelectTrigger className="bg-background/50 border-border/30 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (Layman)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1st Year)</SelectItem>
                      <SelectItem value="advanced">Advanced (Final Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={statuteText}
                  onChange={(e) => setStatuteText(e.target.value)}
                  placeholder="Enter statute text or section number (e.g., 'Section 302 IPC' or paste the full text of the section)..."
                  rows={6}
                  className="bg-background/50 border-border/30 placeholder:text-muted-foreground/50 mb-4"
                />
                <Button onClick={handleStatuteSimplify} disabled={loading || !statuteText.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                  Simplify
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {(result || loading) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 rounded-xl bg-card/50 border border-border/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                {activeTab === "moot" ? "Moot Court Judgment" : activeTab === "brief" ? "Case Brief" : "Simplified Explanation"}
              </h3>
              {result && !loading && (
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-secondary">
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Generating...</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentToolsPage;
