import { Skeleton } from "primereact/skeleton";

export default function SetupLoading() {
  return (
    <div className="relative isolate flex min-h-full flex-1 items-center justify-center overflow-hidden bg-brand-navy px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(41,184,255,0.22),_transparent_65%)]" />
      <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="auth-card rounded-3xl">
        <div className="min-w-[400px] md:min-w-[600px] m-[1px] auth-card__container w-full max-w-md rounded-3xl border border-white/10 bg-brand-dark p-8 shadow-[0_24px_80px_rgba(2,11,29,0.55)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center">
            <Skeleton shape="circle" size="5rem" className="mb-6" />
            <Skeleton
              width="6rem"
              height="1.5rem"
              className="mb-4"
              borderRadius="9999px"
            />
            <Skeleton
              width="6rem"
              height="0.375rem"
              className="mb-5"
              borderRadius="9999px"
            />
            <Skeleton width="14rem" height="2rem" className="mb-2" />
            <Skeleton width="12rem" height="1rem" />
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Skeleton width="6rem" height="0.875rem" />
              <Skeleton width="100%" height="2.75rem" borderRadius="0.75rem" />
            </div>
            <div className="space-y-2">
              <Skeleton width="4rem" height="0.875rem" />
              <Skeleton width="100%" height="2.75rem" borderRadius="0.75rem" />
            </div>
            <div className="space-y-2">
              <Skeleton width="5rem" height="0.875rem" />
              <Skeleton width="100%" height="2.75rem" borderRadius="0.75rem" />
            </div>
            <div className="space-y-2">
              <Skeleton width="8rem" height="0.875rem" />
              <Skeleton width="100%" height="2.75rem" borderRadius="0.75rem" />
            </div>
            <Skeleton width="100%" height="3rem" borderRadius="0.75rem" />
          </div>

          <div className="mt-6 flex justify-center">
            <Skeleton width="10rem" height="0.875rem" />
          </div>
        </div>
      </div>
    </div>
  );
}
