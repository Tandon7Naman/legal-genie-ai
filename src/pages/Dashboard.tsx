import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut, Shield, Briefcase, Calendar, Search, BarChart3,
  Zap, Bell, Plus, Sun, Moon, LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { RecentCasesWidget } from "@/components/dashboard/widgets/RecentCasesWidget";
import { UpcomingHearingsWidget } from "@/components/dashboard/widgets/UpcomingHearingsWidget";
import { CaseStatsWidget } from "@/components/dashboard/widgets/CaseStatsWidget";
import { ResearchHistoryWidget } from "@/components/dashboard/widgets/ResearchHistoryWidget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/QuickActionsWidget";
import { NotificationsWidget } from "@/components/dashboard/widgets/NotificationsWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetConfig {
  id: string;
  type: string;
  colSpan?: number;
}

const ALL_WIDGETS: WidgetConfig[] = [
  { id: "quick-actions", type: "quick-actions" },
  { id: "notifications", type: "notifications" },
  { id: "case-stats", type: "case-stats" },
  { id: "recent-cases", type: "recent-cases" },
  { id: "upcoming-hearings", type: "upcoming-hearings" },
  { id: "research-history", type: "research-history" },
];

const WIDGET_META: Record<string, { title: string; icon: React.ReactNode }> = {
  "quick-actions": { title: "Quick Actions", icon: <Zap className="w-4 h-4" /> },
  "notifications": { title: "Notifications", icon: <Bell className="w-4 h-4" /> },
  "case-stats": { title: "Case Statistics", icon: <BarChart3 className="w-4 h-4" /> },
  "recent-cases": { title: "Recent Cases", icon: <Briefcase className="w-4 h-4" /> },
  "upcoming-hearings": { title: "Upcoming Hearings", icon: <Calendar className="w-4 h-4" /> },
  "research-history": { title: "Research History", icon: <Search className="w-4 h-4" /> },
};

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  "quick-actions": QuickActionsWidget,
  "notifications": NotificationsWidget,
  "case-stats": CaseStatsWidget,
  "recent-cases": RecentCasesWidget,
  "upcoming-hearings": UpcomingHearingsWidget,
  "research-history": ResearchHistoryWidget,
};

const DEFAULT_LAYOUT: WidgetConfig[] = ALL_WIDGETS;

const Dashboard = () => {
  const { user, profile, roles, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [isDark, setIsDark] = useState(true);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load layout from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_dashboard_layouts")
        .select("layout")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.layout && Array.isArray(data.layout) && data.layout.length > 0) {
        setWidgets(data.layout as unknown as WidgetConfig[]);
      }
      // Load theme preference
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prefs?.theme) {
        setIsDark(prefs.theme === "dark");
      }
      setLayoutLoaded(true);
    };
    load();
  }, [user]);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Persist layout
  const saveLayout = useCallback(
    async (newWidgets: WidgetConfig[]) => {
      if (!user) return;
      await supabase
        .from("user_dashboard_layouts")
        .upsert({ user_id: user.id, layout: newWidgets as any }, { onConflict: "user_id" });
    },
    [user]
  );

  // Persist theme
  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (!user) return;
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, theme: newDark ? "dark" : "light" },
        { onConflict: "user_id" }
      );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((prev) => {
      const oldIndex = prev.findIndex((w) => w.id === active.id);
      const newIndex = prev.findIndex((w) => w.id === over.id);
      const updated = arrayMove(prev, oldIndex, newIndex);
      saveLayout(updated);
      return updated;
    });
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveLayout(updated);
      return updated;
    });
  };

  const addWidget = (type: string) => {
    if (widgets.find((w) => w.type === type)) return;
    const widget = ALL_WIDGETS.find((w) => w.type === type);
    if (!widget) return;
    setWidgets((prev) => {
      const updated = [...prev, widget];
      saveLayout(updated);
      return updated;
    });
  };

  const removedWidgets = ALL_WIDGETS.filter((w) => !widgets.find((ww) => ww.type === w.type));

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Top bar */}
      <header className="border-b border-border/20 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-xl font-bold">
            Tandon <span className="text-gradient-gold">Associates</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-muted-foreground hover:text-accent"
              >
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">
              Welcome back, {profile?.full_name || "Counsellor"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Role: <span className="text-accent capitalize">{roles[0]?.replace("_", " ") || "User"}</span>
            </p>
          </div>
          {removedWidgets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border/30 gap-1.5">
                  <Plus className="w-4 h-4" /> Add Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {removedWidgets.map((w) => (
                  <DropdownMenuItem key={w.type} onClick={() => addWidget(w.type)}>
                    <span className="mr-2">{WIDGET_META[w.type]?.icon}</span>
                    {WIDGET_META[w.type]?.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>

        {/* Widget grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget, i) => {
                const meta = WIDGET_META[widget.type];
                const Component = WIDGET_COMPONENTS[widget.type];
                if (!meta || !Component) return null;
                return (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DashboardWidget
                      id={widget.id}
                      title={meta.title}
                      icon={meta.icon}
                      onRemove={removeWidget}
                      colSpan={widget.colSpan}
                    >
                      <Component />
                    </DashboardWidget>
                  </motion.div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {widgets.length === 0 && (
          <div className="text-center py-16">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No widgets on your dashboard.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Widget" to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
