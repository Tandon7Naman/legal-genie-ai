import { motion } from "framer-motion";
import { Brain, FolderKanban, FileText, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Legal Research",
    desc: "Search Indian case law with AI-powered analysis. Get summaries, key holdings, and relevant precedents from Supreme Court, High Courts, and Tribunals.",
    highlight: "Powered by advanced AI",
  },
  {
    icon: FolderKanban,
    title: "Case Management",
    desc: "Track all your cases in one place — hearing dates, tasks, documents, and client communications with a visual timeline.",
    highlight: "Never miss a deadline",
  },
  {
    icon: FileText,
    title: "Document Drafting",
    desc: "Generate petitions, contracts, legal notices, and affidavits with AI assistance. Smart clause suggestions based on your practice area.",
    highlight: "Draft in minutes, not hours",
  },
  {
    icon: LayoutDashboard,
    title: "Custom Dashboard",
    desc: "Arrange your workspace with drag-and-drop widgets — recent cases, upcoming hearings, AI insights, and personalized recommendations.",
    highlight: "Your workflow, your way",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-primary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-4">
            Built for <span className="text-secondary">Modern</span> Lawyers
          </h2>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg">
            Everything you need to practice law more efficiently, all in one platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-navy-light/40 rounded-2xl p-8 border border-gold/10 hover:border-secondary/30 transition-all"
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <f.icon size={24} className="text-secondary" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{f.highlight}</span>
                  <h3 className="font-serif text-xl font-bold text-primary-foreground mt-1 mb-3">{f.title}</h3>
                  <p className="text-primary-foreground/50 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
