import { cn } from "@/lib/utils";

interface ZoneBadgeProps {
  percentage: number;
  showLabel?: boolean;
}

export default function ZoneBadge({ percentage, showLabel = false }: ZoneBadgeProps) {
  const getZone = () => {
    if (percentage >= 75) {
      return { label: "Safe", className: "bg-safe text-safe-foreground" };
    } else if (percentage >= 60) {
      return { label: "Average", className: "bg-average text-average-foreground" };
    } else {
      return { label: "Danger", className: "bg-danger text-danger-foreground" };
    }
  };

  const zone = getZone();

  // Don't show badge if no classes recorded
  if (percentage === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full",
        zone.className
      )}
    >
      {showLabel ? zone.label : zone.label.charAt(0)}
    </span>
  );
}