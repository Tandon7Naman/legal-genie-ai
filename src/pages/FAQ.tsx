import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_SECTIONS = [
  {
    title: "For Law Students",
    items: [
      { q: "Is Tandon Associates free for law students?", a: "Yes! Our Student tier is completely free. You get access to AI legal search, case summaries, document templates, the Moot Court Simulator, Case Brief Generator, and Statute Simplifier — all at no cost." },
      { q: "How does the Moot Court Simulator work?", a: "Select a constitutional or legal topic, choose your side (petitioner or respondent), and optionally present your arguments. The AI judge evaluates your arguments on legal reasoning, use of precedents, and persuasiveness, providing detailed feedback." },
      { q: "Can I use AI-generated case briefs for submissions?", a: "AI-generated briefs are study aids and reference materials. Always verify citations, cross-check with primary sources, and ensure your institution's academic integrity policy permits AI-assisted research." },
      { q: "What's the daily AI query limit for students?", a: "Student accounts get 5 AI queries per day. This resets at midnight IST. Upgrade to Individual for unlimited queries." },
    ],
  },
  {
    title: "For Individual Lawyers",
    items: [
      { q: "How accurate is the AI legal research?", a: "Our AI is trained on Indian legal databases and uses grounded intelligence frameworks (IPC, CrPC, CPC, etc.). However, all AI-generated content should be verified by a qualified professional before use in legal proceedings." },
      { q: "Can I manage my cases and clients on this platform?", a: "Yes. The platform includes full case management (status tracking, hearings, tasks, documents), client management (profiles, communication logs), calendar integration, and document storage." },
      { q: "How does the eCourts integration work?", a: "Enter a CNR (Case Number Record) to get real-time case status, hearing dates, and order details from the eCourts India system. You can also search cases by party name, advocate, or case type." },
      { q: "Is my data secure?", a: "Absolutely. We use 256-bit encryption, data is hosted in India, and all communications are encrypted via TLS. Row-level security ensures you can only access your own data." },
    ],
  },
  {
    title: "For Law Firms",
    items: [
      { q: "Can multiple team members share cases and clients?", a: "Yes, the Law Firm plan supports up to 10 team members with shared cases, clients, and documents. Team analytics give managing partners visibility across the firm." },
      { q: "Is there an audit trail for compliance?", a: "Yes. The platform maintains an immutable activity log tracking all actions (creates, updates, deletes, views) across cases, documents, and client records — essential for regulatory compliance." },
      { q: "Can we run conflict checks?", a: "The Conflict Checker searches across all your cases and clients to identify potential conflicts of interest before taking on new matters." },
      { q: "Do you support custom branding?", a: "The Law Firm plan includes custom branding options. Contact our team for details on white-labeling and customization." },
    ],
  },
  {
    title: "For Corporate & Audit Teams",
    items: [
      { q: "What compliance documentation is available?", a: "The platform provides compliance policy templates, corporate governance checklists, and risk management frameworks aligned with Indian regulatory requirements." },
      { q: "Can we export audit logs?", a: "Yes. Audit logs can be exported as CSV files with full details including timestamps, actions, entity types, and metadata — suitable for regulatory reporting." },
      { q: "Is there SSO and enterprise authentication?", a: "Enterprise plans include SSO integration, custom authentication workflows, and dedicated account management. Contact us for enterprise onboarding." },
      { q: "What reporting mechanisms are available?", a: "The Analytics dashboard provides case statistics, billing summaries, team performance metrics, and AI usage reports. All data can be exported for external reporting." },
    ],
  },
  {
    title: "General",
    items: [
      { q: "What courts and jurisdictions does the platform cover?", a: "The platform covers the Supreme Court of India, all High Courts, District Courts, and specialized tribunals (NCLT, NGT, DRT, ITAT, etc.). Research tools reference IPC, CrPC, CPC, and all major Indian statutes." },
      { q: "Can I cancel my subscription anytime?", a: "Yes. You can cancel at any time from your Settings page. Your data remains accessible until the end of your billing period." },
      { q: "How do I contact support?", a: "Email us at contact@tandonassociates.com, call +91 98765 43210, or use the Contact form on our homepage. We respond within 24 hours." },
      { q: "Is there a mobile app?", a: "The platform is fully responsive and works on all mobile devices and tablets through your browser. A dedicated mobile app is on our roadmap." },
    ],
  },
];

const FAQ = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
  <div className="min-h-screen bg-background">
    <SEO
      title="FAQ | Tandon Associates Legal Platform"
      description="Answers about Tandon Associates' AI legal research, case management, eCourts tracking, pricing, and security for Indian lawyers, firms, and students."
      path="/faq"
      jsonLd={faqJsonLd}
    />
    <header className="border-b border-border py-4">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <span className="font-serif text-xl font-bold">Tandon <span className="text-gradient-gold">Associates</span></span>
      </div>
    </header>
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-serif text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-10">Find answers for students, lawyers, firms, and enterprise teams.</p>

      {FAQ_SECTIONS.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-secondary rounded-full inline-block" />
            {section.title}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {section.items.map((item, i) => (
              <AccordionItem key={i} value={`${section.title}-${i}`} className="border border-border/30 rounded-xl px-4 data-[state=open]:border-secondary/30">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:text-secondary py-3">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </main>
  </div>
);
};

export default FAQ;
