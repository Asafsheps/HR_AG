"use client";

import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold text-neutral-900 mr-2">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="חיפוש מועמדים, משרות..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-md bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md">
          <Bell className="w-5 h-5" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* User */}
        {profile && (
          <div className="flex items-center gap-2">
            <Avatar name={profile.full_name} imageUrl={profile.avatar_url} size="sm" />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-neutral-800 leading-tight">{profile.full_name}</p>
              <p className="text-xs text-neutral-500 capitalize">{profile.role.replace("_", " ")}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
