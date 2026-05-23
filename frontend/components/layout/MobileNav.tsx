'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/' as const, label: 'Home', icon: Home },
  { href: '/my-trips' as const, label: 'Trips', icon: Ticket },
  { href: '/qr' as const, label: 'QR', icon: QrCode },
  { href: '/profile' as const, label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-2 py-2 sm:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition',
                active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
