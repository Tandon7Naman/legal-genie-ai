import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Shield, Users, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface UserRow {
  user_id: string;
  full_name: string | null;
  firm_name: string | null;
  created_at: string;
  role: string;
}

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles with their roles
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, firm_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (profiles && roles) {
      const roleMap = new Map<string, string>();
      roles.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const merged = profiles.map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || "individual_lawyer",
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      fetchUsers();
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="border-b border-border/20 bg-primary/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground/60">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Link to="/" className="font-serif text-xl font-bold text-primary-foreground">
              Tandon <span className="text-gradient-gold">Associates</span>
            </Link>
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="text-primary-foreground/60">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: users.length },
            { icon: Briefcase, label: "Lawyers", value: users.filter((u) => u.role === "individual_lawyer").length },
            { icon: Shield, label: "Admins", value: users.filter((u) => u.role === "admin").length },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border border-border/20 bg-card/10 backdrop-blur-sm"
            >
              <s.icon className="w-6 h-6 text-secondary mb-2" />
              <p className="text-2xl font-bold text-primary-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* User Management */}
        <div className="rounded-xl border border-border/20 bg-card/10 backdrop-blur-sm overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-border/20">
            <h2 className="font-serif text-lg font-semibold text-primary-foreground">User Management</h2>
            <div className="ml-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9 w-60 bg-background/10 border-border/30 text-primary-foreground"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/20 hover:bg-transparent">
                  <TableHead className="text-primary-foreground/60">Name</TableHead>
                  <TableHead className="text-primary-foreground/60">Firm</TableHead>
                  <TableHead className="text-primary-foreground/60">Role</TableHead>
                  <TableHead className="text-primary-foreground/60">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.user_id} className="border-border/20">
                    <TableCell className="text-primary-foreground">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-primary-foreground/70">{u.firm_name || "—"}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v)}>
                        <SelectTrigger className="w-40 h-8 text-xs bg-background/10 border-border/30 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="individual_lawyer">Individual Lawyer</SelectItem>
                          <SelectItem value="law_firm">Law Firm</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-primary-foreground/50 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
