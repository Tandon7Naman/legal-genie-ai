import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, Shield, ScrollText, Gavel, BookOpen } from "lucide-react";

export interface TemplateData {
  id: string;
  label: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  parameters: Record<string, string>;
}

const TEMPLATES: TemplateData[] = [
  {
    id: "writ-226",
    label: "Writ Petition (Article 226)",
    type: "petition",
    description: "Constitutional remedy before High Court under Article 226 for enforcement of fundamental rights or any other purpose.",
    icon: <Scale className="w-5 h-5" />,
    category: "Constitutional",
    parameters: { subType: "Writ Petition under Article 226", jurisdiction: "High Court", additionalDetails: "Include grounds for invoking writ jurisdiction, prayer for appropriate writ (mandamus/certiorari/prohibition/habeas corpus/quo warranto), and reference to fundamental rights violated." },
  },
  {
    id: "bail-438",
    label: "Bail Application (Section 438 BNSS)",
    type: "petition",
    description: "Anticipatory bail application under Section 438 of Bharatiya Nagarik Suraksha Sanhita before Sessions Court/High Court.",
    icon: <Shield className="w-5 h-5" />,
    category: "Criminal",
    parameters: { subType: "Anticipatory Bail Application under Section 438 BNSS", jurisdiction: "Sessions Court", additionalDetails: "Include FIR details, grounds for apprehension of arrest, clean antecedents, cooperation with investigation, and conditions for bail." },
  },
  {
    id: "legal-notice",
    label: "Legal Notice",
    type: "legal_notice",
    description: "Formal legal notice demanding compliance, payment, or action under applicable Indian statutes.",
    icon: <ScrollText className="w-5 h-5" />,
    category: "Civil",
    parameters: { additionalDetails: "Include cause of action, timeline of events, legal basis for demand, consequences of non-compliance, and reasonable time for response (typically 15-30 days)." },
  },
  {
    id: "affidavit",
    label: "Affidavit",
    type: "affidavit",
    description: "Sworn statement of facts verified on oath for submission before court or authority.",
    icon: <BookOpen className="w-5 h-5" />,
    category: "General",
    parameters: { additionalDetails: "Include verification clause, deponent details, purpose of affidavit, statement of facts in numbered paragraphs, and notary attestation format." },
  },
  {
    id: "civil-suit",
    label: "Civil Suit Plaint",
    type: "complaint",
    description: "Plaint for filing a civil suit under Code of Civil Procedure with cause of action and relief sought.",
    icon: <Gavel className="w-5 h-5" />,
    category: "Civil",
    parameters: { subType: "Civil Suit Plaint under CPC", additionalDetails: "Include jurisdiction details (pecuniary and territorial), cause of action with dates, valuation of suit, court fees, list of documents, and prayer for specific relief." },
  },
  {
    id: "written-statement",
    label: "Written Statement / Reply",
    type: "reply",
    description: "Defence reply to a civil suit plaint, addressing allegations paragraph-by-paragraph with counter-claims.",
    icon: <FileText className="w-5 h-5" />,
    category: "Civil",
    parameters: { additionalDetails: "Include preliminary objections (limitation, jurisdiction, maintainability), para-wise reply denying/admitting allegations, additional pleas, and counter-claim if applicable." },
  },
];

const categoryColors: Record<string, string> = {
  Constitutional: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Criminal: "bg-red-500/10 text-red-400 border-red-500/20",
  Civil: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  General: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface SmartTemplatesProps {
  onSelect: (template: TemplateData) => void;
}

export const SmartTemplates = ({ onSelect }: SmartTemplatesProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {TEMPLATES.map((t) => (
      <Card
        key={t.id}
        className="bg-card/50 border-border/20 hover:border-secondary/40 transition-all cursor-pointer group"
        onClick={() => onSelect(t)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold truncate">{t.label}</h4>
              </div>
              <Badge variant="outline" className={`text-[10px] mb-2 ${categoryColors[t.category] || ""}`}>
                {t.category}
              </Badge>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
