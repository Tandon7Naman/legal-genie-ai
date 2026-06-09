import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Save, Plus, Trash2, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Card { question: string; answer: string; custom?: boolean }

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
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [editing, setEditing] = useState(false);

  const addCustom = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setCards((prev) => {
      const next = [...prev, { question: newQ.trim(), answer: newA.trim(), custom: true }];
      setIdx(next.length - 1);
      return next;
    });
    setNewQ(""); setNewA(""); setShowAdd(false); setRevealed(false);
  };

  const deleteCurrent = () => {
    setCards((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setIdx((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
    setRevealed(false); setEditing(false);
  };

  const updateCurrent = (q: string, a: string) => {
    setCards((prev) => prev.map((c, i) => i === idx ? { ...c, question: q, answer: a, custom: true } : c));
  };

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
        {cards.length === 0 && !showAdd ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Generate study flashcards from this research, or create your own.</p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={generate} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-accent">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create your own
              </Button>
            </div>
          </div>
        ) : cards.length === 0 && showAdd ? (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Question</Label>
              <Textarea value={newQ} onChange={(e) => setNewQ(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Answer</Label>
              <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setShowAdd(false); setNewQ(""); setNewA(""); }}>Cancel</Button>
              <Button onClick={addCustom} disabled={!newQ.trim() || !newA.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
                <Plus className="w-4 h-4 mr-1" /> Add card
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Card {idx + 1} of {cards.length}{card?.custom ? " · custom" : ""}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing((e) => !e)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={deleteCurrent} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {editing && card ? (
                <div className="space-y-2 p-4 rounded-xl bg-card border border-border/30">
                  <Label className="text-xs text-muted-foreground">Question</Label>
                  <Textarea value={card.question} onChange={(e) => updateCurrent(e.target.value, card.answer)} rows={2} />
                  <Label className="text-xs text-muted-foreground">Answer</Label>
                  <Textarea value={card.answer} onChange={(e) => updateCurrent(card.question, e.target.value)} rows={3} />
                  <div className="flex justify-end"><Button size="sm" onClick={() => setEditing(false)}>Done</Button></div>
                </div>
              ) : (
                <button onClick={() => setRevealed((r) => !r)} className="w-full min-h-[180px] p-6 rounded-xl bg-card border border-border/30 hover:border-secondary/40 transition-colors text-left">
                  <div className="text-xs uppercase tracking-wide text-secondary mb-2">{revealed ? "Answer" : "Question"}</div>
                  <div className="text-sm leading-relaxed">{revealed ? card?.answer : card?.question}</div>
                  <div className="text-xs text-muted-foreground mt-3">Tap to {revealed ? "hide" : "reveal"}</div>
                </button>
              )}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => { setIdx((i) => Math.max(0, i - 1)); setRevealed(false); setEditing(false); }} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Add card</Button>
                <Button variant="ghost" size="sm" onClick={() => { setIdx((i) => Math.min(cards.length - 1, i + 1)); setRevealed(false); setEditing(false); }} disabled={idx === cards.length - 1}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              {showAdd && (
                <div className="space-y-2 p-3 rounded-xl bg-card/60 border border-border/30">
                  <Label className="text-xs text-muted-foreground">New question</Label>
                  <Textarea value={newQ} onChange={(e) => setNewQ(e.target.value)} rows={2} />
                  <Label className="text-xs text-muted-foreground">New answer</Label>
                  <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} rows={3} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewQ(""); setNewA(""); }}>Cancel</Button>
                    <Button size="sm" onClick={addCustom} disabled={!newQ.trim() || !newA.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">Add</Button>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Deck name</Label>
                <Input value={deckName} onChange={(e) => setDeckName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />} AI cards
              </Button>
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