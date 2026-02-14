import { motion } from "framer-motion";
import {
  Gavel, Users, Building2, Heart, Lightbulb, Receipt,
  Briefcase, BookOpen, Home, Globe, Leaf, Landmark, Scale
} from "lucide-react";

const areas = [
  { icon: Gavel, title: "Criminal Law", desc: "Defence & prosecution across all criminal matters under IPC & CrPC" },
  { icon: Scale, title: "Civil Law", desc: "Disputes, property claims, torts and civil remedies under CPC" },
  { icon: Building2, title: "Corporate Law", desc: "Company formation, M&A, compliance & corporate governance" },
  { icon: Heart, title: "Family Law", desc: "Divorce, custody, maintenance & succession matters" },
  { icon: Lightbulb, title: "Intellectual Property", desc: "Patents, trademarks, copyrights & trade secret protection" },
  { icon: Receipt, title: "Tax Law", desc: "Direct & indirect taxation, GST disputes & tax planning" },
  { icon: Briefcase, title: "Labour & Employment", desc: "Employment contracts, disputes & compliance with labour codes" },
  { icon: BookOpen, title: "Constitutional Law", desc: "Fundamental rights, writs & constitutional remedies" },
  { icon: Home, title: "Real Estate", desc: "Property disputes, RERA compliance & land acquisition" },
  { icon: Globe, title: "Cyber Law", desc: "IT Act compliance, data protection & cybercrime matters" },
  { icon: Leaf, title: "Environmental Law", desc: "NGT matters, pollution control & environmental clearances" },
  { icon: Landmark, title: "Banking & Finance", desc: "Banking regulations, SARFAESI, DRT & financial disputes" },
];

export const PracticeAreas = () => {
  return (
    <section id="practice-areas" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Practice <span className="text-secondary">Areas</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Comprehensive legal services across every domain of Indian law
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {areas.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-xl p-6 border border-border hover:border-secondary/40 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <area.icon size={20} className="text-secondary" />
              </div>
              <h3 className="font-serif font-semibold text-foreground mb-2">{area.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{area.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
