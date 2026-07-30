interface MetricProps {
  label: string;
  value: string;
  tone?: 'danger';
}

export function Metric({ label, value, tone }: MetricProps) {
  return (
    <article className={`panel metric ${tone ?? ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
