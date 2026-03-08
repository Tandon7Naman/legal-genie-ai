import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, BarChart3 } from "lucide-react";
import { SourceQualityBadge, extractAndTagCitations, type AuthorityLevel } from "./SourceQualityBadge";

interface SourceQualityPanelProps {
  markdown: string;
}

export function SourceQualityPanel({ markdown }: SourceQualityPanelProps) {
  const citations = useMemo(() => extractAndTagCitations(markdown), [markdown]);

  if (citations.length === 0) return null;

  const counts = citations.reduce(
    (acc, c) => { acc[c.level] = (acc[c.level] || 0) + 1; return acc; },
    {} as Record<AuthorityLevel, number>
  );

  const total = citations.length;
  const bindingPct = Math.round(((counts.binding || 0) / total) * 100);
  const persuasivePct = Math.round(((counts.persuasive || 0) / total) * 100);
  const secondaryPct = Math.round(((counts.secondary || 0) / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card/50 border border-border/20 mb-4"
    >
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" /> Source Quality Assessment
      </h4>

      {/* Progress bars */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 text-green-400">Binding</span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${bindingPct}%` }} />
          </div>
          <span className="w-8 text-right text-muted-foreground">{counts.binding || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 text-yellow-400">Persuasive</span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${persuasivePct}%` }} />
          </div>
          <span className="w-8 text-right text-muted-foreground">{counts.persuasive || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 text-blue-400">Secondary</span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${secondaryPct}%` }} />
          </div>
          <span className="w-8 text-right text-muted-foreground">{counts.secondary || 0}</span>
        </div>
      </div>

      {/* Citations list */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {citations.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <SourceQualityBadge level={c.level} court={c.court} />
            <span className="truncate text-muted-foreground">{c.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
