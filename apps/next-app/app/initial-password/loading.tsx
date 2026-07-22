import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-brand-navy p-8">
      <Skeleton width="32rem" height="28rem" borderRadius="1.5rem" />
    </div>
  );
}
