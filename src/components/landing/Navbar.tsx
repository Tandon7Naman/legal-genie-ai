import { useState } from "react";
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

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-gold/10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="font-serif text-xl font-bold text-primary-foreground tracking-wide">
          Tandon <span className="text-secondary">Associates</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="text-sm font-medium text-primary-foreground/70 hover:text-secondary transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold">
            Get Started
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
            className="md:hidden bg-primary border-t border-gold/10"
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
              <Button className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold mt-2">
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
