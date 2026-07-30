import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// Deterministic color from name
const COLORS = [
  "bg-blue-500","bg-indigo-500","bg-purple-500","bg-pink-500",
  "bg-emerald-500","bg-teal-500","bg-cyan-500","bg-orange-500",
];
function getColor(name: string) {
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[idx];
}

export function Avatar({ name, imageUrl, size = "md", className }: AvatarProps) {
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)} />
    );
  }
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-medium flex-shrink-0",
      sizes[size], getColor(name), className
    )}>
      {getInitials(name)}
    </div>
  );
}
