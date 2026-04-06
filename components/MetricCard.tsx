interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  subColor: string;
}

export function MetricCard({ label, value, sub, subColor }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="text-xs font-medium text-foreground-secondary uppercase">{label}</div>
      <div className="text-lg font-semibold text-foreground mt-1.5">{value}</div>
      <div className="text-xs mt-1" style={{ color: subColor }}>{sub}</div>
    </div>
  );
}
