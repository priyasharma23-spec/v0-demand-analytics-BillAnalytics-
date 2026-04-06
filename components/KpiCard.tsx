interface KpiCardProps {
  variant: 'danger' | 'warn' | 'good' | 'info';
  label: string;
  value: string;
  desc: string;
}

export function KpiCard({ variant, label, value, desc }: KpiCardProps) {
  const variantStyles = {
    danger: {
      card: 'bg-[#FCEBEB]',
      borderColor: '#F7C1C1',
      label: 'text-[#791F1F]',
      value: 'text-[#A32D2D]',
      desc: 'text-[#791F1F]',
    },
    warn: {
      card: 'bg-[#FAEEDA]',
      borderColor: '#FAC775',
      label: 'text-[#633806]',
      value: 'text-[#854F0B]',
      desc: 'text-[#633806]',
    },
    good: {
      card: 'bg-[#EAF3DE]',
      borderColor: '#C0DD97',
      label: 'text-[#27500A]',
      value: 'text-[#3B6D11]',
      desc: 'text-[#27500A]',
    },
    info: {
      card: 'bg-[#E6F1FB]',
      borderColor: '#B5D4F4',
      label: 'text-[#0C447C]',
      value: 'text-[#185FA5]',
      desc: 'text-[#0C447C]',
    },
  };
  const style = variantStyles[variant];

  return (
    <div
      className={`kpi-card ${style.card} border rounded-lg p-3.5`}
      style={{
        borderColor: style.borderColor,
        borderWidth: '0.5px',
      }}
    >
      <div className={`kpi-label text-xs font-medium uppercase tracking-wide ${style.label}`}>{label}</div>
      <div className={`kpi-value text-2xl font-medium mt-1.5 ${style.value}`}>{value}</div>
      <div className={`kpi-desc text-xs mt-1 ${style.desc}`}>{desc}</div>
    </div>
  );
}
