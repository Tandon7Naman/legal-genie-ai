import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, Shield, Brain } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-primary overflow-hidden pt-16">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(hsl(var(--gold) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold) / 0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm font-medium text-secondary">AI-Powered Legal Platform</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-foreground leading-tight mb-6">
              Say Hi to{" "}
              <span className="text-secondary">Tandon</span>{" "}
              <span className="text-secondary">Associates</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/60 max-w-lg mb-8 font-sans leading-relaxed">
              Your trusted legal partner. AI-powered research, case management, and document drafting — built for modern Indian legal professionals.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold text-base px-8 group">
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/5 font-semibold text-base px-8">
                Contact Us
              </Button>
            </div>
          </motion.div>

          {/* Right — dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="bg-navy-light/50 rounded-2xl border border-gold/10 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-secondary/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-primary-foreground/40 font-sans">dashboard.tandonassociates.com</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Active Cases", value: "24", icon: Scale },
                  { label: "AI Queries", value: "1,247", icon: Brain },
                  { label: "Win Rate", value: "89%", icon: Shield },
                ].map((stat) => (
                  <div key={stat.label} className="bg-primary/60 rounded-lg p-3 border border-gold/5">
                    <stat.icon size={16} className="text-secondary mb-1" />
                    <div className="text-xl font-bold text-primary-foreground font-sans">{stat.value}</div>
                    <div className="text-xs text-primary-foreground/40">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {["Supreme Court — Sharma v. State of UP", "Delhi HC — Tech Corp IP Dispute", "NCLT — Insolvency Proceedings"].map((c) => (
                  <div key={c} className="flex items-center justify-between bg-primary/40 rounded-lg p-3 border border-gold/5">
                    <span className="text-sm text-primary-foreground/70 font-sans">{c}</span>
                    <span className="text-xs text-secondary font-medium">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
