import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Calendar, Loader2, Search, LayoutList, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

type CaseStatus = "active" | "pending" | "closed" | "won" | "lost" | "settled";

interface Case {
  id: string; title: string; case_number: string | null; court: string | null;
  judge: string | null; status: CaseStatus; practice_area: string | null;
  description: string | null; next_hearing_date: string | null; client_id: string | null; created_at: string;
}

interface ClientOption { id: string; name: string; }

const statusColors: Record<CaseStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  won: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  settled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const CasesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [hearings, setHearings] = useState<{ id: string; date: string; case_id: string; purpose: string | null; cases: { title: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [form, setForm] = useState({
    title: "", case_number: "", court: "", judge: "",
    status: "active" as CaseStatus, practice_area: "", description: "", next_hearing_date: "", client_id: "",
  });

  const fetchCases = async () => {
    const [casesRes, clientsRes, hearingsRes] = await Promise.all([
      supabase.from("cases").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("hearings").select("id, date, case_id, purpose, cases(title)").order("date"),
    ]);
    if (casesRes.data) setCases(casesRes.data as Case[]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (hearingsRes.data) setHearings(hearingsRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("cases").insert({
      user_id: user.id, title: form.title, case_number: form.case_number || null,
      court: form.court || null, judge: form.judge || null, status: form.status,
      practice_area: form.practice_area || null, description: form.description || null,
      next_hearing_date: form.next_hearing_date || null,
      client_id: form.client_id || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Case created" });
      setForm({ title: "", case_number: "", court: "", judge: "", status: "active", practice_area: "", description: "", next_hearing_date: "", client_id: "" });
      setDialogOpen(false);
      fetchCases();
    }
    setSaving(false);
  };

  const filtered = cases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calendar rendering
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const getHearingsForDay = (day: Date) =>
    hearings.filter((h) => isSameDay(new Date(h.date), day));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">My Cases</h1>
        <div className="flex gap-2">
          <div className="flex bg-card/50 border border-border/20 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-sm ${viewMode === "calendar" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}>
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-accent"><Plus className="w-4 h-4 mr-2" /> New Case</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/30 max-w-lg">
              <DialogHeader><DialogTitle className="font-serif">Create New Case</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2 max-h-[70vh] overflow-y-auto">
                <div><Label className="text-muted-foreground text-xs">Case Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background/50 border-border/30" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-muted-foreground text-xs">Case Number</Label><Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} className="bg-background/50 border-border/30" /></div>
                  <div><Label className="text-muted-foreground text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CaseStatus })}>
                      <SelectTrigger className="bg-background/50 border-border/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["active", "pending", "closed", "won", "lost", "settled"] as CaseStatus[]).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Link Client</Label>
                  <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                    <SelectTrigger className="bg-background/50 border-border/30"><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-muted-foreground text-xs">Court</Label><Input value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="bg-background/50 border-border/30" /></div>
                  <div><Label className="text-muted-foreground text-xs">Judge</Label><Input value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} className="bg-background/50 border-border/30" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-muted-foreground text-xs">Practice Area</Label><Input value={form.practice_area} onChange={(e) => setForm({ ...form, practice_area: e.target.value })} placeholder="e.g. Criminal" className="bg-background/50 border-border/30" /></div>
                  <div><Label className="text-muted-foreground text-xs">Next Hearing</Label><Input type="date" value={form.next_hearing_date} onChange={(e) => setForm({ ...form, next_hearing_date: e.target.value })} className="bg-background/50 border-border/30" /></div>
                </div>
                <div><Label className="text-muted-foreground text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="bg-background/50 border-border/30" /></div>
                <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="w-full bg-secondary text-secondary-foreground hover:bg-accent">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create Case
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "list" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search cases..." className="pl-10 bg-card/50 border-border/30" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-card/50 border-border/30"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(["active", "pending", "closed", "won", "lost", "settled"] as CaseStatus[]).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{cases.length === 0 ? "No cases yet. Create your first case!" : "No cases match your filters."}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((c, i) => (
                <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="w-full text-left p-5 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-lg font-semibold group-hover:text-secondary transition-colors truncate">{c.title}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[c.status]}`}>{c.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {c.case_number && <span>#{c.case_number}</span>}
                        {c.court && <span>{c.court}</span>}
                        {c.practice_area && <span className="capitalize">{c.practice_area}</span>}
                      </div>
                    </div>
                    {c.next_hearing_date && (
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /> Next Hearing</div>
                        <span className="text-sm">{new Date(c.next_hearing_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "calendar" && (
        <div className="rounded-xl border border-border/20 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>← Prev</Button>
            <h2 className="font-serif text-lg font-semibold">{format(calendarMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>Next →</Button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 min-h-[80px]" />
            ))}
            {calendarDays.map((day) => {
              const dayHearings = getHearingsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 min-h-[80px] border border-border/10 rounded-lg ${isToday ? "bg-secondary/10 border-secondary/30" : "hover:bg-muted/20"}`}
                >
                  <span className={`text-sm ${isToday ? "font-bold text-secondary" : "text-muted-foreground"}`}>{format(day, "d")}</span>
                  {dayHearings.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => navigate(`/cases/${h.case_id}`)}
                      className="block w-full text-left text-[10px] mt-1 px-1.5 py-0.5 rounded bg-secondary/20 text-secondary truncate hover:bg-secondary/30"
                    >
                      {(h.cases as any)?.title || h.purpose || "Hearing"}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
