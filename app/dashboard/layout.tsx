import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bell, LayoutDashboard, Users, FolderKanban, UsersRound, Settings, LogOut, ChevronRight, FileBarChart, Sparkles, CreditCard } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getProfile, listNotifications } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard',
};

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/team', label: 'Team', icon: UsersRound },
  { href: '/dashboard/empire-os', label: 'Empire OS', icon: Sparkles },
  { href: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, supabase } = await requireUser();
  const [profile, notifications] = await Promise.all([
    getProfile(supabase, user.id),
    listNotifications(supabase, user.id, { limit: 20, unreadOnly: true }),
  ]);

  const displayName = profile?.name || user.email?.split('@')[0] || 'there';
  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-white/10 bg-background/50 backdrop-blur-md">
        <div className="px-6 py-5">
          <Link href="/" className="font-extrabold text-xl tracking-tight">
            Identi<span className="text-primary">marketing</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-background/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/notifications" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
