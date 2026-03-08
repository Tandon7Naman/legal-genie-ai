import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ContactSection = () => {
  const [loading, setLoading] = useState(false);

  return (
    <section id="contact" className="py-28 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-14 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3 block">Contact</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-5">
              Get in <span className="text-gradient-gold">Touch</span>
            </h2>
            <p className="text-primary-foreground/50 text-lg mb-12">
              Have a legal question or want to learn more about our platform? We'd love to hear from you.
            </p>

            <div className="space-y-7">
              {[
                { icon: Mail, label: "Email", value: "contact@tandonassociates.com" },
                { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                { icon: MapPin, label: "Address", value: "New Delhi, India" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <item.icon size={18} className="text-secondary" />
                  </div>
                  <div>
                    <div className="text-[11px] text-primary-foreground/35 uppercase tracking-wider font-semibold">{item.label}</div>
                    <div className="text-primary-foreground/75 font-sans">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-secondary/5 rounded-3xl blur-2xl" />
              <form className="relative bg-navy-light/50 rounded-2xl p-8 border border-secondary/12 space-y-5 backdrop-blur-sm" onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const phone = formData.get('phone') as string;
                const case_type = formData.get('case_type') as string;
                const message = formData.get('message') as string;

                if (!name || !email) {
                  setLoading(false);
                  return;
                }

                try {
                  const { error } = await supabase.from('contact_submissions').insert({
                    name,
                    email,
                    phone: phone || null,
                    case_type: case_type || null,
                    message: message || null,
                  });

                  if (error) throw error;

                  e.currentTarget.reset();
                  toast({ title: "Message Sent!", description: "Thank you for reaching out. We'll get back to you within 24 hours." });
                } catch {
                  toast({ title: "Error", description: "Something went wrong. Please try again or email us directly.", variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input name="name" placeholder="Full Name" required className="bg-primary/50 border-secondary/10 text-primary-foreground placeholder:text-primary-foreground/25 h-11 focus:border-secondary/30" />
                  <Input name="email" placeholder="Email" type="email" required className="bg-primary/50 border-secondary/10 text-primary-foreground placeholder:text-primary-foreground/25 h-11 focus:border-secondary/30" />
                </div>
                <Input name="phone" placeholder="Phone Number" className="bg-primary/50 border-secondary/10 text-primary-foreground placeholder:text-primary-foreground/25 h-11 focus:border-secondary/30" />
                <Select name="case_type">
                  <SelectTrigger className="bg-primary/50 border-secondary/10 text-primary-foreground h-11">
                    <SelectValue placeholder="Select Inquiry Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Platform Demo", "Pricing Inquiry", "Enterprise / Firm Onboarding", "Partnership", "Criminal", "Civil", "Corporate", "Family", "IP", "Tax", "Other"].map((t) => (
                      <SelectItem key={t} value={t.toLowerCase().replace(/ /g, '_')}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  name="message"
                  placeholder="Tell us about your inquiry..."
                  rows={4}
                  className="bg-primary/50 border-secondary/10 text-primary-foreground placeholder:text-primary-foreground/25 focus:border-secondary/30"
                />
                <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold h-12 glow-gold-sm group">
                  {loading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Send size={16} className="mr-2 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
