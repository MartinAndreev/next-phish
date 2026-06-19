import { Skeleton } from "primereact/skeleton";

export default function AppLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-navy">
      <main className="flex-1 overflow-y-auto p-6">
        <Skeleton width="30%" height="2rem" className="mb-6" />
        <div className="grid gap-4">
          <Skeleton width="100%" height="150px" borderRadius="1rem" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton width="100%" height="120px" borderRadius="1rem" />
            <Skeleton width="100%" height="120px" borderRadius="1rem" />
          </div>
        </div>
      </main>
    </div>
  );
}
