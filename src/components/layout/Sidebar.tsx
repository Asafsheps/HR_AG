"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, MessageSquare,
  BarChart2, Settings, LogOut, ChevronLeft, Bot, Megaphone,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/dashboard",      label: "דשבורד",       icon: LayoutDashboard },
  { href: "/jobs",           label: "משרות",         icon: Briefcase },
  { href: "/campaigns",      label: "קמפיינים",      icon: Megaphone },
  { href: "/candidates",     label: "מועמדים",       icon: Users },
  { href: "/agent",          label: "סוכן AI",       icon: Bot,            badge: "חדש" },
  { href: "/conversations",  label: "שיחות",         icon: MessageSquare },
  { href: "/analytics",      label: "אנליטיקס",      icon: BarChart2 },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "הגדרות", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "flex flex-col h-full bg-white border-r border-neutral-200 transition-all duration-200",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-neutral-900 truncate">{APP_NAME}</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 pt-2 border-t border-neutral-200 space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>יציאה</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}


