import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex justify-between">
        <div>
          <Skeleton width="10rem" height="2rem" />
          <Skeleton width="24rem" height="1rem" className="mt-2" />
        </div>
        <Skeleton width="8rem" height="2.5rem" />
      </div>
      <Skeleton
        width="100%"
        height="4rem"
        borderRadius="0.75rem"
        className="mb-5"
      />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2].map((item) => (
          <Skeleton
            key={item}
            width="20rem"
            height="28rem"
            borderRadius="0.75rem"
          />
        ))}
      </div>
    </div>
  );
}
