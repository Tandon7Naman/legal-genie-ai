import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookmarkPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  content: string;
  sourceQuery?: string;
  title?: string;
}

export function SaveToCollectionDialog({ open, onOpenChange, content, sourceQuery, title }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("research_collections").select("id, name").order("created_at", { ascending: false }).then(({ data }) => {
      setCollections(data || []);
      if (data && data.length > 0 && !selected) setSelected(data[0].id);
    });
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let collectionId = selected;
      if (newName.trim()) {
        const { data, error } = await supabase.from("research_collections").insert({ user_id: user.id, name: newName.trim() }).select("id").single();
        if (error) throw error;
        collectionId = data.id;
      }
      if (!collectionId) {
        toast({ title: "Pick or create a collection", variant: "destructive" });
        setSaving(false);
        return;
      }
      const { error: itemErr } = await supabase.from("research_collection_items").insert({
        collection_id: collectionId,
        user_id: user.id,
        title: title || sourceQuery?.slice(0, 80) || "Saved research",
        content,
        source_query: sourceQuery,
      });
      if (itemErr) throw itemErr;
      toast({ title: "Saved to collection" });
      onOpenChange(false);
      setNewName("");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookmarkPlus className="w-4 h-4" /> Save to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {collections.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Existing collection</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Pick a collection" /></SelectTrigger>
                <SelectContent>
                  {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Or create new</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Section 138 NI Act research" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-accent">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-1" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}