import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Activity, Filter, Search, Clock, FileText, Briefcase, Users, File, Scale, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const ENTITY_ICONS: Record<string, any> = {
  case: Briefcase,
  document: FileText,
  client: Users,
  contract: File,
  hearing: Scale,
  invoice: FileText,
  draft: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-500/15 text-green-500",
  updated: "bg-blue-500/15 text-blue-500",
  deleted: "bg-destructive/15 text-destructive",
  viewed: "bg-muted text-muted-foreground",
  exported: "bg-secondary/15 text-secondary",
};

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const AuditLog = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterType !== "all") query = query.eq("entity_type", filterType);
      if (filterAction !== "all") query = query.eq("action", filterAction);

      const { data, error } = await query;
      if (!error && data) setLogs(data as ActivityItem[]);
      setLoading(false);
    };
    fetchLogs();
  }, [user, filterType, filterAction]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.entity_title?.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const rows = [["Date", "Action", "Type", "Title", "Details"]];
    filtered.forEach((l) => {
      rows.push([
        format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
        l.action,
        l.entity_type,
        l.entity_title || "",
        JSON.stringify(l.details || {}),
      ]);
    });
    const escapeCell = (v: string) => {
      const s = String(v ?? "");
      const escaped = s.replace(/"/g, '""');
      const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
      return `"${safe}"`;
    };
    const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold mb-1 flex items-center gap-2">
              <Activity className="w-6 h-6 text-secondary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? "Platform-wide activity trail for compliance and oversight" : "Your activity history across the platform"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-border/30 hover:border-secondary/30">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity..." className="pl-10 bg-card/50 border-border/30" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-card/50 border-border/30">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="case">Cases</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-36 bg-card/50 border-border/30">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="exported">Exported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log entries */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No activity recorded yet</p>
            <p className="text-sm mt-1">Actions you take across the platform will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => {
              const Icon = ENTITY_ICONS[log.entity_type] || Activity;
              const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS.viewed;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/20 hover:border-border/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                    </div>
                    <p className="text-sm text-foreground truncate mt-0.5">
                      {log.entity_title || "Untitled"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuditLog;
