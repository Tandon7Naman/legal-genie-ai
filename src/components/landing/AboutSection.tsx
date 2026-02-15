import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const AnimatedNumber = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <div ref={ref} className="text-3xl font-bold text-secondary font-sans">{count}{suffix}</div>;
};

export const AboutSection = () => {
  return (
    <section id="about" className="py-28 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3 block">About Us</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
              About <span className="text-gradient-gold">Tandon Associates</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Founded with a vision to modernize Indian legal practice, Tandon Associates combines decades of legal expertise with cutting-edge AI technology. We believe every lawyer deserves access to powerful tools that make their practice more efficient, insightful, and impactful.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              Our platform is built by legal professionals who understand the unique challenges of practicing law in India — from navigating complex case law across multiple courts to managing client expectations and meeting tight deadlines.
            </p>

            <div className="grid grid-cols-3 gap-8">
              {[
                { value: 500, suffix: "+", label: "Cases Managed" },
                { value: 50, suffix: "+", label: "Legal Professionals" },
                { value: 15, suffix: "+", label: "Practice Areas" },
              ].map((stat) => (
                <div key={stat.label}>
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-3 bg-secondary/5 rounded-3xl blur-2xl" />
            
            <div className="relative bg-primary rounded-2xl p-8 border border-secondary/15">
              <h3 className="font-serif text-xl font-bold text-primary-foreground mb-7">Our Values</h3>
              {[
                { title: "Excellence", desc: "We hold ourselves to the highest standards of legal practice and technology.", emoji: "⚖️" },
                { title: "Innovation", desc: "We embrace AI and technology to deliver better outcomes for our clients.", emoji: "🚀" },
                { title: "Integrity", desc: "Transparency, honesty, and ethical practice are at our core.", emoji: "🛡️" },
                { title: "Accessibility", desc: "Great legal tools should be available to every practitioner, not just large firms.", emoji: "🌍" },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="mb-5 last:mb-0 flex items-start gap-4 group"
                >
                  <span className="text-xl mt-0.5">{v.emoji}</span>
                  <div>
                    <h4 className="font-serif font-semibold text-secondary mb-1 group-hover:text-gold-light transition-colors">{v.title}</h4>
                    <p className="text-sm text-primary-foreground/45">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
