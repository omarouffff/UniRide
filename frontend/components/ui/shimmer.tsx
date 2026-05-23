import { cn } from '@/lib/utils';

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-slate-800/80 via-slate-700/60 to-slate-800/80 bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 space-y-3">
      <Shimmer className="h-4 w-2/3" />
      <Shimmer className="h-3 w-1/2" />
      <div className="flex justify-between pt-2">
        <Shimmer className="h-6 w-20 rounded-full" />
        <Shimmer className="h-6 w-16" />
      </div>
    </div>
  );
}
