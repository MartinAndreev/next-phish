import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton width="14rem" height="2rem" className="mb-6" />
      <Skeleton width="100%" height="24rem" borderRadius="0.75rem" />
    </div>
  );
}
