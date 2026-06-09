import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Student",
    price: "Free",
    desc: "For law students building their knowledge",
    features: ["AI Legal Search", "Case Summaries", "Document Templates", "5 AI Queries / day", "Community Support"],
    cta: "Create account",
    highlighted: false,
  },
  {
    name: "Individual",
    price: "₹2,999",
    period: "/month",
    desc: "For independent practitioners",
    features: ["Everything in Student", "Unlimited AI Queries", "Case Management", "Client Management", "Document Drafting", "Priority Support"],
    cta: "Create account",
    highlighted: true,
  },
  {
    name: "Law Firm",
    price: "₹9,999",
    period: "/month",
    desc: "For small to mid-size firms",
    features: ["Everything in Individual", "Up to 10 Team Members", "Shared Cases & Clients", "Team Analytics", "Custom Branding", "Dedicated Support"],
    cta: "Contact Sales",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For large organizations",
    features: ["Everything in Law Firm", "Unlimited Team Members", "API Access", "SSO & Compliance", "Custom Integrations", "Account Manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-28 bg-muted/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3 block">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-5">
            Simple, Transparent <span className="text-gradient-gold">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Start free as a student, scale as your practice grows
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 border flex flex-col transition-all duration-300 ${
                tier.highlighted
                  ? "bg-primary border-secondary/30 shadow-2xl shadow-secondary/10 scale-[1.03] glow-gold"
                  : "bg-card border-border hover:border-secondary/20 hover:shadow-lg"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-secondary text-secondary-foreground text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                  <Star size={12} fill="currentColor" /> Most Popular
                </div>
              )}

              <h3 className={`font-serif text-lg font-bold mb-1 ${tier.highlighted ? "text-secondary" : "text-foreground"}`}>
                {tier.name}
              </h3>
              <div className="mb-3">
                <span className={`text-4xl font-bold font-sans ${tier.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className={`text-sm ${tier.highlighted ? "text-primary-foreground/40" : "text-muted-foreground"}`}>
                    {tier.period}
                  </span>
                )}
              </div>
              <p className={`text-sm mb-7 ${tier.highlighted ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                {tier.desc}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      tier.highlighted ? "bg-secondary/20" : "bg-secondary/10"
                    }`}>
                      <Check size={10} className="text-secondary" />
                    </div>
                    <span className={`text-sm ${tier.highlighted ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold h-11 ${
                  tier.highlighted
                    ? "bg-secondary text-secondary-foreground hover:bg-gold-dark glow-gold-sm"
                    : "bg-primary text-primary-foreground hover:bg-navy-light"
                }`}
                onClick={() => {
                  if (tier.cta === "Contact Sales") {
                    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/auth?mode=signup';
                  }
                }}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
