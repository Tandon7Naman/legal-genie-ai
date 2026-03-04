import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Users, Loader2, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";

interface Client {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; notes: string | null; created_at: string;
}

const ClientsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setClients(data as Client[]);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const resetForm = () => { setForm({ name: "", email: "", phone: "", address: "", notes: "" }); setEditingClient(null); };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({ name: client.name, email: client.email || "", phone: client.phone || "", address: client.address || "", notes: client.notes || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !user) return;
    setSaving(true);
    if (editingClient) {
      const { error } = await supabase.from("clients").update({ name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null, notes: form.notes || null }).eq("id", editingClient.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Client updated" });
    } else {
      const { error } = await supabase.from("clients").insert({ user_id: user.id, name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null, notes: form.notes || null });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Client added" });
    }
    resetForm(); setDialogOpen(false); fetchClients(); setSaving(false);
  };

  const deleteClient = async (clientId: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Client deleted" }); fetchClients(); }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">Clients</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-accent"><Plus className="w-4 h-4 mr-2" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/30">
            <DialogHeader><DialogTitle className="font-serif">{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label className="text-muted-foreground text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border/30" /></div>
                <div><Label className="text-muted-foreground text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background/50 border-border/30" /></div>
              </div>
              <div><Label className="text-muted-foreground text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-background/50 border-border/30" /></div>
              <div><Label className="text-muted-foreground text-xs">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="bg-background/50 border-border/30" /></div>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full bg-secondary text-secondary-foreground hover:bg-accent">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingClient ? "Update Client" : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search clients..." className="pl-10 bg-card/50 border-border/30" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{clients.length === 0 ? "No clients yet. Add your first client!" : "No clients match your search."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold">{c.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                  </div>
                  {c.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-muted-foreground hover:text-secondary"><Pencil className="w-3.5 h-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Client</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{c.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteClient(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
