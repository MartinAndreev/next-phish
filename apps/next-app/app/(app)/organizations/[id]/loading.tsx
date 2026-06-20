import { Skeleton } from "primereact/skeleton";

export default function OrganizationManagerLoading() {
  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <Skeleton width="200px" height="1rem" className="mb-4" />
        <Skeleton width="250px" height="2rem" className="mb-2" />
        <Skeleton width="350px" height="1rem" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
          <Skeleton width="180px" height="1rem" className="mb-4" />
          <Skeleton width="100%" height="250px" />
        </div>
        <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
          <Skeleton width="220px" height="1rem" className="mb-4" />
          <Skeleton width="100%" height="250px" />
        </div>
      </div>

      <div>
        <Skeleton width="100px" height="1.5rem" className="mb-4" />
        <div className="rounded-xl border border-white/10 bg-brand-dark">
          <Skeleton width="100%" height="400px" />
        </div>
      </div>
    </div>
  );
}
