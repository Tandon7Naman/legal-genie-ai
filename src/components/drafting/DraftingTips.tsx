import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

const TIPS = [
  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, text: "Ensure jurisdictional clarity — specify the court and applicable territorial/pecuniary jurisdiction." },
  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, text: "Use active voice for stronger legal arguments (e.g., 'The petitioner submits' not 'It is submitted')." },
  { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, text: "Verify all citation formatting — use AIR/SCC/SCR formats consistently." },
  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, text: "Include limitation period analysis — check Section 3 of the Limitation Act, 1963." },
  { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, text: "Prayer clause must be specific and legally executable — avoid vague or overly broad reliefs." },
  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, text: "Number paragraphs sequentially and cross-reference them in arguments for clarity." },
];

export const DraftingTips = () => (
  <div className="rounded-xl bg-card/50 border border-border/20 p-4">
    <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
      <Lightbulb className="w-3.5 h-3.5 text-secondary" /> Drafting Tips
    </h3>
    <ul className="space-y-2">
      {TIPS.map((tip, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="mt-0.5 shrink-0">{tip.icon}</span>
          <span>{tip.text}</span>
        </li>
      ))}
    </ul>
  </div>
);
