import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

/** Shimmer placeholder block. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

/** Card grid skeleton — employees / lists. */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="df-card flex items-center gap-3 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 max-w-[10rem]" />
            <Skeleton className="h-3 w-1/2 max-w-[7rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Metric row skeleton. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="df-card space-y-3 p-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Table / chart block skeleton. */
export function SkeletonPanel({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`df-card p-5 ${className}`} role="status" aria-label="Loading">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-[calc(100%-2.5rem)] w-full rounded-xl" />
    </div>
  );
}

/** Full page content skeleton. */
export function SkeletonPage() {
  return (
    <div className="animate-fade-up space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <SkeletonStats />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  );
}
