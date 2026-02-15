import { motion } from "framer-motion";
import { Brain, FolderKanban, FileText, LayoutDashboard, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Legal Research",
    desc: "Search Indian case law with AI-powered analysis. Get summaries, key holdings, and relevant precedents from Supreme Court, High Courts, and Tribunals.",
    highlight: "Powered by advanced AI",
    tag: "Most Popular",
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
    <section id="features" className="py-28 bg-gradient-mesh relative overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3 block">Platform</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-5">
            Built for <span className="text-gradient-gold">Modern</span> Lawyers
          </h2>
          <p className="text-primary-foreground/50 max-w-2xl mx-auto text-lg">
            Everything you need to practice law more efficiently, all in one platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-navy-light/40 rounded-2xl p-8 border border-secondary/8 hover:border-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/5"
            >
              {f.tag && (
                <div className="absolute -top-3 right-6 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {f.tag}
                </div>
              )}
              
              <div className="flex items-start gap-5">
                <div className="w-13 h-13 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 group-hover:glow-gold-sm transition-all duration-300">
                  <f.icon size={24} className="text-secondary" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-secondary/80 uppercase tracking-widest">{f.highlight}</span>
                  <h3 className="font-serif text-xl font-bold text-primary-foreground mt-1 mb-3 flex items-center gap-2">
                    {f.title}
                    <ArrowUpRight size={16} className="text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-primary-foreground/40 leading-relaxed text-[15px]">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
