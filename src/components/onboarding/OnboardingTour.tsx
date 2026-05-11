import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LayoutDashboard, Briefcase, Users, FileText, Search, Sparkles } from "lucide-react";

const STEPS = [
  { icon: Sparkles, title: "Welcome to Tandon Associates", body: "We've added a few sample clients, cases, drafts and tasks so you can explore the platform with real-looking data. You can clear it any time using the button at the top right." },
  { icon: LayoutDashboard, title: "Your Dashboard", body: "Drag-and-drop widgets show your active cases, upcoming hearings, recent research and personalized AI suggestions." },
  { icon: Briefcase, title: "Case Management", body: "Track every matter — hearings, judges, courts, tasks and notes — all linked to the relevant client." },
  { icon: Users, title: "Clients & Conflicts", body: "Manage your client roster, log every communication and run instant conflict checks before taking on new matters." },
  { icon: FileText, title: "AI Drafting Lab", body: "Generate notices, contracts and pleadings with AI assistance. Save versions and analyze briefs in one place." },
  { icon: Search, title: "Indian Legal Research", body: "Grounded in Indian statutes and precedents — filter by court, year and practice area. Citations are tagged Binding, Persuasive or Secondary." },
];

export function OnboardingTour() {
  const { shouldShowTour, markOnboardingCompleted, loading } = useOnboarding();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  if (loading || !shouldShowTour) return null;

  const Icon = STEPS[step].icon;
  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    await markOnboardingCompleted();
    navigate("/dashboard");
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) finish(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-2">
            <Icon className="w-6 h-6 text-accent" />
          </div>
          <DialogTitle className="font-serif text-xl">{STEPS[step].title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {STEPS[step].body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5 justify-center py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
            Skip tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}