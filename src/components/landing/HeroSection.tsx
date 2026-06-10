import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, Shield, Brain, TrendingUp, Users, FileText } from "lucide-react";

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
    className={`absolute rounded-full blur-3xl ${className}`}
  />
);

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-mesh overflow-hidden pt-16">
      <FloatingOrb className="w-96 h-96 bg-secondary/10 top-20 -left-48" delay={0} />
      <FloatingOrb className="w-72 h-72 bg-secondary/8 bottom-20 right-10" delay={2} />
      <FloatingOrb className="w-48 h-48 bg-secondary/5 top-1/2 left-1/3" delay={4} />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(43 50% 54% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(43 50% 54% / 0.5) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-5 py-2 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm font-semibold text-secondary tracking-wide">AI-Powered Legal Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-foreground leading-[1.1] mb-8">
              AI-Powered Legal{" "}
              <br />
              <span className="text-gradient-gold">Research</span> &{" "}
              <span className="text-gradient-gold">Practice</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg mb-10 font-sans leading-relaxed">
              India's intelligent legal platform. AI-powered research, case management, and document drafting — built for lawyers, firms, and law students.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold text-base px-8 h-13 glow-gold group" onClick={() => window.location.href = '/auth?mode=signup'}>
                Create account
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold text-base px-8 h-13 glow-gold" onClick={() => window.location.href = '/auth?mode=signin'}>
                Sign in
              </Button>
            </div>

            {/* Trust badges — flex-wrap for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center gap-4 sm:gap-6 text-primary-foreground/70"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-secondary/60" />
                <span className="text-sm font-sans">500+ Legal Pros</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-primary-foreground/10" />
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-secondary/60" />
                <span className="text-sm font-sans">Bank-grade Security</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-primary-foreground/10" />
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-secondary/60" />
                <span className="text-sm font-sans">Data Hosted in India</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — dashboard mockup (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/5 rounded-3xl blur-2xl" />
              
              <div className="relative bg-navy-light/60 rounded-2xl border border-secondary/15 p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-secondary/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-xs text-primary-foreground/30 font-sans">dashboard.tandonassociates.com</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Active Cases", value: "24", icon: Scale, change: "+3" },
                    { label: "AI Queries", value: "1,247", icon: Brain, change: "+89" },
                    { label: "Documents", value: "156", icon: FileText, change: "+12" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-primary/60 rounded-xl p-4 border border-secondary/8 hover:border-secondary/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon size={16} className="text-secondary" />
                        <span className="text-[10px] text-green-400 font-semibold font-sans">{stat.change}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-foreground font-sans">{stat.value}</div>
                      <div className="text-[11px] text-primary-foreground/35 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/40 rounded-xl p-4 border border-secondary/8 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary-foreground/50">Recent Cases</span>
                    <span className="text-[10px] text-secondary font-sans">View all →</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "Sharma v. State of UP", court: "Supreme Court", status: "Active", icon: Scale },
                      { name: "Tech Corp IP Dispute", court: "Delhi HC", status: "Hearing", icon: FileText },
                      { name: "Insolvency Proceedings", court: "NCLT", status: "Review", icon: TrendingUp },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center gap-3 bg-primary/50 rounded-lg p-2.5 border border-secondary/5">
                        <div className="w-7 h-7 rounded-md bg-secondary/10 flex items-center justify-center shrink-0">
                          <c.icon size={13} className="text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-primary-foreground/70 font-sans block truncate">{c.name}</span>
                          <span className="text-[10px] text-primary-foreground/30">{c.court}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          c.status === "Active" ? "bg-green-500/10 text-green-400" :
                          c.status === "Hearing" ? "bg-secondary/10 text-secondary" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile — compact stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:hidden"
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active Cases", value: "24", icon: Scale },
                { label: "AI Queries", value: "1,247", icon: Brain },
                { label: "Documents", value: "156", icon: FileText },
              ].map((stat) => (
                <div key={stat.label} className="bg-navy-light/40 rounded-xl p-4 border border-secondary/10 text-center">
                  <stat.icon size={18} className="text-secondary mx-auto mb-2" />
                  <div className="text-xl font-bold text-primary-foreground font-sans">{stat.value}</div>
                  <div className="text-[10px] text-primary-foreground/35 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
