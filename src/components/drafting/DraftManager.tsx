import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Edit3, Download, Trash2, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface SavedDraft {
  id: string;
  title: string;
  document_type: string;
  content: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface DraftManagerProps {
  onLoad: (draft: SavedDraft) => void;
  refreshKey?: number;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  final: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export const DraftManager = ({ onLoad, refreshKey }: DraftManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDrafts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Error loading drafts", description: error.message, variant: "destructive" });
    } else {
      setDrafts((data as SavedDraft[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrafts();
  }, [user, refreshKey]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_drafts").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Draft deleted" });
    }
  };

  const handleExport = (draft: SavedDraft) => {
    const blob = new Blob([draft.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Draft exported" });
  };

  const filtered = drafts.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.document_type.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="rounded-xl bg-card/50 border border-border/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-secondary" /> Recent Drafts
        </h3>
        <span className="text-xs text-muted-foreground">{drafts.length} drafts</span>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drafts..."
          className="pl-8 h-8 text-xs bg-background/50 border-border/30"
        />
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No drafts yet</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="group flex items-center gap-2 p-2.5 rounded-lg hover:bg-background/50 transition-colors cursor-pointer"
              onClick={() => onLoad(d)}
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[9px] h-4 ${statusColors[d.status] || ""}`}>
                    {d.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">v{d.version}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(d.updated_at), "MMM d, h:mm a")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onLoad(d); }}>
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleExport(d); }}>
                  <Download className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
