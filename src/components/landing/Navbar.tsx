import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Practice Areas", href: "#practice-areas" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/98 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-secondary/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-18 px-4 py-4">
        <Link to="/" className="font-serif text-2xl font-bold text-primary-foreground tracking-wide">
          Tandon <span className="text-gradient-gold">Associates</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="text-sm font-medium text-primary-foreground/60 hover:text-secondary transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>
          ))}
          <Button size="sm" variant="outline" className="border-secondary/40 text-primary-foreground hover:bg-secondary/10 hover:text-secondary font-semibold" onClick={() => window.location.href = '/auth?mode=signin'}>
            Sign in
          </Button>
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold glow-gold-sm" onClick={() => window.location.href = '/auth?mode=signup'}>
            Create account
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary/98 backdrop-blur-xl border-t border-secondary/10"
          >
            <div className="flex flex-col p-4 gap-3">
              {navLinks.map((l) => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="text-left text-sm font-medium text-primary-foreground/70 hover:text-secondary py-2"
                >
                  {l.label}
                </button>
              ))}
              <Button variant="outline" className="border-secondary/40 text-primary-foreground hover:bg-secondary/10 hover:text-secondary font-semibold mt-2" onClick={() => window.location.href = '/auth?mode=signin'}>
                Sign in
              </Button>
              <Button className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold" onClick={() => window.location.href = '/auth?mode=signup'}>
                Create account
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
