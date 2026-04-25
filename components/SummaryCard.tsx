interface SummaryCardProps {
  label: string
  value: string | number
  sub: string
  subColor: string
  borderColor?: string
}

export function SummaryCard({
  label,
  value,
  sub,
  subColor,
  borderColor = '#4F46E5',
}: SummaryCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: 700,
          color: borderColor || '#111827',
          lineHeight: '1',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: subColor,
          marginTop: '4px',
        }}
      >
        {sub}
      </div>
    </div>
  )
}
