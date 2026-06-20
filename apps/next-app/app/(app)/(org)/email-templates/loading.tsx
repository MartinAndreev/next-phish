import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8">
      <Skeleton width="220px" height="1rem" className="mb-4" />
      <Skeleton width="300px" height="2rem" className="mb-2" />
      <Skeleton width="460px" height="1rem" className="mb-6" />
      <Skeleton width="160px" height="2.75rem" className="mb-6" />
      <Skeleton width="100%" height="460px" borderRadius="1rem" />
    </div>
  );
}
