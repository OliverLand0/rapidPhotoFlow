import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export function PhotoCardSkeleton() {
  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}
