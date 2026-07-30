import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-neutral-200 shadow-card",
      paddings[padding],
      className
    )}>
      {children}
    </div>
  );
}
