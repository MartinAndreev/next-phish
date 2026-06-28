import { Skeleton } from "primereact/skeleton";

interface ListPageSkeletonProps {
  titleWidth?: string;
  subtitleWidth?: string;
  tableHeight?: string;
}

export function ListPageSkeleton({
  titleWidth = "220px",
  subtitleWidth = "460px",
  tableHeight = "460px",
}: ListPageSkeletonProps) {
  return (
    <div className="px-6 py-8">
      <Skeleton width={titleWidth} height="1rem" className="mb-4" />
      <Skeleton width="300px" height="2rem" className="mb-2" />
      <Skeleton width={subtitleWidth} height="1rem" className="mb-6" />
      <Skeleton width="160px" height="2.75rem" className="mb-6" />
      <Skeleton width="100%" height={tableHeight} borderRadius="1rem" />
    </div>
  );
}
