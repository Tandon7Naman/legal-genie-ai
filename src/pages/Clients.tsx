import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Users, Loader2, Search, Phone, Mail, Pencil, Trash2, MessageSquare, Briefcase } from "lucide-react";

interface Client {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; notes: string | null; created_at: string;
}

interface CommLog {
  id: string; type: string; subject: string | null; content: string; created_at: string;
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [linkedCases, setLinkedCases] = useState<{ id: string; title: string; status: string }[]>([]);
  const [newLog, setNewLog] = useState({ type: "note", subject: "", content: "" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setClients(data as Client[]);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const fetchClientDetails = async (client: Client) => {
    setSelectedClient(client);
    const [logsRes, casesRes] = await Promise.all([
      supabase.from("communication_log").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
      supabase.from("cases").select("id, title, status").eq("client_id", client.id),
    ]);
    if (logsRes.data) setCommLogs(logsRes.data as CommLog[]);
    if (casesRes.data) setLinkedCases(casesRes.data);
  };

  const addCommLog = async () => {
    if (!newLog.content.trim() || !user || !selectedClient) return;
    const { error } = await supabase.from("communication_log").insert({
      client_id: selectedClient.id, user_id: user.id,
      type: newLog.type, subject: newLog.subject || null, content: newLog.content,
    });
    if (!error) {
      setNewLog({ type: "note", subject: "", content: "" });
      fetchClientDetails(selectedClient);
    }
  };

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
    else { toast({ title: "Client deleted" }); fetchClients(); if (selectedClient?.id === clientId) setSelectedClient(null); }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search clients..." className="pl-10 bg-card/50 border-border/30" />
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{clients.length === 0 ? "No clients yet" : "No match"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => fetchClientDetails(c)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedClient?.id === c.id ? "bg-secondary/10 border-secondary/30" : "bg-card/50 border-border/20 hover:border-secondary/20"}`}
                >
                  <h3 className="font-medium text-sm">{c.name}</h3>
                  <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Client detail */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border/20 bg-card/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold">{selectedClient.name}</h2>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                  </div>
                  {selectedClient.address && <p className="text-sm text-muted-foreground mt-1">{selectedClient.address}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(selectedClient)} className="h-8 w-8 text-muted-foreground hover:text-secondary"><Pencil className="w-3.5 h-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Client</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{selectedClient.name}".</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteClient(selectedClient.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <Tabs defaultValue="communication">
                <TabsList className="bg-card/30 border border-border/20 mb-4">
                  <TabsTrigger value="communication"><MessageSquare className="w-4 h-4 mr-1" /> Communication</TabsTrigger>
                  <TabsTrigger value="cases"><Briefcase className="w-4 h-4 mr-1" /> Cases</TabsTrigger>
                </TabsList>

                <TabsContent value="communication" className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={newLog.content}
                      onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                      placeholder="Add a communication note..."
                      rows={2}
                      className="flex-1 bg-background/50 border-border/30"
                    />
                    <Button size="sm" onClick={addCommLog} disabled={!newLog.content.trim()} className="self-end bg-secondary text-secondary-foreground hover:bg-accent">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {commLogs.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">No communication logs</p>
                  ) : (
                    commLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-muted/20 border border-border/10">
                        <p className="text-sm">{log.content}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="cases">
                  {linkedCases.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">No linked cases</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedCases.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/10">
                          <span className="text-sm font-medium">{c.title}</span>
                          <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground py-20">
              <div className="text-center">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a client to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
