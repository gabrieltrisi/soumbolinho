export default function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/60 px-4 py-3">
      <div className="font-display text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`mt-0.5 font-display text-[22px] font-bold tabular-nums ${accent ?? "text-ink"}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-ink-soft">{sub}</div> : <div className="mt-0.5 h-[15px]" />}
    </div>
  );
}
