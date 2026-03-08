import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search, Mail } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mesh p-4">
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-7xl font-serif font-bold text-secondary">404</h1>
        <h2 className="font-serif text-2xl font-bold text-primary-foreground mb-3">Page Not Found</h2>
        <p className="text-primary-foreground/50 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold glow-gold-sm">
            <Link to="/"><Home className="w-4 h-4 mr-2" /> Go Home</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/5">
            <Link to="/auth"><ArrowLeft className="w-4 h-4 mr-2" /> Sign In</Link>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-primary-foreground/30">
          <Link to="/#features" className="hover:text-secondary transition-colors flex items-center gap-1.5">
            <Search size={14} /> Features
          </Link>
          <Link to="/#contact" className="hover:text-secondary transition-colors flex items-center gap-1.5">
            <Mail size={14} /> Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
