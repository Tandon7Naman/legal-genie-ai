import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
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
import { Receipt, Clock, Plus, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

const Finance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [invOpen, setInvOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const [invForm, setInvForm] = useState({ invoice_number: "", amount: "", status: "draft", due_date: "", description: "" });
  const [hrForm, setHrForm] = useState({ hours: "", rate: "", description: "", date: "" });

  const fetchData = async () => {
    if (!user) return;
    const [invRes, hrRes] = await Promise.all([
      supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("billable_hours").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (hrRes.data) setHours(hrRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const stats = useMemo(() => {
    const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount || 0), 0);
    const outstanding = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((a, i) => a + Number(i.amount || 0), 0);
    const totalHours = hours.reduce((a, h) => a + Number(h.hours || 0), 0);
    return { totalRevenue, outstanding, totalHours };
  }, [invoices, hours]);

  const handleInvoice = async () => {
    if (!user || !invForm.amount) return;
    await supabase.from("invoices").insert({ user_id: user.id, invoice_number: invForm.invoice_number || null, amount: Number(invForm.amount), status: invForm.status, due_date: invForm.due_date || null, description: invForm.description || null });
    toast({ title: "Invoice created" });
    setInvOpen(false);
    setInvForm({ invoice_number: "", amount: "", status: "draft", due_date: "", description: "" });
    fetchData();
  };

  const handleHours = async () => {
    if (!user || !hrForm.hours) return;
    await supabase.from("billable_hours").insert({ user_id: user.id, hours: Number(hrForm.hours), rate: Number(hrForm.rate || 0), description: hrForm.description || null, date: hrForm.date || new Date().toISOString().split("T")[0] });
    toast({ title: "Hours logged" });
    setHrOpen(false);
    setHrForm({ hours: "", rate: "", description: "", date: "" });
    fetchData();
  };

  const INV_STATUS: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-amber-500/15 text-amber-400",
    overdue: "bg-destructive/15 text-destructive",
    draft: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track invoices, billable hours, and revenue.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={invOpen} onOpenChange={setInvOpen}>
            <DialogTrigger asChild><Button className="gap-1.5"><Plus className="w-4 h-4" /> Invoice</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Invoice #</Label><Input value={invForm.invoice_number} onChange={(e) => setInvForm({ ...invForm, invoice_number: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Amount (₹)</Label><Input type="number" value={invForm.amount} onChange={(e) => setInvForm({ ...invForm, amount: e.target.value })} /></div>
                  <div><Label>Due Date</Label><Input type="date" value={invForm.due_date} onChange={(e) => setInvForm({ ...invForm, due_date: e.target.value })} /></div>
                </div>
                <div><Label>Status</Label>
                  <Select value={invForm.status} onValueChange={(v) => setInvForm({ ...invForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={invForm.description} onChange={(e) => setInvForm({ ...invForm, description: e.target.value })} /></div>
                <Button onClick={handleInvoice} className="w-full">Create Invoice</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={hrOpen} onOpenChange={setHrOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-1.5"><Clock className="w-4 h-4" /> Log Hours</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Billable Hours</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Hours</Label><Input type="number" step="0.5" value={hrForm.hours} onChange={(e) => setHrForm({ ...hrForm, hours: e.target.value })} /></div>
                  <div><Label>Rate (₹/hr)</Label><Input type="number" value={hrForm.rate} onChange={(e) => setHrForm({ ...hrForm, rate: e.target.value })} /></div>
                </div>
                <div><Label>Date</Label><Input type="date" value={hrForm.date} onChange={(e) => setHrForm({ ...hrForm, date: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={hrForm.description} onChange={(e) => setHrForm({ ...hrForm, description: e.target.value })} /></div>
                <Button onClick={handleHours} className="w-full">Log Hours</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue (YTD)", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Outstanding", value: `₹${stats.outstanding.toLocaleString("en-IN")}`, icon: AlertCircle, color: "text-amber-400" },
          { label: "Billable Hours", value: `${stats.totalHours} hrs`, icon: Clock, color: "text-blue-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted/50 ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices list */}
      <Card className="border-border/30">
        <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 10).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number || "Untitled Invoice"}</p>
                    <p className="text-xs text-muted-foreground">{inv.description || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">₹{Number(inv.amount).toLocaleString("en-IN")}</span>
                    <Badge variant="outline" className={INV_STATUS[inv.status] || ""}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;
