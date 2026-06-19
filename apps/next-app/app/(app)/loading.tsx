import { Skeleton } from "primereact/skeleton";

export default function AppLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-navy">
      {/* Sidebar skeleton */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-brand-dark p-4 lg:flex">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <Skeleton shape="circle" size="2.5rem" />
          <Skeleton width="8rem" height="1.25rem" />
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-2">
          <Skeleton width="100%" height="2.25rem" borderRadius="0.75rem" />
          <Skeleton width="85%" height="2.25rem" borderRadius="0.75rem" />
          <Skeleton width="90%" height="2.25rem" borderRadius="0.75rem" />
          <Skeleton width="75%" height="2.25rem" borderRadius="0.75rem" />
          <Skeleton width="80%" height="2.25rem" borderRadius="0.75rem" />
        </div>

        {/* Profile at bottom */}
        <div className="mt-auto flex items-center gap-3 pt-4">
          <Skeleton shape="circle" size="2.5rem" />
          <div className="flex-1">
            <Skeleton width="70%" height="0.875rem" className="mb-1" />
            <Skeleton width="50%" height="0.75rem" />
          </div>
        </div>
      </aside>

      {/* Mobile header skeleton */}
      <div className="flex flex-1 flex-col lg:hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-brand-dark p-4">
          <Skeleton shape="circle" size="2rem" />
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton shape="circle" size="2rem" />
        </div>
        <main className="flex-1 p-6">
          <Skeleton width="40%" height="2rem" className="mb-6" />
          <Skeleton width="100%" height="200px" borderRadius="1rem" />
        </main>
      </div>

      {/* Desktop content skeleton */}
      <main className="hidden flex-1 overflow-y-auto p-6 lg:block">
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
