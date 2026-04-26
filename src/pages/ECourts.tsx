import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Search, Loader2, AlertCircle, Gavel, RefreshCw,
  FileText, Users, Calendar, MapPin, Clock, ChevronRight,
  ExternalLink, Sparkles, Briefcase, Copy, X, RotateCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ECourtsPage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [cnrNumber, setCnrNumber] = useState("");
  const [caseData, setCaseData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("cnr");
  const [activeDetailTab, setActiveDetailTab] = useState<
    "orders" | "hearings" | "judgments" | "ias" | null
  >(null);
  const [orderAnalysis, setOrderAnalysis] = useState<
    Record<string, { text: string; loading: boolean; expanded: boolean; error?: string }>
  >({});

  // Search fields
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAdvocate, setSearchAdvocate] = useState("");
  const [searchCourt, setSearchCourt] = useState("");

  const callApi = async (body: any) => {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/ecourts-track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }
    return resp.json();
  };

  const handleCNRLookup = async () => {
    const trimmed = cnrNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!trimmed || trimmed.length !== 16) {
      toast({ title: "Enter a valid 16-character CNR number", variant: "destructive" });
      return;
    }
    setLoading(true);
    setCaseData(null);
    setActiveDetailTab(null);
    setOrderAnalysis({});
    try {
      const result = await callApi({ action: "case-detail", cnrNumber: trimmed });
      setCaseData(result.data);
    } catch (err: any) {
      toast({ title: "Lookup Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery && !searchAdvocate) {
      toast({ title: "Enter at least one search term", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearchResults(null);
    try {
      const result = await callApi({
        action: "search",
        searchParams: {
          ...(searchQuery && { query: searchQuery }),
          ...(searchAdvocate && { advocates: searchAdvocate }),
          ...(searchCourt && { courtCodes: searchCourt }),
          pageSize: 20,
        },
      });
      setSearchResults(result.data);
    } catch (err: any) {
      toast({ title: "Search Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (cnr: string) => {
    try {
      await callApi({ action: "refresh", cnrNumber: cnr });
      toast({ title: "Refresh Queued", description: "Case data will update in 5-10 seconds." });
      setTimeout(() => handleCNRLookup(), 8000);
    } catch (err: any) {
      toast({ title: "Refresh Failed", description: err.message, variant: "destructive" });
    }
  };

  const cd = caseData?.courtCaseData;

  // Normalize the eCourts response — the API uses different field names
  // (judgmentOrders, historyOfCaseHearings, interlocutoryApplications) than
  // our UI originally expected (orders/judgments/hearings/ias).
  const judgmentOrders: any[] = Array.isArray(cd?.judgmentOrders) ? cd.judgmentOrders : [];
  const ordersList: any[] = Array.isArray(cd?.orders) && cd.orders.length
    ? cd.orders
    : judgmentOrders.filter((o) =>
        (o.orderType || o.type || "").toString().toLowerCase().includes("order")
        || (!o.orderType && !o.type),
      );
  const judgmentsList: any[] = Array.isArray(cd?.judgments) && cd.judgments.length
    ? cd.judgments
    : judgmentOrders.filter((o) =>
        (o.orderType || o.type || "").toString().toLowerCase().includes("judg"),
      );
  // If neither filter matched (e.g. type strings unknown), fall back to
  // showing the same list everywhere so users can still see the records.
  const ordersFinal = ordersList.length ? ordersList : judgmentOrders;
  const judgmentsFinal = judgmentsList.length ? judgmentsList : (cd?.judgmentCount ? judgmentOrders : []);

  const hearingsFinal: any[] = Array.isArray(cd?.hearings) && cd.hearings.length
    ? cd.hearings
    : Array.isArray(cd?.historyOfCaseHearings) ? cd.historyOfCaseHearings : [];

  const iasFinal: any[] = Array.isArray(cd?.ias) && cd.ias.length
    ? cd.ias
    : Array.isArray(cd?.interlocutoryApplications) ? cd.interlocutoryApplications : [];

  const openDocProxy = async (rec: any) => {
    const raw =
      rec?.url || rec?.fileUrl || rec?.orderUrl || rec?.judgmentUrl ||
      rec?.documentUrl || rec?.filename || null;
    if (!raw || !cd?.cnr) return;
    if (/^https?:\/\//i.test(raw)) {
      window.open(raw, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ecourts-track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          action: "document-proxy",
          cnrNumber: cd.cnr,
          searchParams: { filename: raw },
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed to load document" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const ctype = resp.headers.get("content-type") || "";
      if (ctype.includes("application/json")) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Document not available from eCourts.");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const filename = (raw.split("/").pop() || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
      // Trigger a same-page download instead of opening a new tab. Browser
      // ad-blockers and popup blockers (ERR_BLOCKED_BY_CLIENT) commonly block
      // window.open(blobUrl), but anchor-driven downloads are not blocked.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ title: "PDF downloaded", description: a.download });
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      toast({ title: "Could not open PDF", description: err.message, variant: "destructive" });
    }
  };

  const toggleDetailTab = (
    tab: "orders" | "hearings" | "judgments" | "ias",
  ) => setActiveDetailTab((prev) => (prev === tab ? null : tab));

  const handleOrderAi = async (filename: string) => {
    if (!cd?.cnr || !filename || orderAi[filename]) return;
    setOrderAiLoading(filename);
    try {
      const res = await callApi({
        action: "order-ai",
        cnrNumber: cd.cnr,
        searchParams: { filename },
      });
      setOrderAi((prev) => ({ ...prev, [filename]: res.data || res }));
    } catch (err: any) {
      toast({ title: "AI Summary Failed", description: err.message, variant: "destructive" });
    } finally {
      setOrderAiLoading(null);
    }
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
      active
        ? "bg-secondary text-secondary-foreground border-secondary"
        : "bg-background/50 text-foreground border-border/30 hover:border-secondary/40 hover:text-foreground"
    }`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-7 h-7 text-secondary" />
          <h1 className="font-serif text-2xl font-bold">eCourts India</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6 ml-10">
          Live case tracking powered by the official eCourts Partner API
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 border border-border/20 mb-6">
            <TabsTrigger value="cnr">CNR Lookup</TabsTrigger>
            <TabsTrigger value="search">Case Search</TabsTrigger>
          </TabsList>

          {/* CNR Lookup */}
          <TabsContent value="cnr" className="space-y-4">
            <div className="p-4 rounded-xl bg-card/50 border border-border/20">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">CNR Number (16 characters)</Label>
                  <Input
                    value={cnrNumber}
                    onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleCNRLookup()}
                    placeholder="e.g. DLHC010001232024"
                    className="bg-background/50 border-border/30 font-mono tracking-wider"
                    maxLength={16}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCNRLookup} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-accent">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Track
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: "Delhi HC", code: "DLHC01" },
                  { label: "Bombay HC", code: "MHHC01" },
                  { label: "Madras HC", code: "TNHC01" },
                  { label: "Supreme Court", code: "SC" },
                ].map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCnrNumber(c.code)}
                    className="px-3 py-1 rounded-full text-xs bg-muted/50 border border-border/20 hover:border-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />{c.label}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Case Search */}
          <TabsContent value="search" className="space-y-4">
            <div className="p-4 rounded-xl bg-card/50 border border-border/20 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Keywords</Label>
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Contract, bail, writ..." className="bg-background/50 border-border/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Advocate Name</Label>
                  <Input value={searchAdvocate} onChange={(e) => setSearchAdvocate(e.target.value)} placeholder="e.g. Sharma" className="bg-background/50 border-border/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Court Code</Label>
                  <Input value={searchCourt} onChange={(e) => setSearchCourt(e.target.value.toUpperCase())} placeholder="e.g. DLHC01" className="bg-background/50 border-border/30" />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-accent">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Search Cases
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Case Detail Result */}
      <AnimatePresence>
        {cd && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            <div className="p-6 rounded-xl bg-card/50 border border-border/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-secondary" />
                    {cd.caseNumber || cd.cnr}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{cd.courtName} — {cd.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cd.caseStatus === "PENDING" ? "default" : "secondary"}>
                    {cd.caseStatus}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleRefresh(cd.cnr)} title="Refresh from source">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" /> <span>Filed: {cd.filingDate || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" /> <span>Next Hearing: {cd.nextHearingDate || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" /> <span>Type: {cd.caseType} — {cd.purpose || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" /> <span>Judge(s): {cd.judges?.join(", ") || "N/A"}</span>
                  </div>
                  {cd.actsAndSections && (
                    <div className="text-muted-foreground text-xs mt-1">
                      <strong>Acts:</strong> {cd.actsAndSections}
                    </div>
                  )}
                </div>
              </div>

              {/* Parties */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background/50 border border-border/10">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Petitioner(s)</h4>
                  {cd.petitioners?.map((p: string, i: number) => (
                    <p key={i} className="text-sm">{p}</p>
                  ))}
                  {cd.petitionerAdvocates?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Adv: {cd.petitionerAdvocates.join(", ")}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-background/50 border border-border/10">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Respondent(s)</h4>
                  {cd.respondents?.map((r: string, i: number) => (
                    <p key={i} className="text-sm">{r}</p>
                  ))}
                  {cd.respondentAdvocates?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Adv: {cd.respondentAdvocates.join(", ")}</p>
                  )}
                </div>
              </div>

              {/* Interactive Stat Chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(cd.orderCount > 0 || ordersFinal.length > 0) && (
                  <button
                    type="button"
                    onClick={() => toggleDetailTab("orders")}
                    className={chipClass(activeDetailTab === "orders")}
                  >
                    <FileText className="w-3 h-3" /> {cd.orderCount || ordersFinal.length} Orders
                  </button>
                )}
                {(cd.hearingCount > 0 || hearingsFinal.length > 0) && (
                  <button
                    type="button"
                    onClick={() => toggleDetailTab("hearings")}
                    className={chipClass(activeDetailTab === "hearings")}
                  >
                    <Clock className="w-3 h-3" /> {cd.hearingCount || hearingsFinal.length} Hearings
                  </button>
                )}
                {(cd.iaCount > 0 || iasFinal.length > 0) && (
                  <button
                    type="button"
                    onClick={() => toggleDetailTab("ias")}
                    className={chipClass(activeDetailTab === "ias")}
                  >
                    <Briefcase className="w-3 h-3" /> {cd.iaCount || iasFinal.length} IAs
                  </button>
                )}
                {(cd.judgmentCount > 0 || judgmentsFinal.length > 0) && (
                  <button
                    type="button"
                    onClick={() => toggleDetailTab("judgments")}
                    className={chipClass(activeDetailTab === "judgments")}
                  >
                    <Gavel className="w-3 h-3" /> {cd.judgmentCount || judgmentsFinal.length} Judgments
                  </button>
                )}
              </div>

              {/* Drill-down Panel */}
              <AnimatePresence initial={false}>
                {activeDetailTab && (
                  <motion.div
                    key={activeDetailTab}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border/20 space-y-2">
                      {activeDetailTab === "orders" && (
                        <>
                          {ordersFinal.length ? (
                            ordersFinal.map((o: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-background/50 border border-border/10"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {o.title || o.orderName || o.orderType || `Order dated ${o.date || o.orderDate || "—"}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {o.date || o.orderDate || "Date N/A"}
                                      {o.judge ? ` · ${o.judge}` : ""}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    {(o.url || o.fileUrl || o.orderUrl || o.judgmentUrl || o.documentUrl || o.filename) && (
                                      <button
                                        type="button"
                                        onClick={() => openDocProxy(o)}
                                        className="text-xs flex items-center gap-1 text-secondary hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" /> View PDF
                                      </button>
                                    )}
                                    {(o.filename || o.orderUrl) && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2"
                                        onClick={() => handleOrderAi(o.filename || o.orderUrl)}
                                        disabled={orderAiLoading === (o.filename || o.orderUrl)}
                                      >
                                        {orderAiLoading === (o.filename || o.orderUrl) ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-3 h-3 mr-1" />
                                        )}
                                        AI Summary
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {(o.filename || o.orderUrl) && orderAi[o.filename || o.orderUrl] && (
                                  <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                                    {orderAi[o.filename || o.orderUrl].summary ||
                                      orderAi[o.filename || o.orderUrl].orderSummary ||
                                      JSON.stringify(orderAi[o.filename || o.orderUrl]).slice(0, 400)}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No order records available.
                            </p>
                          )}
                        </>
                      )}

                      {activeDetailTab === "hearings" && (
                        <>
                          {hearingsFinal.length ? (
                            hearingsFinal.map((h: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-background/50 border border-border/10"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {h.hearingDate || h.date || h.businessOnDate || h.businessDate || "Date N/A"}
                                  </p>
                                  {(h.purpose || h.purposeOfListing) && (
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground">
                                      {h.purpose || h.purposeOfListing}
                                    </span>
                                  )}
                                </div>
                                {h.judge && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Judge: {h.judge}
                                  </p>
                                )}
                                {(h.business || h.outcome || h.notes || h.businessOnDate) && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {h.business || h.outcome || h.notes ||
                                      (h.businessOnDate ? `Business on: ${h.businessOnDate}` : "")}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No hearing records available.
                            </p>
                          )}
                        </>
                      )}

                      {activeDetailTab === "judgments" && (
                        <>
                          {judgmentsFinal.length ? (
                            judgmentsFinal.map((j: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-background/50 border border-border/10"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {j.title || j.orderType || `Judgment dated ${j.date || j.orderDate || j.judgmentDate || "—"}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {j.date || j.orderDate || j.judgmentDate || "Date N/A"}
                                      {j.judge ? ` · ${j.judge}` : ""}
                                    </p>
                                  </div>
                                  {(j.url || j.fileUrl || j.orderUrl || j.judgmentUrl || j.documentUrl || j.filename) && (
                                    <button
                                      type="button"
                                      onClick={() => openDocProxy(j)}
                                      className="text-xs flex items-center gap-1 text-secondary hover:underline shrink-0"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View PDF
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No judgment records available.
                            </p>
                          )}
                        </>
                      )}

                      {activeDetailTab === "ias" && (
                        <>
                          {iasFinal.length ? (
                            iasFinal.map((ia: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-background/50 border border-border/10"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {ia.iaNumber || ia.number || `IA #${i + 1}`}
                                  </p>
                                  {ia.status && (
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground">
                                      {ia.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Filed: {ia.filingDate || ia.date || "N/A"}
                                  {ia.party ? ` · ${ia.party}` : ""}
                                </p>
                                {ia.purpose && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {ia.purpose}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No interlocutory applications available.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Analysis */}
            {caseData?.caseAiAnalysis && (
              <div className="p-4 rounded-xl bg-card/50 border border-border/20">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-secondary" /> AI Case Analysis
                </h3>
                <p className="text-sm text-muted-foreground">{caseData.caseAiAnalysis.caseSummary}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{caseData.caseAiAnalysis.caseType}</Badge>
                  <Badge variant="outline">Complexity: {caseData.caseAiAnalysis.complexity}</Badge>
                </div>
                {caseData.caseAiAnalysis.keyIssues?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {caseData.caseAiAnalysis.keyIssues.map((issue: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{issue}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold">
                Search Results ({searchResults.totalHits?.toLocaleString() || 0})
              </h3>
              {searchResults.processingTimeMs && (
                <span className="text-xs text-muted-foreground">{searchResults.processingTimeMs}ms</span>
              )}
            </div>
            <div className="space-y-3">
              {searchResults.results?.map((r: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-colors cursor-pointer"
                  onClick={() => {
                    if (r.cnr) {
                      setCnrNumber(r.cnr);
                      setActiveTab("cnr");
                      callApi({ action: "case-detail", cnrNumber: r.cnr })
                        .then((res) => setCaseData(res.data))
                        .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{r.cnr || "—"}</span>
                        <Badge variant={r.caseStatus === "PENDING" ? "default" : "secondary"} className="text-xs">
                          {r.caseStatus}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {r.petitioners?.[0] || "Unknown"} vs {r.respondents?.[0] || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.caseType} · Filed: {r.filingDate || "N/A"} · Next: {r.nextHearingDate || "N/A"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </div>
                </div>
              ))}
              {(!searchResults.results || searchResults.results.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No cases found. Try different search terms.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !caseData && !searchResults && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Fetching from eCourts...</span>
        </div>
      )}
    </div>
  );
};

export default ECourtsPage;
