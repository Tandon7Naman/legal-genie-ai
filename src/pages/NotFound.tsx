import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-serif font-bold text-secondary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Page not found</p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
