import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border py-4">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <span className="font-serif text-xl font-bold">Tandon <span className="text-gradient-gold">Associates</span></span>
      </div>
    </header>
    <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm dark:prose-invert">
      <h1 className="font-serif">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: March 2026</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide when creating an account (name, email, role, institution), as well as usage data such as search queries, case details, and documents you create on the platform.</p>

      <h2>2. How We Use Your Information</h2>
      <p>Your information is used to provide and improve our services, personalize your experience, and generate AI-powered recommendations. We do not sell your personal data to third parties.</p>

      <h2>3. Data Security</h2>
      <p>We employ industry-standard encryption and security measures to protect your data. All communications are encrypted via TLS, and sensitive data is stored with encryption at rest.</p>

      <h2>4. Data Retention</h2>
      <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>

      <h2>5. Third-Party Services</h2>
      <p>We use third-party AI services to power our legal research and document drafting features. Your queries are processed securely and are not used to train third-party models.</p>

      <h2>6. Contact</h2>
      <p>For privacy-related inquiries, contact us at <strong>privacy@tandonassociates.com</strong>.</p>
    </main>
  </div>
);

export default Privacy;
