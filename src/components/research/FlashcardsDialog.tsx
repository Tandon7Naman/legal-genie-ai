import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Save } from "lucide-react";

interface Card { question: string; answer: string }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  source: string;
  sourceQuery?: string;
  token: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function FlashcardsDialog({ open, onOpenChange, source, sourceQuery, token }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [deckName, setDeckName] = useState("My Deck");
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCards([]);
    setIdx(0);
    setRevealed(false);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/flashcards-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source, count: 6 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setCards(data.cards || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const saveDeck = async () => {
    if (!user || cards.length === 0) return;
    setSaving(true);
    try {
      const rows = cards.map((c) => ({ user_id: user.id, deck_name: deckName.trim() || "My Deck", question: c.question, answer: c.answer, source_query: sourceQuery }));
      const { error } = await supabase.from("study_flashcards").insert(rows);
      if (error) throw error;
      toast({ title: "Deck saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const card = cards[idx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Flashcards</DialogTitle></DialogHeader>
        {cards.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">Generate study flashcards from this research.</p>
            <Button onClick={generate} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-accent">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground text-center">Card {idx + 1} of {cards.length}</div>
              <button onClick={() => setRevealed((r) => !r)} className="w-full min-h-[180px] p-6 rounded-xl bg-card border border-border/30 hover:border-secondary/40 transition-colors text-left">
                <div className="text-xs uppercase tracking-wide text-secondary mb-2">{revealed ? "Answer" : "Question"}</div>
                <div className="text-sm leading-relaxed">{revealed ? card.answer : card.question}</div>
                <div className="text-xs text-muted-foreground mt-3">Tap to {revealed ? "hide" : "reveal"}</div>
              </button>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => { setIdx((i) => Math.max(0, i - 1)); setRevealed(false); }} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setIdx((i) => Math.min(cards.length - 1, i + 1)); setRevealed(false); }} disabled={idx === cards.length - 1}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Deck name</Label>
                <Input value={deckName} onChange={(e) => setDeckName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={generate} disabled={loading}>Regenerate</Button>
              <Button onClick={saveDeck} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-accent">
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save deck
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}