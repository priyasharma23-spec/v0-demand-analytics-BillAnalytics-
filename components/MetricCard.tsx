interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  subColor: string;
}

export function MetricCard({ label, value, sub, subColor }: MetricCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #f3f4f6',
        borderRadius: '4px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#858ea2',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#192744',
          fontFamily: '"Inter", sans-serif',
          lineHeight: '1.2',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: subColor,
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {sub}
      </div>
    </div>
  );
}
