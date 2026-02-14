import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin } from "lucide-react";

export const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-4">
              Get in <span className="text-secondary">Touch</span>
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-10">
              Have a legal question or want to learn more about our platform? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "contact@tandonassociates.com" },
                { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                { icon: MapPin, label: "Address", value: "New Delhi, India" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <item.icon size={18} className="text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs text-primary-foreground/40 uppercase tracking-wider">{item.label}</div>
                    <div className="text-primary-foreground/80 font-sans">{item.value}</div>
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
            <form className="bg-navy-light/40 rounded-2xl p-8 border border-gold/10 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input placeholder="Full Name" className="bg-primary/50 border-gold/10 text-primary-foreground placeholder:text-primary-foreground/30" />
                <Input placeholder="Email" type="email" className="bg-primary/50 border-gold/10 text-primary-foreground placeholder:text-primary-foreground/30" />
              </div>
              <Input placeholder="Phone Number" className="bg-primary/50 border-gold/10 text-primary-foreground placeholder:text-primary-foreground/30" />
              <Select>
                <SelectTrigger className="bg-primary/50 border-gold/10 text-primary-foreground">
                  <SelectValue placeholder="Select Case Type" />
                </SelectTrigger>
                <SelectContent>
                  {["Criminal", "Civil", "Corporate", "Family", "IP", "Tax", "Labour", "Real Estate", "Cyber", "Other"].map((t) => (
                    <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Tell us about your inquiry..."
                rows={4}
                className="bg-primary/50 border-gold/10 text-primary-foreground placeholder:text-primary-foreground/30"
              />
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold">
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
