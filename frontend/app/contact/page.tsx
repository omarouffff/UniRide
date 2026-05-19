import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-lg">
          <h1 className="text-3xl font-semibold text-white">Contact Transportation Office</h1>
          <form className="mt-6 space-y-4">
            <Input placeholder="Your name" />
            <Input type="email" placeholder="Your email" />
            <Input placeholder="Message" />
            <Button type="button">Send message</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
