import { Link } from "react-router-dom";

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

          {[
            { title: "Platform", links: ["Features", "Pricing", "Research", "Case Management"] },
            { title: "Company", links: ["About", "Team", "Careers", "Blog"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Disclaimer"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-primary-foreground text-xs uppercase tracking-[0.2em] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-primary-foreground/35 hover:text-secondary cursor-pointer transition-colors">
                      {link}
                    </span>
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
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <span key={social} className="text-xs text-primary-foreground/25 hover:text-secondary cursor-pointer transition-colors">
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
