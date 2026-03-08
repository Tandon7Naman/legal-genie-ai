import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <Cookie size={20} className="text-secondary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to enhance your experience. By continuing to use this site, you agree to our{" "}
                <Link to="/privacy" className="text-secondary hover:underline font-medium">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={decline} className="text-muted-foreground text-xs">
                Decline
              </Button>
              <Button size="sm" onClick={accept} className="bg-secondary text-secondary-foreground hover:bg-gold-dark text-xs font-semibold">
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
