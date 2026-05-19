'use client';

import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-lg">
          <Bell className="h-6 w-6 text-cyan-200" />
          <h1 className="mt-4 text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-2 text-slate-400">Real-time booking and approval notifications appear here when Socket.io events arrive.</p>
        </Card>
      </div>
    </main>
  );
}
