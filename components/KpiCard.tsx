interface KpiCardProps {
  variant: 'danger' | 'warn' | 'good' | 'info';
  label: string;
  value: string;
  desc: string;
}

export function KpiCard({ variant, label, value, desc }: KpiCardProps) {
  const variantStyles = {
    danger: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#B91C1C',
    },
    warn: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#B45309',
    },
    good: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#15803D',
    },
    info: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1D4ED8',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '12px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: style.text,
          lineHeight: '1.2',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#6B7280',
          lineHeight: '1.4',
        }}
      >
        {desc}
      </div>
    </div>
  );
}
