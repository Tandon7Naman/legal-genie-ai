import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Users, Briefcase, BarChart3, FileText, TrendingUp, Activity, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useViewAsRole } from "@/hooks/useViewAsRole";
import { SELECTABLE_ROLES, ROLE_LABELS } from "@/lib/roleAccess";

interface UserRow {
  user_id: string;
  full_name: string | null;
  firm_name: string | null;
  created_at: string;
  role: string;
  free_access: boolean;
}

interface PlatformStats {
  totalUsers: number;
  activeCases: number;
  aiQueries: number;
  usersByRole: Record<string, number>;
}

const Admin = () => {
  const { toast } = useToast();
  const { viewAsRole, setViewAsRole } = useViewAsRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, activeCases: 0, aiQueries: 0, usersByRole: {},
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, firm_name, created_at, free_access");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profiles && roles) {
      const roleMap = new Map<string, string>();
      // A user can hold several roles (e.g. admin + account type).
      // Show the account type, falling back to admin when that is the only role.
      roles.forEach((r: any) => {
        const existing = roleMap.get(r.user_id);
        if (!existing || existing === "admin") roleMap.set(r.user_id, r.role);
      });
      setUsers(profiles.map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || "individual_lawyer",
        free_access: p.free_access || false,
      })));
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const [casesRes, searchRes] = await Promise.all([
      supabase.from("cases").select("status"),
      supabase.from("search_history").select("id"),
    ]);

    const roleCount: Record<string, number> = {};
    users.forEach((u) => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
    });

    setStats({
      totalUsers: users.length,
      activeCases: casesRes.data?.filter((c: any) => c.status === "active").length || 0,
      aiQueries: searchRes.data?.length || 0,
      usersByRole: roleCount,
    });
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (users.length > 0) fetchStats(); }, [users]);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated" }); fetchUsers(); }
  };

  const toggleFreeAccess = async (userId: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ free_access: !current }).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: !current ? "Free access granted" : "Free access revoked" });
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, free_access: !current } : u));
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-secondary" },
    { icon: Briefcase, label: "Active Cases", value: stats.activeCases, color: "text-emerald-400" },
    { icon: Activity, label: "AI Queries", value: stats.aiQueries, color: "text-blue-400" },
    { icon: Shield, label: "Admins", value: stats.usersByRole["admin"] || 0, color: "text-amber-400" },
  ];

  return (
    <div className="p-6">
      <h1 className="font-serif text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="mb-6 rounded-xl border border-border/20 bg-card/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-secondary mt-0.5" />
          <div>
            <p className="text-sm font-medium">View app as role</p>
            <p className="text-xs text-muted-foreground">
              Preview the sections a Student, Lawyer, Firm or Organization sees. Your own account type stays Admin.
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <Select
            value={viewAsRole ?? "admin_self"}
            onValueChange={(v) => setViewAsRole(v === "admin_self" ? null : (v as any))}
          >
            <SelectTrigger className="w-48 bg-background/50 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_self">Admin (my own view)</SelectItem>
              {SELECTABLE_ROLES.filter((r) => r !== "admin").map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {viewAsRole && (
            <Button variant="outline" size="sm" onClick={() => setViewAsRole(null)}>Reset</Button>
          )}
        </div>
      </div>


      <Tabs defaultValue="users">
        <TabsList className="bg-card/50 border border-border/20 mb-6">
          <TabsTrigger value="users" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl border border-border/20 bg-card/50">
                <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/20 bg-card/50 p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Users by Role</h3>
              <div className="space-y-3">
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${Math.min(100, (count / Math.max(stats.totalUsers, 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/20 bg-card/50 p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Platform Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium">Platform Growth</p>
                    <p className="text-xs text-muted-foreground">{stats.totalUsers} registered users</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">AI Usage</p>
                    <p className="text-xs text-muted-foreground">{stats.aiQueries} total queries processed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">Case Management</p>
                    <p className="text-xs text-muted-foreground">{stats.activeCases} active cases</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="rounded-xl border border-border/20 bg-card/50 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-border/20">
              <h2 className="font-serif text-lg font-semibold">User Management</h2>
              <div className="ml-auto flex gap-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-36 bg-background/50 border-border/30">
                    <SelectValue placeholder="Filter role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {["student", "individual_lawyer", "law_firm", "organization", "admin"].map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 w-60 bg-background/50 border-border/30" />
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/20 hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Free Access</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.user_id} className="border-border/20">
                      <TableCell>{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.firm_name || "—"}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v)}>
                          <SelectTrigger className="w-40 h-8 text-xs bg-background/50 border-border/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["student", "individual_lawyer", "law_firm", "organization", "admin"].map((r) => (
                              <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.free_access}
                          onCheckedChange={() => toggleFreeAccess(u.user_id, u.free_access)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
