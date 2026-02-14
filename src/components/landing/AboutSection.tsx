import { motion } from "framer-motion";

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
              About <span className="text-secondary">Tandon Associates</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Founded with a vision to modernize Indian legal practice, Tandon Associates combines decades of legal expertise with cutting-edge AI technology. We believe every lawyer deserves access to powerful tools that make their practice more efficient, insightful, and impactful.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Our platform is built by legal professionals who understand the unique challenges of practicing law in India — from navigating complex case law across multiple courts to managing client expectations and meeting tight deadlines.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "500+", label: "Cases Managed" },
                { value: "50+", label: "Legal Professionals" },
                { value: "15+", label: "Practice Areas" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-secondary font-sans">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary rounded-2xl p-8 border border-gold/10"
          >
            <h3 className="font-serif text-xl font-bold text-primary-foreground mb-6">Our Values</h3>
            {[
              { title: "Excellence", desc: "We hold ourselves to the highest standards of legal practice and technology." },
              { title: "Innovation", desc: "We embrace AI and technology to deliver better outcomes for our clients." },
              { title: "Integrity", desc: "Transparency, honesty, and ethical practice are at our core." },
              { title: "Accessibility", desc: "Great legal tools should be available to every practitioner, not just large firms." },
            ].map((v) => (
              <div key={v.title} className="mb-5 last:mb-0">
                <h4 className="font-serif font-semibold text-secondary mb-1">{v.title}</h4>
                <p className="text-sm text-primary-foreground/50">{v.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
