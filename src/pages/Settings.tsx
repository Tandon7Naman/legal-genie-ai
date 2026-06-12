import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Save, User, Palette, Moon, Sun } from "lucide-react";

const ACCENT_COLORS = [
  { label: "Gold", value: "#c9a84c" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Orange", value: "#f97316" },
];

const Settings = () => {
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", bar_council_number: "",
    firm_name: "", institution: "", expected_graduation_year: "",
  });
  const [isDark, setIsDark] = useState(true);
  const [accentColor, setAccentColor] = useState("#c9a84c");
  const [idleTimeout, setIdleTimeout] = useState<number>(15);

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
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_preferences").select("theme, accent_color, idle_timeout_minutes").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAccentColor(data.accent_color || "#c9a84c");
          const dark = data.theme === "dark";
          setIsDark(dark);
          document.documentElement.classList.toggle("dark", dark);
          const mins = data.idle_timeout_minutes ?? 15;
          setIdleTimeout(mins);
          localStorage.setItem("idleTimeoutMinutes", mins.toString());
        }
      });
  }, [user]);

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
        expected_graduation_year: form.expected_graduation_year ? parseInt(form.expected_graduation_year) : null,
      })
      .eq("user_id", user.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated successfully" });
    setSaving(false);
  };

  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    if (user) {
      await supabase.from("user_preferences")
        .upsert({ user_id: user.id, theme: newDark ? "dark" : "light", accent_color: accentColor }, { onConflict: "user_id" });
    }
  };

  const changeAccent = async (color: string) => {
    setAccentColor(color);
    // Apply accent color as CSS custom property
    document.documentElement.style.setProperty("--user-accent", color);
    if (user) {
      await supabase.from("user_preferences")
        .upsert({ user_id: user.id, theme: isDark ? "dark" : "light", accent_color: color }, { onConflict: "user_id" });
    }
  };

  const changeIdleTimeout = async (value: string) => {
    const mins = parseInt(value, 10);
    setIdleTimeout(mins);
    localStorage.setItem("idleTimeoutMinutes", mins.toString());
    if (user) {
      await supabase.from("user_preferences")
        .upsert({ user_id: user.id, theme: isDark ? "dark" : "light", accent_color: accentColor, idle_timeout_minutes: mins }, { onConflict: "user_id" });
      toast({ title: "Auto-logout updated", description: mins === 0 ? "Disabled" : `After ${mins} minutes of inactivity` });
    }
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
            <h1 className="font-serif text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground capitalize">Role: {role}</p>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-card/50 border border-border/20 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <User className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Palette className="w-4 h-4 mr-2" /> Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-5 bg-card/50 rounded-xl border border-border/20 p-6">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              {(roles.includes("individual_lawyer") || roles.includes("law_firm")) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bar Council Number</Label>
                  <Input value={form.bar_council_number} onChange={(e) => setForm({ ...form, bar_council_number: e.target.value })} placeholder="e.g. D/1234/2020" />
                </div>
              )}
              {(roles.includes("law_firm") || roles.includes("organization")) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Firm / Organization Name</Label>
                  <Input value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} />
                </div>
              )}
              {roles.includes("student") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Institution</Label>
                    <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Graduation Year</Label>
                    <Input type="number" value={form.expected_graduation_year} onChange={(e) => setForm({ ...form, expected_graduation_year: e.target.value })} />
                  </div>
                </div>
              )}
              <Button onClick={handleSave} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-accent">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6 bg-card/50 rounded-xl border border-border/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <p className="font-medium mb-3">Accent Color</p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => changeAccent(c.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border/20">
                <p className="font-medium">Auto Sign-out (Idle Timeout)</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign out automatically after a period of inactivity or when the tab is closed.
                </p>
                <Select value={idleTimeout.toString()} onValueChange={changeIdleTimeout}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Settings;
