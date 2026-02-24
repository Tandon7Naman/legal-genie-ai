import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const CaseStatsWidget = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, pending: 0, closed: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cases")
      .select("status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        setStats({
          total: data.length,
          active: data.filter((c) => c.status === "active").length,
          pending: data.filter((c) => c.status === "pending").length,
          closed: data.filter((c) => ["closed", "won", "lost", "settled"].includes(c.status)).length,
        });
      });
  }, [user]);

  const items = [
    { label: "Total", value: stats.total, color: "text-foreground" },
    { label: "Active", value: stats.active, color: "text-emerald-400" },
    { label: "Pending", value: stats.pending, color: "text-amber-400" },
    { label: "Resolved", value: stats.closed, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="text-center p-3 rounded-lg bg-muted/20">
          <p className={`text-2xl font-bold font-serif ${item.color}`}>{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
};
