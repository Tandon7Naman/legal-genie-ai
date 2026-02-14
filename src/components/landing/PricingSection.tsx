import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Student",
    price: "Free",
    desc: "For law students building their knowledge",
    features: ["AI Legal Search", "Case Summaries", "Document Templates", "5 AI Queries / day", "Community Support"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Individual",
    price: "₹2,999",
    period: "/month",
    desc: "For independent practitioners",
    features: ["Everything in Student", "Unlimited AI Queries", "Case Management", "Client Management", "Document Drafting", "Priority Support"],
    cta: "Start Free Trial",
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
    <section id="pricing" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Simple <span className="text-secondary">Pricing</span>
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
              className={`rounded-2xl p-6 border flex flex-col ${
                tier.highlighted
                  ? "bg-primary border-secondary shadow-xl shadow-secondary/10 scale-[1.02]"
                  : "bg-card border-border"
              }`}
            >
              <h3 className={`font-serif text-lg font-bold mb-1 ${tier.highlighted ? "text-secondary" : "text-foreground"}`}>
                {tier.name}
              </h3>
              <div className="mb-2">
                <span className={`text-3xl font-bold font-sans ${tier.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className={`text-sm ${tier.highlighted ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                    {tier.period}
                  </span>
                )}
              </div>
              <p className={`text-sm mb-6 ${tier.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {tier.desc}
              </p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className={`mt-0.5 shrink-0 ${tier.highlighted ? "text-secondary" : "text-secondary"}`} />
                    <span className={`text-sm ${tier.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold ${
                  tier.highlighted
                    ? "bg-secondary text-secondary-foreground hover:bg-gold-dark"
                    : "bg-primary text-primary-foreground hover:bg-navy-light"
                }`}
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
