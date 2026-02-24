import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  className?: string;
  colSpan?: number;
}

export const DashboardWidget = ({
  id,
  title,
  icon,
  children,
  onRemove,
  className,
  colSpan = 1,
}: DashboardWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        colSpan === 2 ? "md:col-span-2" : "",
        isDragging ? "z-50 opacity-80" : "",
        className
      )}
    >
      <Card className="h-full border-border/30 bg-card/60 backdrop-blur-sm hover:border-accent/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="text-accent">{icon}</div>
            <CardTitle className="text-sm font-semibold font-serif">{title}</CardTitle>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(id)}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
      </Card>
    </div>
  );
};
