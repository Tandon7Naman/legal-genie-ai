import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PracticeAreas } from "@/components/landing/PracticeAreas";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PracticeAreas />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
