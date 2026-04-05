import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Loader2, Sparkles, Copy, Check, List, BarChart3, BookOpen,
  Users, Download, Save, LayoutTemplate, Brain, Lightbulb, ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CollaborativeEditor } from "@/components/collaboration/CollaborativeEditor";
import { SmartTemplates, type TemplateData } from "@/components/drafting/SmartTemplates";
import { BriefAnalyzer } from "@/components/drafting/BriefAnalyzer";
import { DraftingTips } from "@/components/drafting/DraftingTips";
import { DraftManager } from "@/components/drafting/DraftManager";
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

function extractHeadings(md: string) {
  const lines = md.split("\n");
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)/);
    if (match) {
      const text = match[2].replace(/[*_`]/g, "").trim();
      headings.push({ level: match[1].length, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    }
  }
  return headings;
}

function computeStats(md: string) {
  const plainText = md.replace(/[#*_`>\-\[\]()!|]/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(" ").length : 0;
  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim()).length;
  const paragraphs = md.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const headingCount = (md.match(/^#{1,6}\s/gm) || []).length;
  const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
  let complexity: "Simple" | "Moderate" | "Complex" | "Very Complex" = "Simple";
  if (avgWordsPerSentence > 25 || words > 2000) complexity = "Very Complex";
  else if (avgWordsPerSentence > 18 || words > 1000) complexity = "Complex";
  else if (avgWordsPerSentence > 12 || words > 500) complexity = "Moderate";
  return { words, sentences, paragraphs, headings: headingCount, avgWordsPerSentence, complexity, readingTime: Math.max(1, Math.ceil(words / 200)) };
}

const complexityColor = { Simple: "text-emerald-400", Moderate: "text-amber-400", Complex: "text-orange-400", "Very Complex": "text-red-400" };

const DraftingPage = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const collabId = searchParams.get("collab");

  // Form state
  const [documentType, setDocumentType] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [subject, setSubject] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Result state
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [showCollab, setShowCollab] = useState(!!collabId);

  // Draft management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"draft" | "review" | "final">("draft");
  const [draftVersion, setDraftVersion] = useState(1);
  const [draftRefreshKey, setDraftRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("compose");

  const collabDocId = collabId || `draft-${user?.id || "anon"}-${Date.now()}`;
  const headings = useMemo(() => extractHeadings(result), [result]);
  const stats = useMemo(() => computeStats(result), [result]);

  const handleTemplateSelect = useCallback((template: TemplateData) => {
    setDocumentType(template.type);
    setSubject(template.label);
    setAdditionalDetails(template.parameters.additionalDetails || "");
    setActiveTab("compose");
    toast({ title: `Template loaded: ${template.label}` });
  }, [toast]);

  const handleDraft = async () => {
    if (!documentType) { toast({ title: "Select document type", variant: "destructive" }); return; }
    setLoading(true);
    setResult("");
    let accumulated = "";

    const parameters: Record<string, string> = {};
    if (partyA) parameters.partyA = partyA;
    if (partyB) parameters.partyB = partyB;
    if (subject) parameters.subject = subject;
    if (additionalDetails) parameters.additionalDetails = additionalDetails;

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/document-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
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

      if (user) {
        await supabase.from("search_history").insert({
          user_id: user.id, query_text: `${documentType}: ${subject || partyA || "document"}`, query_type: "draft", filters: parameters,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !result) return;
    setSaving(true);
    const title = subject || `${DOCUMENT_TYPES.find(d => d.value === documentType)?.label || documentType} Draft`;
    const params = { partyA, partyB, subject, additionalDetails };

    try {
      if (currentDraftId) {
        const { error } = await supabase.from("saved_drafts").update({
          content: result, status: draftStatus, parameters: params, title, updated_at: new Date().toISOString(),
        }).eq("id", currentDraftId);
        if (error) throw error;
        toast({ title: "Draft updated" });
      } else {
        const { data, error } = await supabase.from("saved_drafts").insert({
          user_id: user.id, title, document_type: documentType, content: result, status: draftStatus, version: 1, parameters: params,
        }).select().single();
        if (error) throw error;
        setCurrentDraftId(data.id);
        toast({ title: "Draft saved" });
      }
      setDraftRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewVersion = async () => {
    if (!user || !result || !currentDraftId) return;
    setSaving(true);
    const title = subject || `${DOCUMENT_TYPES.find(d => d.value === documentType)?.label || documentType} Draft`;
    try {
      const { data, error } = await supabase.from("saved_drafts").insert({
        user_id: user.id, title, document_type: documentType, content: result,
        status: "draft", version: draftVersion + 1, parent_id: currentDraftId,
        parameters: { partyA, partyB, subject, additionalDetails },
      }).select().single();
      if (error) throw error;
      setCurrentDraftId(data.id);
      setDraftVersion(data.version);
      setDraftStatus("draft");
      setDraftRefreshKey((k) => k + 1);
      toast({ title: `Version ${data.version} created` });
    } catch (err: any) {
      toast({ title: "Version failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDraft = (draft: any) => {
    setResult(draft.content);
    setDocumentType(draft.document_type);
    setCurrentDraftId(draft.id);
    setDraftStatus(draft.status);
    setDraftVersion(draft.version);
    const p = draft.parameters as Record<string, string> | null;
    if (p) {
      setPartyA(p.partyA || "");
      setPartyB(p.partyB || "");
      setSubject(p.subject || "");
      setAdditionalDetails(p.additionalDetails || "");
    }
    setActiveTab("compose");
    toast({ title: `Loaded: ${draft.title}` });
  };

  const handleExportMd = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(subject || "draft").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported as Markdown" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-secondary" /> AI Document Drafting
            </h1>
            <p className="text-muted-foreground text-sm">Generate, analyze, and manage professional Indian legal documents</p>
          </div>
          {currentDraftId && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">v{draftVersion}</Badge>
              <Select value={draftStatus} onValueChange={(v: "draft" | "review" | "final") => setDraftStatus(v)}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card/50 border border-border/20">
            <TabsTrigger value="compose" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Compose</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1.5"><LayoutTemplate className="w-3.5 h-3.5" /> Templates</TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> My Drafts</TabsTrigger>
          </TabsList>

          {/* TEMPLATES TAB */}
          <TabsContent value="templates" className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-secondary" /> AI-Optimized Legal Templates
            </h2>
            <SmartTemplates onSelect={handleTemplateSelect} />
          </TabsContent>

          {/* MY DRAFTS TAB */}
          <TabsContent value="drafts">
            <DraftManager onLoad={handleLoadDraft} refreshKey={draftRefreshKey} />
          </TabsContent>

          {/* COMPOSE TAB */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: form + brief analyzer */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Document Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger className="bg-card/50 border-border/30"><SelectValue placeholder="Select document type..." /></SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((dt) => (<SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>))}
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
                    <Label className="text-xs text-muted-foreground">Additional Details / Instructions</Label>
                    <Textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Specific terms, conditions, clauses, legal framework references..." rows={4} className="bg-card/50 border-border/30 placeholder:text-muted-foreground/50" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleDraft} disabled={loading || !documentType} className="bg-secondary text-secondary-foreground hover:bg-accent">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {loading ? "AI is drafting..." : "Generate Draft"}
                  </Button>
                  {result && !loading && (
                    <>
                      <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="border-border/30">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {currentDraftId ? "Update Draft" : "Save Draft"}
                      </Button>
                      {currentDraftId && (
                        <Button variant="outline" onClick={handleNewVersion} disabled={saving} className="border-border/30">
                          <ChevronDown className="w-4 h-4 mr-2" /> New Version
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleExportMd} className="border-border/30">
                        <Download className="w-4 h-4 mr-2" /> Export
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setShowCollab(!showCollab)} className="border-border/30 text-muted-foreground hover:text-secondary">
                    <Users className="w-4 h-4 mr-2" /> {showCollab ? "Hide" : "Collaborate"}
                  </Button>
                </div>

                {/* Brief Analyzer */}
                <BriefAnalyzer
                  documentType={documentType}
                  onInsightGenerated={(insight) => {
                    if (!additionalDetails.includes("AI Analysis")) {
                      setAdditionalDetails((prev) => prev + (prev ? "\n\n" : "") + "--- AI Analysis Insights ---\n" + insight.slice(0, 500));
                    }
                  }}
                />
              </div>

              {/* Right column: tips */}
              <div className="space-y-4">
                <DraftingTips />
              </div>
            </div>

            {/* Collaborative Editor */}
            <AnimatePresence>
              {showCollab && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <CollaborativeEditor documentId={collabDocId} initialContent={result} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generated Document */}
            {(result || loading) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Stats bar */}
                {result && (
                  <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-card/50 border border-border/20 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /><span><strong className="text-foreground">{stats.words}</strong> words</span></div>
                    <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /><span><strong className="text-foreground">{stats.readingTime}</strong> min read</span></div>
                    <div><span><strong className="text-foreground">{stats.sentences}</strong> sentences</span></div>
                    <div><span><strong className="text-foreground">{stats.paragraphs}</strong> paragraphs</span></div>
                    <div><span><strong className="text-foreground">{stats.headings}</strong> sections</span></div>
                    <div className="flex items-center gap-1.5">
                      <span>Complexity: </span>
                      <strong className={complexityColor[stats.complexity]}>{stats.complexity}</strong>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowToc(!showToc)} className="h-7 text-xs text-muted-foreground hover:text-secondary">
                        <List className="w-3.5 h-3.5 mr-1" /> {showToc ? "Hide" : "Show"} TOC
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
                  {showToc && headings.length > 0 && (
                    <motion.aside initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block w-56 shrink-0">
                      <div className="sticky top-16 p-3 rounded-lg bg-card/50 border border-border/20">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> Document Structure</h4>
                        <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                          {headings.map((h, i) => (
                            <a key={i} href={`#${h.id}`} className="block text-xs text-muted-foreground hover:text-secondary transition-colors truncate" style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                              {h.text}
                            </a>
                          ))}
                        </nav>
                      </div>
                    </motion.aside>
                  )}

                  <div className="flex-1 min-w-0 p-6 rounded-xl bg-card/50 border border-border/20">
                    <h3 className="font-serif text-lg font-semibold flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-secondary" /> Generated Document
                      {currentDraftId && <Badge variant="outline" className="text-[10px] ml-2">v{draftVersion} · {draftStatus}</Badge>}
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary">
                      <ReactMarkdown
                        components={{
                          h1: ({ children, ...props }) => { const t = String(children).replace(/[*_`]/g, "").trim(); return <h1 id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {...props}>{children}</h1>; },
                          h2: ({ children, ...props }) => { const t = String(children).replace(/[*_`]/g, "").trim(); return <h2 id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {...props}>{children}</h2>; },
                          h3: ({ children, ...props }) => { const t = String(children).replace(/[*_`]/g, "").trim(); return <h3 id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {...props}>{children}</h3>; },
                          h4: ({ children, ...props }) => { const t = String(children).replace(/[*_`]/g, "").trim(); return <h4 id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {...props}>{children}</h4>; },
                        }}
                      >
                        {result}
                      </ReactMarkdown>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                        <div className="relative">
                          <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                          <div className="absolute inset-0 animate-ping rounded-full bg-secondary/20" />
                        </div>
                        <span className="text-sm font-medium">AI is drafting your document...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DraftingPage;
