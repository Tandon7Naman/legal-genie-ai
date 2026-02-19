import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Search, FileText, Briefcase, Users, Settings, Shield } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, profile, roles, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const quickActions = [
    { icon: Search, label: "AI Research", desc: "Search Indian case law", href: "/research", color: "from-blue-500/20 to-blue-600/10" },
    { icon: FileText, label: "Draft Document", desc: "Generate legal documents", href: "/drafting", color: "from-emerald-500/20 to-emerald-600/10" },
    { icon: Briefcase, label: "My Cases", desc: "Manage active cases", href: "/cases", color: "from-amber-500/20 to-amber-600/10" },
    { icon: Users, label: "Clients", desc: "Client management", href: "/clients", color: "from-purple-500/20 to-purple-600/10" },
    { icon: Settings, label: "Settings", desc: "Profile & preferences", href: "/settings", color: "from-gray-500/20 to-gray-600/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Top bar */}
      <header className="border-b border-border/20 bg-primary/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-xl font-bold text-primary-foreground">
            Tandon <span className="text-gradient-gold">Associates</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-primary-foreground/70 hover:text-secondary"
              >
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <span className="text-sm text-primary-foreground/60">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-primary-foreground/60 hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl font-bold text-primary-foreground mb-1">
            Welcome back, {profile?.full_name || "Counsellor"}
          </h1>
          <p className="text-muted-foreground mb-8">
            Role: <span className="text-secondary capitalize">{roles[0]?.replace("_", " ") || "User"}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(action.href)}
              className={`group p-6 rounded-xl border border-border/20 bg-gradient-to-br ${action.color} backdrop-blur-sm hover:border-secondary/30 transition-all text-left`}
            >
              <action.icon className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-serif text-lg font-semibold text-primary-foreground">{action.label}</h3>
              <p className="text-sm text-muted-foreground">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
