import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewAsRole } from "@/hooks/useViewAsRole";
import { ROLE_LABELS } from "@/lib/roleAccess";

export function RolePreviewBanner() {
  const { viewAsRole, setViewAsRole, canSwitchView } = useViewAsRole();
  if (!canSwitchView || !viewAsRole) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/15 border-b border-secondary/30 text-sm">
      <Eye className="w-4 h-4 text-secondary shrink-0" />
      <span className="truncate">
        You are viewing the app as a <strong>{ROLE_LABELS[viewAsRole]}</strong>.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="ml-auto h-7 border-secondary/40"
        onClick={() => setViewAsRole(null)}
      >
        Exit preview
      </Button>
    </div>
  );
}
