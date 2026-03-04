import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Users, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface UserRow { user_id: string; full_name: string | null; firm_name: string | null; created_at: string; role: string; }

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, firm_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profiles && roles) {
      const roleMap = new Map<string, string>();
      roles.forEach((r: any) => roleMap.set(r.user_id, r.role));
      setUsers(profiles.map((p: any) => ({ ...p, role: roleMap.get(p.user_id) || "individual_lawyer" })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated" }); fetchUsers(); }
  };

  const filtered = users.filter((u) => (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Users", value: users.length },
          { icon: Briefcase, label: "Lawyers", value: users.filter((u) => u.role === "individual_lawyer").length },
          { icon: Shield, label: "Admins", value: users.filter((u) => u.role === "admin").length },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl border border-border/20 bg-card/50">
            <s.icon className="w-6 h-6 text-secondary mb-2" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border/20 bg-card/50 overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-border/20">
          <h2 className="font-serif text-lg font-semibold">User Management</h2>
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 w-60 bg-background/50 border-border/30" />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/20 hover:bg-transparent">
                <TableHead>Name</TableHead><TableHead>Firm</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.user_id} className="border-border/20">
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.firm_name || "—"}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v)}>
                      <SelectTrigger className="w-40 h-8 text-xs bg-background/50 border-border/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["student","individual_lawyer","law_firm","organization","admin"].map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Admin;
