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

export function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-24" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-16" />
      </td>
    </tr>
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

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
