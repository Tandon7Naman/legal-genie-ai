import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FileText, Loader2, Sparkles, Copy, Check, List, BarChart3, BookOpen, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CollaborativeEditor } from "@/components/collaboration/CollaborativeEditor";
import { useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const DOCUMENT_TYPES = [
  { value: "petition", label: "Petition (Civil/Criminal/Writ)" },
  { value: "contract", label: "Contract / Agreement" },
  { value: "legal_notice", label: "Legal Notice" },
  { value: "affidavit", label: "Affidavit" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "lease_agreement", label: "Lease / Rental Agreement" },
  { value: "partnership_deed", label: "Partnership Deed" },
  { value: "will", label: "Will / Testament" },
  { value: "complaint", label: "Complaint" },
  { value: "reply", label: "Reply / Written Statement" },
];

// Extract headings from markdown for TOC
function extractHeadings(md: string) {
  const lines = md.split("\n");
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)/);
    if (match) {
      const text = match[2].replace(/[*_`]/g, "").trim();
      headings.push({
        level: match[1].length,
        text,
        id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    }
  }
  return headings;
}

// Compute document stats
function computeStats(md: string) {
  const plainText = md.replace(/[#*_`>\-\[\]()!|]/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(" ").length : 0;
  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim()).length;
  const paragraphs = md.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const headings = (md.match(/^#{1,6}\s/gm) || []).length;
  const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;

  // Complexity: based on avg sentence length and word count
  let complexity: "Simple" | "Moderate" | "Complex" | "Very Complex" = "Simple";
  if (avgWordsPerSentence > 25 || words > 2000) complexity = "Very Complex";
  else if (avgWordsPerSentence > 18 || words > 1000) complexity = "Complex";
  else if (avgWordsPerSentence > 12 || words > 500) complexity = "Moderate";

  const readingTime = Math.max(1, Math.ceil(words / 200));

  return { words, sentences, paragraphs, headings, avgWordsPerSentence, complexity, readingTime };
}

const DraftingPage = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();

  const [documentType, setDocumentType] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [subject, setSubject] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(true);

  const headings = useMemo(() => extractHeadings(result), [result]);
  const stats = useMemo(() => computeStats(result), [result]);

  const handleDraft = async () => {
    if (!documentType) {
      toast({ title: "Select document type", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    let accumulated = "";

    const parameters: Record<string, string> = {};
    if (partyA) parameters.partyA = partyA;
    if (partyB) parameters.partyB = partyB;
    if (subject) parameters.subject = subject;
    if (additionalDetails) parameters.additionalDetails = additionalDetails;

    try {
      const token = session?.access_token || "";
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/document-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentType, parameters }),
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
            if (content) { accumulated += content; setResult(accumulated); }
          } catch {}
        }
      }
      setLoading(false);

      if (user) {
        await supabase.from("search_history").insert({
          user_id: user.id,
          query_text: `${documentType}: ${subject || partyA || "document"}`,
          query_type: "draft",
          filters: parameters,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const complexityColor = {
    Simple: "text-green-500",
    Moderate: "text-yellow-500",
    Complex: "text-orange-500",
    "Very Complex": "text-red-500",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-bold mb-1">
          <FileText className="w-6 h-6 inline mr-2 text-secondary" />
          AI Document Drafting
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Generate professional Indian legal documents instantly</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-card/50 border-border/30">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Party A / Petitioner</Label>
            <Input value={partyA} onChange={(e) => setPartyA(e.target.value)} placeholder="Name of first party" className="bg-card/50 border-border/30" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Party B / Respondent</Label>
            <Input value={partyB} onChange={(e) => setPartyB(e.target.value)} placeholder="Name of second party" className="bg-card/50 border-border/30" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Subject / Matter</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject of the document" className="bg-card/50 border-border/30" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Additional Details</Label>
            <Textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Any specific terms, conditions, clauses..." rows={4} className="bg-card/50 border-border/30 placeholder:text-muted-foreground/50" />
          </div>
        </div>

        <Button onClick={handleDraft} disabled={loading || !documentType} className="bg-secondary text-secondary-foreground hover:bg-accent">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Draft
        </Button>
      </motion.div>

      {(result || loading) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          {/* Stats bar */}
          {result && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-card/50 border border-border/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span><strong className="text-foreground">{stats.words}</strong> words</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span><strong className="text-foreground">{stats.readingTime}</strong> min read</span>
              </div>
              <div>
                <span><strong className="text-foreground">{stats.sentences}</strong> sentences</span>
              </div>
              <div>
                <span><strong className="text-foreground">{stats.paragraphs}</strong> paragraphs</span>
              </div>
              <div>
                <span><strong className="text-foreground">{stats.headings}</strong> sections</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Complexity: </span>
                <strong className={complexityColor[stats.complexity]}>{stats.complexity}</strong>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowToc(!showToc)} className="h-7 text-xs text-muted-foreground hover:text-secondary">
                  <List className="w-3.5 h-3.5 mr-1" />
                  {showToc ? "Hide" : "Show"} TOC
                </Button>
                {!loading && (
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs text-muted-foreground hover:text-secondary">
                    {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* TOC Sidebar */}
            {showToc && headings.length > 0 && (
              <motion.aside
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block w-56 shrink-0"
              >
                <div className="sticky top-16 p-3 rounded-lg bg-card/50 border border-border/20">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5" /> Document Structure
                  </h4>
                  <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {headings.map((h, i) => (
                      <a
                        key={i}
                        href={`#${h.id}`}
                        className="block text-xs text-muted-foreground hover:text-secondary transition-colors truncate"
                        style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </motion.aside>
            )}

            {/* Document content */}
            <div className="flex-1 min-w-0 p-6 rounded-xl bg-card/50 border border-border/20">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-secondary" /> Generated Document
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary">
                <ReactMarkdown
                  components={{
                    h1: ({ children, ...props }) => {
                      const text = String(children).replace(/[*_`]/g, "").trim();
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h1 id={id} {...props}>{children}</h1>;
                    },
                    h2: ({ children, ...props }) => {
                      const text = String(children).replace(/[*_`]/g, "").trim();
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h2 id={id} {...props}>{children}</h2>;
                    },
                    h3: ({ children, ...props }) => {
                      const text = String(children).replace(/[*_`]/g, "").trim();
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h3 id={id} {...props}>{children}</h3>;
                    },
                    h4: ({ children, ...props }) => {
                      const text = String(children).replace(/[*_`]/g, "").trim();
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h4 id={id} {...props}>{children}</h4>;
                    },
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
              {loading && (
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Drafting document...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DraftingPage;
