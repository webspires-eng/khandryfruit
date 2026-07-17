/**
 * Route-level loading fallbacks. Next renders these instantly on navigation, so
 * a click always produces immediate feedback even when the data is slow.
 * Shapes mirror the real page to avoid a jarring swap when content arrives.
 */

export function Skeleton({ className }: { className?: string }) {
  return <span className={`skeleton ${className ?? ""}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <Skeleton className="skeleton-image" />
          <Skeleton className="skeleton-line w-70" />
          <Skeleton className="skeleton-line w-40" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({
  label,
  count = 8,
}: {
  label: string;
  count?: number;
}) {
  return (
    <div className="section container" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skeleton-heading">
        <Skeleton className="skeleton-line tall w-30" />
        <Skeleton className="skeleton-line w-50" />
      </div>
      <ProductGridSkeleton count={count} />
    </div>
  );
}
