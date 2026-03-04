import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Save, User } from "lucide-react";

const Settings = () => {
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    bar_council_number: "",
    firm_name: "",
    institution: "",
    expected_graduation_year: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bar_council_number: profile.bar_council_number || "",
        firm_name: profile.firm_name || "",
        institution: profile.institution || "",
        expected_graduation_year: profile.expected_graduation_year?.toString() || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        bar_council_number: form.bar_council_number || null,
        firm_name: form.firm_name || null,
        institution: form.institution || null,
        expected_graduation_year: form.expected_graduation_year
          ? parseInt(form.expected_graduation_year)
          : null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setSaving(false);
  };

  const role = roles[0]?.replace("_", " ") || "User";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Profile Settings</h1>
            <p className="text-sm text-muted-foreground capitalize">Role: {role}</p>
          </div>
        </div>

        <div className="space-y-5 bg-card/50 rounded-xl border border-border/20 p-6">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          {(roles.includes("individual_lawyer") || roles.includes("law_firm")) && (
            <div>
              <Label className="text-xs text-muted-foreground">Bar Council Number</Label>
              <Input
                value={form.bar_council_number}
                onChange={(e) => setForm({ ...form, bar_council_number: e.target.value })}
                placeholder="e.g. D/1234/2020"
              />
            </div>
          )}

          {(roles.includes("law_firm") || roles.includes("organization")) && (
            <div>
              <Label className="text-xs text-muted-foreground">Firm / Organization Name</Label>
              <Input
                value={form.firm_name}
                onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
              />
            </div>
          )}

          {roles.includes("student") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Institution</Label>
                <Input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Graduation Year</Label>
                <Input
                  type="number"
                  value={form.expected_graduation_year}
                  onChange={(e) => setForm({ ...form, expected_graduation_year: e.target.value })}
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-accent">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
