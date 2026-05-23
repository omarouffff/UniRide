'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bus,
  Route,
  Calendar,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';

const links = [
  { href: '/admin' as const, label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users' as const, label: 'Users', icon: Users },
  { href: '/admin/trips' as const, label: 'Trips', icon: Calendar },
  { href: '/admin/routes' as const, label: 'Routes', icon: Route },
  { href: '/admin/buses' as const, label: 'Buses', icon: Bus },
  { href: '/admin/payments' as const, label: 'Payments', icon: CreditCard },
  { href: '/admin/reports' as const, label: 'Reports', icon: BarChart3 },
  { href: '/admin/complaints' as const, label: 'Complaints', icon: MessageSquare },
  { href: '/admin/settings' as const, label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-20 pb-12">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1 rounded-3xl border border-white/10 bg-slate-900/80 p-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition',
                  pathname === href || (href !== '/admin' && pathname.startsWith(href))
                    ? 'bg-cyan-500/15 text-cyan-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
