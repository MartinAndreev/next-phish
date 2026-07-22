import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton width="18rem" height="2rem" />
      <Skeleton width="100%" height="28rem" borderRadius="1rem" />
    </div>
  );
}
