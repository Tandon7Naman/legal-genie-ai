import { useState } from "react";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";

export function ClearSampleDataButton() {
  const { hasSampleData, clearSampleData } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  if (!hasSampleData) return null;

  const handleClear = async () => {
    setBusy(true);
    try {
      await clearSampleData();
      toast({ title: "Sample data cleared", description: "Your workspace is now empty and ready for real cases." });
    } catch (e: any) {
      toast({ title: "Could not clear sample data", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-tour="clear-sample"
      className="fixed top-14 right-4 z-50"
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full border-accent/40 bg-accent/10 text-foreground hover:bg-accent/20 shadow-md backdrop-blur-md text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Sample data
            <Trash2 className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the demo clients, cases, tasks, drafts and other example records we added when you first signed in. This action cannot be undone and the demo data will not be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Clearing...</> : "Clear sample data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}