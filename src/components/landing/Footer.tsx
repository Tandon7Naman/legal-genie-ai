import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary border-t border-gold/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <Link to="/" className="font-serif text-xl font-bold text-primary-foreground">
              Tandon <span className="text-secondary">Associates</span>
            </Link>
            <p className="text-sm text-primary-foreground/40 mt-3 leading-relaxed">
              AI-powered legal platform for modern Indian legal professionals.
            </p>
          </div>

          {[
            { title: "Platform", links: ["Features", "Pricing", "Research", "Case Management"] },
            { title: "Company", links: ["About", "Team", "Careers", "Blog"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Disclaimer"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-primary-foreground text-sm uppercase tracking-wider mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-primary-foreground/40 hover:text-secondary cursor-pointer transition-colors">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gold/10 pt-6 text-center">
          <p className="text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} Tandon Associates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
