import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CompleteProfile = () => {
  const { user, profile, needsRoleSelection, loading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<"student" | "individual_lawyer" | "law_firm" | "organization">("individual_lawyer");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [firmName, setFirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !needsRoleSelection) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, needsRoleSelection, navigate]);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    else if (user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
    else if (user?.user_metadata?.name) setFullName(user.user_metadata.name);
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const profileUpdate: Record<string, any> = {};
      if (fullName) profileUpdate.full_name = fullName;
      if (role === "student") {
        if (institution) profileUpdate.institution = institution;
        if (gradYear) profileUpdate.expected_graduation_year = parseInt(gradYear);
      }
      if (role === "law_firm" || role === "organization") {
        if (firmName) profileUpdate.firm_name = firmName;
      }
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", user.id);
        if (profileErr) throw profileErr;
      }

      const { error: roleErr } = await supabase.rpc("set_initial_role", { _role: role });
      if (roleErr) throw roleErr;

      await refreshUserData();
      toast({ title: "Welcome!", description: "Your profile is set up." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-2xl p-8">
          <h1 className="font-serif text-2xl font-bold text-primary-foreground mb-1">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Tell us how you'll be using Tandon Associates so we can tailor your experience.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-primary-foreground/80 text-xs">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-background/10 border-border/30 text-primary-foreground"
              />
            </div>

            <div>
              <Label className="text-primary-foreground/80 text-xs">Account Type</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground z-50">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="individual_lawyer">Individual Lawyer</SelectItem>
                  <SelectItem value="law_firm">Law Firm</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Institution</Label>
                  <Input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    required
                    className="bg-background/10 border-border/30 text-primary-foreground"
                  />
                </div>
                <div>
                  <Label className="text-primary-foreground/80 text-xs">Graduation Year</Label>
                  <Input
                    type="number"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    required
                    className="bg-background/10 border-border/30 text-primary-foreground"
                  />
                </div>
              </div>
            )}

            {(role === "law_firm" || role === "organization") && (
              <div>
                <Label className="text-primary-foreground/80 text-xs">
                  {role === "law_firm" ? "Firm Name" : "Organization Name"}
                </Label>
                <Input
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  required
                  className="bg-background/10 border-border/30 text-primary-foreground"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "Saving..." : "Continue"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;