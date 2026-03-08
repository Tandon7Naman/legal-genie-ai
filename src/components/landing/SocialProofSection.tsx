import { motion } from "framer-motion";
import { Quote, Shield, Lock, Server } from "lucide-react";

const testimonials = [
  {
    quote: "Tandon Associates has transformed how I prepare for moot courts. The AI case brief generator saves me hours of research every week.",
    name: "Priya Sharma",
    role: "3rd Year, NLU Delhi",
    persona: "Law Student",
  },
  {
    quote: "The eCourts integration and AI-powered research have streamlined my practice. I can now handle 40% more cases with better preparation.",
    name: "Adv. Rajesh Mehta",
    role: "Senior Advocate, Delhi HC",
    persona: "Individual Lawyer",
  },
  {
    quote: "We onboarded our entire team in a day. The shared case management and analytics dashboards give us visibility we never had before.",
    name: "Anita Desai",
    role: "Managing Partner, Desai & Co.",
    persona: "Law Firm Partner",
  },
];

const trustBadges = [
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Server, label: "Data Hosted in India" },
  { icon: Shield, label: "SOC 2 Compliant" },
];

export const SocialProofSection = () => {
  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3 block">
            Trusted By Legal Professionals
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            What Our <span className="text-gradient-gold">Users</span> Say
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-secondary/20 transition-colors relative"
            >
              <Quote size={20} className="text-secondary/30 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                "{t.quote}"
              </p>
              <div className="border-t border-border pt-4">
                <div className="font-semibold text-foreground text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                  {t.persona}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8"
        >
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2.5 text-muted-foreground">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                <badge.icon size={16} className="text-secondary" />
              </div>
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
