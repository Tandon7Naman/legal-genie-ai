import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, ShieldCheck } from "lucide-react";

const Team = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    // Admins can view all profiles
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*, user_roles(role)");
      if (data) setMembers(data);
    };
    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground text-sm">Team management is available for firm administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your firm's professionals and their access levels.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const roles = m.user_roles?.map((r: any) => r.role) || [];
          const initials = (m.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Card key={m.id} className="border-border/30 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="bg-secondary/20 text-secondary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.firm_name || m.institution || "—"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role: string) => (
                    <Badge key={role} variant="outline" className="text-xs capitalize">{role.replace("_", " ")}</Badge>
                  ))}
                </div>
                {m.bar_council_number && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" /> BCI: {m.bar_council_number}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No team members found.</p>
        </div>
      )}
    </div>
  );
};

export default Team;
