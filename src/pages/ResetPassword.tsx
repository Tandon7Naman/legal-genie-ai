import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Success", description: "Your password has been updated." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl font-bold text-primary-foreground mb-4">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">This link is invalid or has expired.</p>
          <Link to="/auth">
            <Button variant="outline" className="border-border/30 text-primary-foreground hover:bg-secondary/10">
              Back to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary-foreground">
            Tandon <span className="text-gradient-gold">Associates</span>
          </h1>
        </Link>

        <div className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-primary-foreground mb-1">Set New Password</h2>
          <p className="text-muted-foreground text-sm mb-6">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-primary-foreground/80 text-xs">New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/10 border-border/30 text-primary-foreground"
              />
            </div>
            <div>
              <Label className="text-primary-foreground/80 text-xs">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/10 border-border/30 text-primary-foreground"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-accent font-semibold">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
