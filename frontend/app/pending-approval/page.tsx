import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default function PendingApprovalPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <Card className="max-w-lg rounded-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/10 text-amber-200">
          <Clock3 className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">{t('auth.pendingApprovalTitle')}</h1>
        <p className="mt-3 text-slate-400">
          {t('auth.pendingApprovalText')}
        </p>
        <Link href="/login" className={buttonVariants({ className: 'mt-6' })}>
          {t('auth.backToLogin')}
        </Link>
      </Card>
    </main>
  );
}
