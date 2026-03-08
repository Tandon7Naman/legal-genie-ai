import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PracticeAreas } from "@/components/landing/PracticeAreas";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";
import { CookieConsent } from "@/components/landing/CookieConsent";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PracticeAreas />
      <SocialProofSection />
      <PricingSection />
      <AboutSection />
      <ContactSection />
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
