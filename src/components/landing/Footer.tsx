import { Link } from "react-router-dom";

const scrollToSection = (id: string) => {
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: "smooth" });
};

const footerLinks: Record<string, { label: string; action?: () => void; to?: string }[]> = {
  Platform: [
    { label: "Features", action: () => scrollToSection("#features") },
    { label: "Pricing", action: () => scrollToSection("#pricing") },
    { label: "Research", to: "/auth" },
    { label: "Case Management", to: "/auth" },
  ],
  Company: [
    { label: "About", action: () => scrollToSection("#about") },
    { label: "Team", action: () => scrollToSection("#about") },
    { label: "Careers", action: () => scrollToSection("#contact") },
    { label: "Blog", action: () => scrollToSection("#contact") },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Disclaimer", to: "/disclaimer" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-primary border-t border-secondary/10 py-14 relative">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link to="/" className="font-serif text-2xl font-bold text-primary-foreground">
              Tandon <span className="text-gradient-gold">Associates</span>
            </Link>
            <p className="text-sm text-primary-foreground/35 mt-4 leading-relaxed">
              AI-powered legal platform for modern Indian legal professionals. Research smarter, manage better.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-primary-foreground text-xs uppercase tracking-[0.2em] mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm text-primary-foreground/35 hover:text-secondary transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={link.action}
                        className="text-sm text-primary-foreground/35 hover:text-secondary transition-colors"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-secondary/8 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/25">
            © {new Date().getFullYear()} Tandon Associates. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Twitter", url: "https://twitter.com" },
              { label: "LinkedIn", url: "https://linkedin.com" },
              { label: "GitHub", url: "https://github.com" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-foreground/25 hover:text-secondary transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
