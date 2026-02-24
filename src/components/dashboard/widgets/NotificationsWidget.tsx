import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, AlertCircle, CheckCircle } from "lucide-react";
import { format, isToday, isTomorrow, addDays, isBefore } from "date-fns";

interface Notification {
  id: string;
  message: string;
  type: "warning" | "info";
}

export const NotificationsWidget = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const items: Notification[] = [];

      // Overdue tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("user_id", user.id)
        .eq("completed", false)
        .not("due_date", "is", null)
        .lt("due_date", new Date().toISOString())
        .limit(3);

      tasks?.forEach((t) => {
        items.push({ id: `task-${t.id}`, message: `Overdue: ${t.title}`, type: "warning" });
      });

      // Upcoming hearings (next 3 days)
      const { data: hearings } = await supabase
        .from("hearings")
        .select("id, date, cases(title)")
        .eq("user_id", user.id)
        .gte("date", new Date().toISOString())
        .lte("date", addDays(new Date(), 3).toISOString())
        .order("date", { ascending: true })
        .limit(3);

      (hearings as any[])?.forEach((h) => {
        const d = new Date(h.date);
        const when = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "MMM d");
        items.push({
          id: `hearing-${h.id}`,
          message: `${when}: Hearing for ${h.cases?.title || "case"}`,
          type: "info",
        });
      });

      setNotifications(items.length ? items : []);
    };

    fetchNotifications();
  }, [user]);

  if (!notifications.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        All caught up!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/15">
          {n.type === "warning" ? (
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          ) : (
            <Bell className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          )}
          <p className="text-sm">{n.message}</p>
        </div>
      ))}
    </div>
  );
};
