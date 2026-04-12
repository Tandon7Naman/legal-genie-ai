import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Scale, FileText, Search, ExternalLink, Gavel, Landmark, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LANDMARK_CASES = [
  { name: "Kesavananda Bharati v. State of Kerala (1973)", court: "Supreme Court", topic: "Basic Structure Doctrine", summary: "Established that Parliament cannot alter the basic structure of the Constitution. This landmark 13-judge bench decision remains the cornerstone of Indian constitutional law." },
  { name: "Maneka Gandhi v. Union of India (1978)", court: "Supreme Court", topic: "Right to Life & Liberty", summary: "Expanded Article 21 to include the right to live with dignity. Established that any law depriving personal liberty must be just, fair, and reasonable." },
  { name: "Vishaka v. State of Rajasthan (1997)", court: "Supreme Court", topic: "Sexual Harassment at Workplace", summary: "Laid down guidelines for preventing sexual harassment at the workplace, later codified into the POSH Act, 2013." },
  { name: "Navtej Singh Johar v. Union of India (2018)", court: "Supreme Court", topic: "Right to Privacy & Equality", summary: "Decriminalized consensual same-sex relations by reading down Section 377 IPC, affirming dignity and equality under Articles 14, 15, 19, and 21." },
  { name: "K.S. Puttaswamy v. Union of India (2017)", court: "Supreme Court", topic: "Right to Privacy", summary: "Declared the right to privacy as a fundamental right under Article 21, overruling earlier decisions. A 9-judge constitutional bench unanimous verdict." },
  { name: "Shreya Singhal v. Union of India (2015)", court: "Supreme Court", topic: "Freedom of Speech Online", summary: "Struck down Section 66A of the IT Act as unconstitutional, protecting online free speech while distinguishing discussion, advocacy, and incitement." },
  { name: "M.C. Mehta v. Union of India (1987)", court: "Supreme Court", topic: "Environmental Law", summary: "Introduced the principle of absolute liability for hazardous industries, going beyond Rylands v. Fletcher. Foundation of Indian environmental jurisprudence." },
  { name: "Indra Sawhney v. Union of India (1992)", court: "Supreme Court", topic: "Reservation Policy", summary: "Upheld 27% OBC reservation with a 50% ceiling, introduced the creamy layer concept, and laid down the framework for reservation in India." },
];

const IPC_QUICK_REF = [
  { section: "Section 299 & 300", title: "Culpable Homicide & Murder", description: "Defines culpable homicide and the exceptions that reduce murder to culpable homicide not amounting to murder." },
  { section: "Section 302", title: "Punishment for Murder", description: "Death or imprisonment for life, and fine. The gravest offence against the person." },
  { section: "Section 304A", title: "Death by Negligence", description: "Causing death by rash or negligent act not amounting to culpable homicide — up to 2 years imprisonment." },
  { section: "Section 354", title: "Assault on Woman", description: "Assault or criminal force to woman with intent to outrage her modesty — 1 to 5 years and fine." },
  { section: "Section 376", title: "Rape", description: "Defines rape and prescribes rigorous imprisonment not less than 10 years, extendable to life." },
  { section: "Section 420", title: "Cheating & Dishonesty", description: "Cheating and dishonestly inducing delivery of property — up to 7 years and fine." },
  { section: "Section 498A", title: "Cruelty by Husband/Relatives", description: "Husband or relative subjecting woman to cruelty — up to 3 years and fine." },
  { section: "Section 506", title: "Criminal Intimidation", description: "Threatening with injury to person, reputation, or property — up to 2 years (7 years for death/grievous hurt threats)." },
];

const CRPC_QUICK_REF = [
  { section: "Section 41", title: "When Police May Arrest Without Warrant", description: "Cognizable offence, proclaimed offender, possession of stolen property, obstruction of police, deserters, etc." },
  { section: "Section 125", title: "Maintenance of Wives, Children & Parents", description: "Magistrate may order maintenance for wife, children, and parents unable to maintain themselves." },
  { section: "Section 144", title: "Power to Issue Order in Urgent Cases", description: "Executive Magistrate can issue orders to prevent danger to public peace — basis for curfew and prohibitory orders." },
  { section: "Section 154", title: "FIR (First Information Report)", description: "Information relating to cognizable offence to be recorded. Basis of criminal investigation." },
  { section: "Section 161", title: "Examination of Witnesses by Police", description: "Police may examine any person acquainted with facts of the case during investigation." },
  { section: "Section 438", title: "Anticipatory Bail", description: "Direction for grant of bail to person apprehending arrest — High Court or Sessions Court." },
  { section: "Section 482", title: "Inherent Powers of High Court", description: "High Court's inherent power to make orders to prevent abuse of process or secure ends of justice." },
];

