import { Skeleton } from "primereact/skeleton";

interface FormSkeletonProps {
  breadcrumbWidth?: string;
  titleWidth?: string;
  subtitleWidth?: string;
  editorHeight?: string;
}

export function FormSkeleton({
  breadcrumbWidth = "220px",
  titleWidth = "280px",
  subtitleWidth = "420px",
  editorHeight = "720px",
}: FormSkeletonProps) {
  return (
    <div className="px-6 py-8">
      <Skeleton width={breadcrumbWidth} height="1rem" className="mb-4" />
      <Skeleton width={titleWidth} height="2rem" className="mb-2" />
      <Skeleton width={subtitleWidth} height="1rem" className="mb-8" />
      <Skeleton width="100%" height={editorHeight} borderRadius="1rem" />
    </div>
  );
}
