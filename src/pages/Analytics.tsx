import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Briefcase, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--destructive))", "#6366f1", "#10b981"];

const Analytics = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("cases").select("*").eq("user_id", user.id),
      supabase.from("clients").select("id").eq("user_id", user.id),
      supabase.from("invoices").select("*").eq("user_id", user.id),
      supabase.from("search_history").select("id").eq("user_id", user.id),
    ]).then(([c, cl, inv, sh]) => {
      if (c.data) setCases(c.data);
      if (cl.data) setClients(cl.data);
      if (inv.data) setInvoices(inv.data);
      if (sh.data) setSearchHistory(sh.data);
    });
  }, [user]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => { const area = c.practice_area || "Other"; counts[area] = (counts[area] || 0) + 1; });
    return Object.entries(counts).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const stats = [
    { label: "Total Cases", value: cases.length, icon: Briefcase, color: "text-secondary" },
    { label: "Active Cases", value: cases.filter((c) => c.status === "active").length, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Total Clients", value: clients.length, icon: Users, color: "text-blue-400" },
    { label: "AI Queries", value: searchHistory.length, icon: TrendingUp, color: "text-amber-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform usage insights and case statistics.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted/50 ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/30">
          <CardHeader><CardTitle className="text-base">Cases by Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No case data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader><CardTitle className="text-base">Practice Area Distribution</CardTitle></CardHeader>
          <CardContent>
            {areaData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No case data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
