import { useNavigate } from "react-router-dom";
import { Search, FileText, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Search, label: "AI Research", href: "/research" },
  { icon: FileText, label: "Draft Document", href: "/drafting" },
  { icon: Briefcase, label: "New Case", href: "/cases" },
  { icon: Users, label: "Clients", href: "/clients" },
];

export const QuickActionsWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((a) => (
        <Button
          key={a.label}
          variant="outline"
          className="h-auto flex-col gap-1.5 py-3 border-border/30 hover:border-accent/30 hover:bg-accent/5"
          onClick={() => navigate(a.href)}
        >
          <a.icon className="w-5 h-5 text-accent" />
          <span className="text-xs">{a.label}</span>
        </Button>
      ))}
    </div>
  );
};