const STUDY_GUIDES = [
  { title: "How to Write a Case Brief (IRAC Method)", category: "Study Skills", description: "Master the Issue-Rule-Application-Conclusion format for analyzing any case judgment systematically.", icon: FileText },
  { title: "Understanding Constitutional Amendments", category: "Constitutional Law", description: "A chronological guide to all major constitutional amendments with their context and impact.", icon: Landmark },
  { title: "Criminal Procedure Flowchart", category: "Criminal Law", description: "Visual flowchart of criminal proceedings from FIR to final judgment, including bail and appeals.", icon: Gavel },
  { title: "Contract Drafting Essentials", category: "Corporate Law", description: "Key clauses every contract must have: indemnity, force majeure, dispute resolution, and termination.", icon: Scale },
  { title: "Moot Court Preparation Guide", category: "Advocacy Skills", description: "Step-by-step guide to preparing memorials, oral arguments, and court etiquette for moot competitions.", icon: Shield },
  { title: "Legal Research Methodology", category: "Research", description: "How to use Indian Kanoon, SCC Online, Manupatra, and AI tools for efficient legal research.", icon: Search },
];

const KnowledgeBase = () => {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filterItems = <T extends { title?: string; name?: string; section?: string }>(items: T[]) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      (item.title?.toLowerCase().includes(q)) ||
      (item.name?.toLowerCase().includes(q)) ||
      (item.section?.toLowerCase().includes(q))
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-bold mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-secondary" />
          Knowledge Base
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Curated legal resources, landmark cases, and statutory quick references for Indian law
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases, sections, guides..."
            className="pl-10 bg-card/50 border-border/30"
          />
        </div>

        <Tabs defaultValue="landmark">
          <TabsList className="bg-card/50 border border-border/20 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="landmark" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Scale className="w-4 h-4 mr-1.5" /> Landmark Cases
            </TabsTrigger>
            <TabsTrigger value="ipc" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Gavel className="w-4 h-4 mr-1.5" /> IPC Reference
            </TabsTrigger>
            <TabsTrigger value="crpc" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Landmark className="w-4 h-4 mr-1.5" /> CrPC Reference
            </TabsTrigger>
            <TabsTrigger value="guides" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <BookOpen className="w-4 h-4 mr-1.5" /> Study Guides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="landmark">
            <div className="space-y-3">
              {filterItems(LANDMARK_CASES).map((c) => (
                <Collapsible key={c.name} open={openSections[c.name]} onOpenChange={() => toggleSection(c.name)}>
                  <CollapsibleTrigger className="w-full text-left">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-colors">
                      <Scale className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold text-foreground text-sm">{c.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{c.court}</span>
                          <span className="text-xs text-muted-foreground">{c.topic}</span>
                        </div>
                      </div>
                      {openSections[c.name] ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-2 p-4 rounded-lg bg-muted/30 border border-border/10">
                      <p className="text-sm text-muted-foreground leading-relaxed">{c.summary}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filterItems(LANDMARK_CASES).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No cases match your search.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ipc">
            <div className="grid gap-3">
              {filterItems(IPC_QUICK_REF).map((s) => (
                <div key={s.section} className="p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                      <Gavel className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-secondary">{s.section}</span>
                        <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crpc">
            <div className="grid gap-3">
              {filterItems(CRPC_QUICK_REF).map((s) => (
                <div key={s.section} className="p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-secondary">{s.section}</span>
                        <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guides">
            <div className="grid sm:grid-cols-2 gap-4">
              {filterItems(STUDY_GUIDES).map((g) => (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-all hover:shadow-lg group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                    <g.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{g.category}</span>
                  <h3 className="font-serif font-semibold text-foreground mt-1 mb-2 text-sm">{g.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default KnowledgeBase;
