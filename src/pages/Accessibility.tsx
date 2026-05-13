import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Accessibility = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Accessibility Statement | Tandon Associates"
      description="Tandon Associates' commitment to WCAG 2.1 AA accessibility and inclusive design for India's legal professionals and students."
      path="/accessibility"
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
      <h1 className="font-serif">Accessibility Statement</h1>
      <p className="text-muted-foreground">Last updated: April 2026</p>

      <h2>Our Commitment</h2>
      <p>Tandon Associates is committed to ensuring digital accessibility for people with disabilities. We continuously improve the user experience for everyone and apply relevant accessibility standards to make our platform inclusive.</p>

      <h2>Standards</h2>
      <p>We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including visual, auditory, physical, speech, cognitive, language, learning, and neurological disabilities.</p>

      <h2>Measures Taken</h2>
      <ul>
        <li><strong>Semantic HTML:</strong> We use proper heading hierarchy, landmarks, and ARIA labels throughout the platform.</li>
        <li><strong>Keyboard Navigation:</strong> All interactive elements are reachable and operable via keyboard.</li>
        <li><strong>Color Contrast:</strong> We maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) across light and dark modes.</li>
        <li><strong>Screen Reader Support:</strong> Forms, buttons, and navigation include descriptive labels and ARIA attributes.</li>
        <li><strong>Responsive Design:</strong> The platform adapts to all screen sizes, from mobile phones to desktop monitors.</li>
        <li><strong>Focus Indicators:</strong> Visible focus outlines help keyboard users identify their current position.</li>
        <li><strong>Text Scaling:</strong> Content remains readable and functional when text is scaled up to 200%.</li>
        <li><strong>Motion Sensitivity:</strong> Animations respect the user's <code>prefers-reduced-motion</code> system setting.</li>
      </ul>

      <h2>Known Limitations</h2>
      <p>While we strive for full compliance, some areas may have limitations:</p>
      <ul>
        <li>AI-generated content may not always follow optimal heading structure.</li>
        <li>Some third-party components may have limited accessibility support.</li>
        <li>PDF exports from document drafting may require additional accessibility tagging.</li>
      </ul>

      <h2>Assistive Technologies</h2>
      <p>Our platform is tested with:</p>
      <ul>
        <li>NVDA and JAWS screen readers</li>
        <li>VoiceOver on macOS and iOS</li>
        <li>Browser zoom up to 200%</li>
        <li>High-contrast mode on Windows</li>
      </ul>

      <h2>Feedback</h2>
      <p>We welcome your feedback on the accessibility of Tandon Associates. Please let us know if you encounter any barriers:</p>
      <ul>
        <li>Email: <strong>accessibility@tandonassociates.com</strong></li>
        <li>Phone: <strong>+91 98765 43210</strong></li>
      </ul>
      <p>We aim to respond to accessibility feedback within 5 business days.</p>

      <h2>Legal Framework</h2>
      <p>This statement is guided by the <strong>Rights of Persons with Disabilities Act, 2016</strong> (India) and the <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong> published by the World Wide Web Consortium (W3C).</p>
    </main>
  </div>
);

export default Accessibility;
