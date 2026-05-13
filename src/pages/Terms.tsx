import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Terms of Service | Tandon Associates"
      description="Terms governing use of the Tandon Associates AI legal research and case management platform for Indian lawyers, firms, and students."
      path="/terms"
    />
    <header className="border-b border-border py-4">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <span className="font-serif text-xl font-bold">Tandon <span className="text-gradient-gold">Associates</span></span>
      </div>
    </header>
    <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm dark:prose-invert">
      <h1 className="font-serif">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: March 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Tandon Associates, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>

      <h2>2. Description of Service</h2>
      <p>Tandon Associates provides AI-powered legal research, case management, and document drafting tools. The platform is a technology tool and does not constitute legal advice.</p>

      <h2>3. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.</p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to misuse the platform, attempt unauthorized access, or use AI-generated content without professional legal review where applicable.</p>

      <h2>5. Intellectual Property</h2>
      <p>Documents you create using the platform remain your intellectual property. The platform's software, design, and AI models are proprietary to Tandon Associates.</p>

      <h2>6. Limitation of Liability</h2>
      <p>Tandon Associates is provided "as is." We are not liable for any decisions made based on AI-generated content. Always consult a qualified legal professional.</p>

      <h2>7. Contact</h2>
      <p>For questions about these terms, contact <strong>legal@tandonassociates.com</strong>.</p>
    </main>
  </div>
);

export default Terms;
