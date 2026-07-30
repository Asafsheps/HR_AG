import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  const trendUp = trend && trend.value >= 0;

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        {icon && (
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-semibold text-neutral-900">{value}</p>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <p className={cn("text-xs font-medium", trendUp ? "text-green-600" : "text-red-600")}>
          {trendUp ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </Card>
  );
}
