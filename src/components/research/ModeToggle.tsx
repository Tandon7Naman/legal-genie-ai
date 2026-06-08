import { Button } from "@/components/ui/button";
import { Briefcase, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResearchMode = "professional" | "student";

export function ModeToggle({ mode, onChange }: { mode: ResearchMode; onChange: (m: ResearchMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border/30 bg-card/50 p-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onChange("professional")}
        className={cn("h-8 gap-1.5", mode === "professional" && "bg-secondary text-secondary-foreground hover:bg-accent")}
      >
        <Briefcase className="w-3.5 h-3.5" /> Professional
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onChange("student")}
        className={cn("h-8 gap-1.5", mode === "student" && "bg-secondary text-secondary-foreground hover:bg-accent")}
      >
        <GraduationCap className="w-3.5 h-3.5" /> Student
      </Button>
    </div>
  );
}