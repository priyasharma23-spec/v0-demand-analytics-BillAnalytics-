interface KpiCardProps {
  variant: 'danger' | 'warn' | 'good' | 'info';
  label: string;
  value: string;
  desc: string;
}

export function KpiCard({ variant, label, value, desc }: KpiCardProps) {
  const variantStyles = {
    danger: {
      background: '#fce8e8',
      borderColor: '#f5d0d0',
      label: '#8b2323',
      value: '#d63031',
      desc: '#8b2323',
      icon: '🔴',
    },
    warn: {
      background: '#fff4e6',
      borderColor: '#ffe0b3',
      label: '#b87400',
      value: '#e8860e',
      desc: '#b87400',
      icon: '🟠',
    },
    good: {
      background: '#e8f8f1',
      borderColor: '#c8e6d7',
      label: '#22863a',
      value: '#28a745',
      desc: '#22863a',
      icon: '🟢',
    },
    info: {
      background: '#e8f4fd',
      borderColor: '#b5d4f4',
      label: '#004c97',
      value: '#2500d7',
      desc: '#004c97',
      icon: '🔵',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      style={{
        background: style.background,
        borderTop: `1px solid ${style.borderColor}`,
        borderRight: `1px solid ${style.borderColor}`,
        borderBottom: `1px solid ${style.borderColor}`,
        borderLeft: `4px solid ${style.borderColor}`,
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: '"Inter", sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: style.label,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: style.value,
          lineHeight: '1.2',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: style.desc,
          lineHeight: '1.4',
        }}
      >
        {desc}
      </div>
    </div>
  );
}
