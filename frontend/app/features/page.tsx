import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = ['JWT authentication with httpOnly cookies', 'Admin approval workflow', 'Cloudinary image storage', 'MongoDB Atlas persistence', 'Real-time booking updates', 'Driver QR boarding'];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold text-white">Features</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature} className="rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-cyan-200" />
              <p className="mt-3 text-white">{feature}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
