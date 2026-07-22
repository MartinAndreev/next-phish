interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: string;
  accent: string;
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
          aria-hidden="true"
        >
          <i className={icon} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </article>
  );
}
