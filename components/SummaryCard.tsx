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
        background: '#ffffff',
        borderTop: '1px solid #f3f4f6',
        borderRight: '1px solid #f3f4f6',
        borderBottom: '1px solid #f3f4f6',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#858ea2',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#192744',
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
        }}
      >
        {sub}
      </div>
    </div>
  )
}
