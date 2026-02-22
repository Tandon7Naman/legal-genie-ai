import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

const DraftingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [documentType, setDocumentType] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [subject, setSubject] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/document-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
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
            if (content) {
              accumulated += content;
              setResult(accumulated);
            }
          } catch {}
        }
      }

      setLoading(false);

      // Save to history
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
          <span className="text-sm text-primary-foreground/40">Document Drafting</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-2xl font-bold text-primary-foreground mb-1">
            <FileText className="w-6 h-6 inline mr-2 text-secondary" />
            AI Document Drafting
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Generate professional Indian legal documents instantly</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <Label className="text-primary-foreground/80 text-xs">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="bg-primary/20 border-border/30 text-primary-foreground">
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
              <Label className="text-primary-foreground/80 text-xs">Party A / Petitioner</Label>
              <Input value={partyA} onChange={(e) => setPartyA(e.target.value)} placeholder="Name of first party" className="bg-primary/20 border-border/30 text-primary-foreground" />
            </div>
            <div>
              <Label className="text-primary-foreground/80 text-xs">Party B / Respondent</Label>
              <Input value={partyB} onChange={(e) => setPartyB(e.target.value)} placeholder="Name of second party" className="bg-primary/20 border-border/30 text-primary-foreground" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-primary-foreground/80 text-xs">Subject / Matter</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject of the document" className="bg-primary/20 border-border/30 text-primary-foreground" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-primary-foreground/80 text-xs">Additional Details</Label>
              <Textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Any specific terms, conditions, clauses, or context to include..."
                rows={4}
                className="bg-primary/20 border-border/30 text-primary-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <Button onClick={handleDraft} disabled={loading || !documentType} className="bg-secondary text-secondary-foreground hover:bg-accent">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Draft
          </Button>
        </motion.div>

        {(result || loading) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 rounded-xl bg-primary/20 border border-border/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-primary-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" /> Generated Document
              </h3>
              {result && !loading && (
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-secondary">
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
            <div className="prose prose-sm prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_strong]:text-secondary">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Drafting document...</span>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DraftingPage;
