import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type AuthorityLevel = "binding" | "persuasive" | "secondary";

interface SourceQualityBadgeProps {
  level: AuthorityLevel;
  court?: string;
}

const config: Record<AuthorityLevel, { label: string; icon: typeof Shield; className: string; description: string }> = {
  binding: {
    label: "Binding",
    icon: Shield,
    className: "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25",
    description: "Binding authority — must be followed by lower courts (Supreme Court or same High Court)",
  },
  persuasive: {
    label: "Persuasive",
    icon: AlertTriangle,
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25",
    description: "Persuasive authority — may be considered but not obligatory (other High Courts, foreign courts)",
  },
  secondary: {
    label: "Secondary",
    icon: Info,
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25",
    description: "Secondary source — textbooks, commentaries, law commission reports",
  },
};

export function SourceQualityBadge({ level, court }: SourceQualityBadgeProps) {
  const c = config[level];
  const Icon = c.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-[10px] gap-1 cursor-help ${c.className}`}>
          <Icon className="w-3 h-3" />
          {c.label}
          {court && <span className="opacity-70">• {court}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {c.description}
      </TooltipContent>
    </Tooltip>
  );
}

// Parse AI results to detect authority levels
export function detectAuthorityLevel(text: string): AuthorityLevel {
  const lower = text.toLowerCase();
  if (lower.includes("supreme court") || lower.includes("constitution bench") || lower.includes("full bench"))
    return "binding";
  if (lower.includes("high court") || lower.includes("tribunal") || lower.includes("district court"))
    return "persuasive";
  return "secondary";
}

// Extract citations from markdown and tag them
export function extractAndTagCitations(markdown: string): Array<{ text: string; level: AuthorityLevel; court?: string }> {
  const citations: Array<{ text: string; level: AuthorityLevel; court?: string }> = [];
  // Match common Indian case citation patterns
  const casePattern = /(?:\*\*)?([A-Z][a-zA-Z\s.]+(?:v\.|vs\.?|versus)\s+[A-Z][a-zA-Z\s.]+?)(?:\*\*)?[\s,]*\(?(\d{4})\)?/g;
  let match;
  while ((match = casePattern.exec(markdown)) !== null) {
    const fullCitation = match[0];
    const level = detectAuthorityLevel(markdown.substring(Math.max(0, match.index - 100), match.index + fullCitation.length + 100));
    let court: string | undefined;
    const surrounding = markdown.substring(Math.max(0, match.index - 50), match.index + fullCitation.length + 50);
    if (/supreme court/i.test(surrounding)) court = "SC";
    else if (/high court/i.test(surrounding)) court = "HC";
    else if (/tribunal/i.test(surrounding)) court = "Tribunal";
    citations.push({ text: fullCitation.trim(), level, court });
  }
  return citations;
}
