import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("individual_lawyer");
  const [institution, setInstitution] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [firmName, setFirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent a password reset link to your email.",
        });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              ...(role === "student" && institution ? { institution } : {}),
              ...(role === "student" && gradYear ? { expected_graduation_year: parseInt(gradYear) } : {}),
              ...((role === "law_firm" || role === "organization") && firmName ? { firm_name: firmName } : {}),
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent a verification link to confirm your account.",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <SEO
        title="Sign In or Sign Up | Tandon Associates"
        description="Access your Tandon Associates account to use AI legal research, case management, and document drafting tools built for Indian legal professionals."
        path="/auth"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="block text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary-foreground">
            Tandon <span className="text-gradient-gold">Associates</span>
          </h1>
        </Link>

        <div className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-primary-foreground mb-1">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Join Tandon Associates today" : "Enter your email to receive a reset link"}
          </p>

          {mode !== "forgot" && (
            <>
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full mb-6 border-border/30 text-primary-foreground hover:bg-secondary/10"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
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
                  <Select value={role} onValueChange={setRole}>
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
                    <Label className="text-primary-foreground/80 text-xs">{role === "law_firm" ? "Firm Name" : "Organization Name"}</Label>
                    <Input
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      required
                      className="bg-background/10 border-border/30 text-primary-foreground"
                    />
                  </div>
                )}
              </>
            )}
            <div>
              <Label className="text-primary-foreground/80 text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/10 border-border/30 text-primary-foreground"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label className="text-primary-foreground/80 text-xs">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/10 border-border/30 text-primary-foreground"
                />
              </div>
            )}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-secondary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-secondary hover:underline font-medium">
                Back to Sign In
              </button>
            ) : mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-secondary hover:underline font-medium">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-secondary hover:underline font-medium">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
