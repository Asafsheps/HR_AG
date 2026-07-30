import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  success: "bg-green-100  text-green-700",
  warning: "bg-amber-100  text-amber-700",
  danger:  "bg-red-100    text-red-700",
  info:    "bg-blue-100   text-blue-700",
  primary: "bg-primary-100 text-primary-700",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
