import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scale, Save } from "lucide-react";

interface Brief { title?: string; issue?: string; rule?: string; application?: string; conclusion?: string; citations?: { text: string; court?: string | null }[] }

interface Props { open: boolean; onOpenChange: (o: boolean) => void; source: string; sourceQuery?: string; token: string }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function IracBriefDialog({ open, onOpenChange, source, sourceQuery, token }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [cases, setCases] = useState<{ id: string; title: string }[]>([]);
  const [caseId, setCaseId] = useState<string>("none");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBrief(null); setTitle(""); setCaseId("none");
    supabase.from("cases").select("id, title").order("created_at", { ascending: false }).limit(50).then(({ data }) => setCases(data || []));
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const generate = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/research-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setBrief(data.brief || null);
      setTitle(data.brief?.title || sourceQuery?.slice(0, 80) || "IRAC Brief");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (!user || !brief) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("research_briefs").insert({
        user_id: user.id,
        case_id: caseId === "none" ? null : caseId,
        title: title.trim() || "IRAC Brief",
        source_query: sourceQuery,
        irac: brief as any,
      });
      if (error) throw error;
      toast({ title: "Brief saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Scale className="w-4 h-4 text-secondary" /> IRAC Brief</DialogTitle></DialogHeader>
        {loading && <div className="py-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>}
        {brief && !loading && (
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            {(["issue","rule","application","conclusion"] as const).map((k) => (
              <div key={k} className="p-3 rounded-lg bg-card/60 border border-border/20">
                <div className="text-xs uppercase tracking-wide text-secondary font-semibold mb-1">{k}</div>
                <p className="whitespace-pre-wrap leading-relaxed">{(brief as any)[k] || "—"}</p>
              </div>
            ))}
            {brief.citations && brief.citations.length > 0 && (
              <div className="p-3 rounded-lg bg-card/60 border border-border/20">
                <div className="text-xs uppercase tracking-wide text-secondary font-semibold mb-2">Citations</div>
                <ul className="space-y-1 list-disc pl-4">
                  {brief.citations.map((c, i) => <li key={i}>{c.text}{c.court ? ` — ${c.court}` : ""}</li>)}
                </ul>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Attach to case (optional)</Label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={generate} disabled={loading}>Regenerate</Button>
          <Button onClick={save} disabled={saving || !brief} className="bg-secondary text-secondary-foreground hover:bg-accent">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save brief
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}