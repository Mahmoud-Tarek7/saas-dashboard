export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-lg bg-navy-700/60 ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div>
          <Skeleton className="h-3.5 w-28 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}
