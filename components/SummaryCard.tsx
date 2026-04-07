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
  borderColor = '#2500d7',
}: SummaryCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderTop: '1px solid #f3f4f6',
        borderRight: '1px solid #f3f4f6',
        borderBottom: '1px solid #f3f4f6',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#858ea2',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 500,
          color: '#192744',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
    </div>
  )
}
