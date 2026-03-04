import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Calendar, Loader2, Search } from "lucide-react";

type CaseStatus = "active" | "pending" | "closed" | "won" | "lost" | "settled";

interface Case {
  id: string; title: string; case_number: string | null; court: string | null;
  judge: string | null; status: CaseStatus; practice_area: string | null;
  description: string | null; next_hearing_date: string | null; client_id: string | null; created_at: string;
}

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", case_number: "", court: "", judge: "",
    status: "active" as CaseStatus, practice_area: "", description: "", next_hearing_date: "",
  });

  const fetchCases = async () => {
    const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading cases", description: error.message, variant: "destructive" });
    else setCases(data as Case[]);
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
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Case created" });
      setForm({ title: "", case_number: "", court: "", judge: "", status: "active", practice_area: "", description: "", next_hearing_date: "" });
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">My Cases</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-accent"><Plus className="w-4 h-4 mr-2" /> New Case</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/30 max-w-lg">
            <DialogHeader><DialogTitle className="font-serif">Create New Case</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label className="text-muted-foreground text-xs">Case Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background/50 border-border/30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Case Number</Label><Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} className="bg-background/50 border-border/30" /></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CaseStatus })}>
                    <SelectTrigger className="bg-background/50 border-border/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["active","pending","closed","won","lost","settled"] as CaseStatus[]).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search cases..." className="pl-10 bg-card/50 border-border/30" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-card/50 border-border/30"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(["active","pending","closed","won","lost","settled"] as CaseStatus[]).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
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
    </div>
  );
};

export default CasesPage;
