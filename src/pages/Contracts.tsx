import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Plus, Search, Trash2, Edit3, Briefcase, Calendar,
} from "lucide-react";

interface Contract {
  id: string;
  title: string;
  party: string;
  expiry: string | null;
  status: string;
  value: string | null;
  description: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  expiring: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const Contracts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", party: "", expiry: "", value: "", status: "active", description: "" });

  const fetchContracts = async () => {
    if (!user) return;
    const { data } = await supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setContracts(data);
  };

  useEffect(() => { fetchContracts(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.title || !form.party) return;
    const payload = { ...form, expiry: form.expiry || null, value: form.value || null, description: form.description || null, user_id: user.id };
    if (editingId) {
      await supabase.from("contracts").update(payload).eq("id", editingId);
      toast({ title: "Contract updated" });
    } else {
      await supabase.from("contracts").insert(payload);
      toast({ title: "Contract created" });
    }
    setOpen(false);
    setEditingId(null);
    setForm({ title: "", party: "", expiry: "", value: "", status: "active", description: "" });
    fetchContracts();
  };

  const handleEdit = (c: Contract) => {
    setEditingId(c.id);
    setForm({ title: c.title, party: c.party, expiry: c.expiry || "", value: c.value || "", status: c.status, description: c.description || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("contracts").delete().eq("id", id);
    toast({ title: "Contract deleted" });
    fetchContracts();
  };

  const filtered = contracts.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.party.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage agreements, track expiry dates, and monitor contract value.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm({ title: "", party: "", expiry: "", value: "", status: "active", description: "" }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="w-4 h-4" /> New Contract</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Contract</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contract title" /></div>
              <div><Label>Counterparty</Label><Input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="Party name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></div>
                <div><Label>Value (₹)</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 5,00,000" /></div>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Save Contract</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((c) => (
            <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="group hover:shadow-lg transition-all border-border/30">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{c.title}</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="w-3 h-3" /> {c.party}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[c.status] || ""}>{c.status}</Badge>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {c.value && <p className="text-lg font-semibold text-secondary">₹{c.value}</p>}
                  {c.expiry && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" /> Expires: {new Date(c.expiry).toLocaleDateString("en-IN")}
                    </div>
                  )}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Edit3 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "No contracts match your search." : "No contracts yet."}</p>
        </div>
      )}
    </div>
  );
};

export default Contracts;
