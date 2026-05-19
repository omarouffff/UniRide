import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <Card className="w-full max-w-md rounded-lg">
        <h1 className="text-2xl font-semibold text-white">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-400">Password reset email delivery can be connected through SMTP in production.</p>
        <form className="mt-6 space-y-4">
          <Input type="email" placeholder="student@university.edu" />
          <Button type="button" className="w-full">Request reset</Button>
        </form>
        <Link href="/login" className="mt-4 block text-sm text-cyan-200">Back to login</Link>
      </Card>
    </main>
  );
}
