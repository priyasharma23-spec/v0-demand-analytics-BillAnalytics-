'use client';

import React, { useState, useMemo } from 'react';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';
import { SummaryCard } from '@/components/SummaryCard';

interface AppState {
  view: 'yearly' | 'monthly';
  stateF: string;
  branchF: string;
  caF: string;
  billCategory: string;
  section: string;
}

interface OverviewSectionProps {
  appState: AppState;
  onStateChange: (state: string) => void;
  onBranchChange: (branch: string) => void;
  onCAChange: (ca: string) => void;
  onSectionChange: (section: string) => void;
  onHeatmapCellClick?: (state: string, month: string, monthIndex: number) => void;
  onAnomalyClick?: (anomalyKey: 'over_contracted_every_month' | 'pf_below_threshold' | 'recurring_late_payment' | 'under_utilised') => void;
}

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
    <circle cx="5.5" cy="5.5" r="4.5" stroke="#9b9b96" strokeWidth="1" fill="none" />
    <line x1="9" y1="9" x2="12.5" y2="12.5" stroke="#9b9b96" strokeWidth="1" />
  </svg>
);

const SearchResult = ({ icon, iconBg, iconColor, name, meta, badge, badgeType, onClick }: any) => (
  <div onClick={onClick} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', transition: 'background 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f5f5f4'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: iconBg, color: iconColor, fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744' }}>{name}</div>
      <div style={{ fontSize: '11px', color: '#858ea2' }}>{meta}</div>
    </div>
    {badge && <div style={{ fontSize: '9px', fontWeight: 600, color: badgeType === 'danger' ? '#A32D2D' : '#854F0B', background: badgeType === 'danger' ? '#FCEBEB' : '#FAEEDA', padding: '2px 6px', borderRadius: '3px' }}>{badge}</div>}
  </div>
);

const PinChip = ({ name, type, dashed, onClick }: any) => {
  const dotColors: Record<string, string> = { state: '#2500D7', branch: '#185FA5', ca: '#3B6D11' };
  return (
    <div onClick={onClick} style={{ height: '30px', padding: '0 10px', borderRadius: '20px', border: `0.5px ${dashed ? 'dashed' : 'solid'} rgba(0,0,0,0.15)`, background: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f5f5f4'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColors[type] }} />
      {name}
    </div>
  );
};

const SortPill = ({ label, active, onClick }: any) => (
  <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: active ? 'none' : '0.5px solid rgba(0,0,0,0.15)', background: active ? '#EBEAFF' : 'transparent', color: active ? '#2500D7' : '#858ea2', fontWeight: active ? 500 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
    {label}
  </button>
);

const AnomalyCard = ({ anomalyKey, title, amount, amountLabel, amountColor, cta, iconBg, iconColor, onAnomalyClick, where }: any) => {
  const [hov, setHov] = React.useState(false)
  const getIcon = () => {
    if (anomalyKey === 'over_contracted_every_month') return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2.5L1.5 15.5h15L9 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M9 7v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="13" r="0.8" fill="currentColor" />
      </svg>
    )
    if (anomalyKey === 'pf_below_threshold') return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" />
        <path d="M9 5.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="12" r="0.8" fill="currentColor" />
      </svg>
    )
    if (anomalyKey === 'recurring_late_payment') return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
        <path d="M2 7h14" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 13l4-4 3 2.5 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <div
      onClick={() => onAnomalyClick?.(anomalyKey)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#FAFAFA' : '#fff',
        border: '1.5px solid ' + (hov ? '#2500D7' : '#f3f4f6'),
        borderRadius: '14px',
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all .16s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,.07)' : 'none',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
          {getIcon()}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: amountColor, letterSpacing: '-0.5px' }}>{amount}</div>
          <div style={{ fontSize: '11px', color: '#858ea2' }}>{amountLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', lineHeight: 1.4 }}>{title}</div>
        {where && <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '6px' }}>{where}</div>}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAnomalyClick?.(anomalyKey) }}
        style={{
          alignSelf: 'flex-start',
          background: hov ? '#2500D7' : '#EBEAFF',
          color: hov ? '#fff' : '#2500D7',
          border: 'none', borderRadius: '8px',
          padding: '7px 14px', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all .16s', fontFamily: 'inherit',
        }}>
        {cta} →
      </button>
    </div>
  )
};

export default function OverviewSection({ appState, onStateChange, onBranchChange, onCAChange, onSectionChange, onHeatmapCellClick, onAnomalyClick }: OverviewSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const MAX_PINS = 10;

  const [pinnedEntities, setPinnedEntities] = useState([
    { name: 'Maharashtra', type: 'state' },
    { name: 'Mumbai North', type: 'branch' },
    { name: 'MH-MN-0101', type: 'ca' },
    { name: 'DL-DS-4202', type: 'ca' },
  ]);

  const [recentEntities] = useState([
    { name: 'Delhi South', type: 'branch' },
    { name: 'Gujarat', type: 'state' },
    { name: 'KA-BE-1103', type: 'ca' },
    { name: 'Tamil Nadu', type: 'state' },
    { name: 'Bangalore East', type: 'branch' },
    { name: 'UP-LE-6101', type: 'ca' },
  ]);

  const handleUnpin = (name: string) => {
    setPinnedEntities(prev => prev.filter(e => e.name !== name));
  };

  const handlePin = (entity: { name: string; type: string }) => {
    if (pinnedEntities.length >= MAX_PINS) return;
    if (pinnedEntities.find(e => e.name === entity.name)) return;
    setPinnedEntities(prev => [...prev, entity]);
  };

  const visibleRecent = recentEntities
    .filter(r => !pinnedEntities.find(p => p.name === r.name))
    .slice(0, 10 - pinnedEntities.length);

  const dotColor = (type: string) =>
    type === 'state' ? '#2500D7' :
    type === 'branch' ? '#185FA5' : '#3B6D11';

  const summaryCards = [
    { label: 'Total portfolio', value: '₹48.3L', sub: '8 states · 62 branches · 187 CAs', subColor: '#858ea2' },
    { label: 'Total leakages', value: '₹9.2L', sub: '19% of total bill', subColor: '#A32D2D' },
    { label: 'CAs over contracted', value: '43 / 187', sub: '23% of all CAs', subColor: '#854F0B' },
    { label: 'Potential savings', value: '₹6.1L', sub: 'annually', subColor: '#3B6D11' },
  ];

  const anomalies = [
    {
      key: 'over_contracted_every_month' as const,
      where: 'MH · DL · KA',
      color: 'red',
      title: '43 CAs exceeded contracted demand every single month',
      desc: 'Across Maharashtra, Delhi and Karnataka — these CAs have structurally under-sized contracts. Raising contracted demand to P90 MDI + 15% buffer would eliminate excess charges.',
      tags: [{ label: 'Excess demand', variant: 'danger' }, { label: '12/12 months', variant: 'danger' }, { label: 'Maharashtra · Delhi · Karnataka', variant: 'warn' }],
      amount: '₹4.8L',
      amountLabel: 'avoidable / yr',
      amountColor: '#A32D2D',
      cta: 'View CAs →',
      ctaBg: '#EBEAFF',
      ctaColor: '#2500D7',
      borderColor: '#FCEBEB',
      iconBg: '#FCEBEB',
      iconColor: '#A32D2D',
      section: 'excess-demand',
    },
    {
      key: 'pf_below_threshold' as const,
      where: 'UP · RJ',
      color: 'amber',
      title: 'Power factor below 0.90 in 28 branches for 6+ months',
      desc: 'PF penalty triggered consistently in Uttar Pradesh and Rajasthan clusters. Installing capacitor banks at 6 high-impact branches would recover most of this charge.',
      tags: [{ label: 'PF penalty', variant: 'warn' }, { label: '6+ months', variant: 'warn' }, { label: '28 branches', variant: 'info' }],
      amount: '₹2.1L',
      amountLabel: 'avoidable / yr',
      amountColor: '#854F0B',
      cta: 'View branches →',
      ctaBg: '#FFF3E0',
      ctaColor: '#854F0B',
      borderColor: '#FAEEDA',
      iconBg: '#FAEEDA',
      iconColor: '#854F0B',
      section: 'leakages',
    },
    {
      key: 'recurring_late_payment' as const,
      where: 'WB · GJ',
      color: 'red',
      title: 'Late payment surcharge recurring in 19 CAs — 3+ consecutive months',
      desc: 'Concentrated in West Bengal and Gujarat. Payment scheduling alignment would eliminate this entirely — no tariff or infrastructure changes needed.',
      tags: [{ label: 'Late payment', variant: 'danger' }, { label: '3+ consecutive months', variant: 'warn' }, { label: 'West Bengal · Gujarat', variant: 'info' }],
      amount: '₹1.3L',
      amountLabel: 'avoidable / yr',
      amountColor: '#A32D2D',
      cta: 'View CAs →',
      ctaBg: '#EBEAFF',
      ctaColor: '#2500D7',
      borderColor: '#FCEBEB',
      iconBg: '#FCEBEB',
      iconColor: '#A32D2D',
      section: 'leakages',
    },
    {
      key: 'under_utilised' as const,
      where: 'TN · RJ',
      color: 'blue',
      title: '12 CAs under-utilising contracted demand below 70% — revision opportunity',
      desc: 'Tamil Nadu and Rajasthan clusters are consistently drawing well below contracted level. Reducing contracted demand for these CAs would lower fixed charges.',
      tags: [{ label: 'Under-utilised', variant: 'info' }, { label: 'Savings opportunity', variant: 'success' }, { label: 'Tamil Nadu · Rajasthan', variant: 'info' }],
      amount: '₹0.8L',
      amountLabel: 'saveable / yr',
      amountColor: '#1A7A45',
      cta: 'View CAs →',
      ctaBg: '#EAF3DE',
      ctaColor: '#27500A',
      borderColor: '#E6F1FB',
      iconBg: '#E6F1FB',
      iconColor: '#27500A',
      section: 'optimization',
    },
  ];

  const heatmapStates = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Delhi', 'Rajasthan', 'UP', 'West Bengal'];
  const heatmapMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Mar'];
  const heatmapData = [
    [22, 18, 25, 31, 28, 19, 22, 20],
    [14, 12, 18, 22, 19, 15, 16, 13],
    [8, 9, 11, 14, 12, 10, 9, 8],
    [17, 15, 20, 24, 22, 18, 19, 16],
    [25, 22, 28, 35, 32, 26, 24, 22],
    [11, 10, 13, 17, 15, 12, 11, 10],
    [19, 17, 21, 26, 23, 19, 20, 18],
    [13, 12, 15, 19, 17, 14, 13, 12],
  ];

  const getCellStyle = (v: number): { bg: string; textColor: string } => {
    if (v >= 30) return { bg: '#A32D2D', textColor: '#ffffff' };
    if (v >= 23) return { bg: '#E24B4A', textColor: '#ffffff' };
    if (v >= 16) return { bg: '#FF9E95', textColor: '#791F1F' };
    if (v >= 10) return { bg: '#FFCEC8', textColor: '#791F1F' };
    return { bg: '#FFF0EE', textColor: '#A32D2D' };
  };

  const severityLabel = (v: number) =>
    v >= 30 ? 'Critical' :
    v >= 23 ? 'High' :
    v >= 16 ? 'Elevated' :
    v >= 10 ? 'Moderate' : 'In range';

  const q = searchQuery.toLowerCase();
  const filteredStates = useMemo(() => {
    return STATES.filter(s => s.toLowerCase().includes(q))
      .slice(0, 4)
      .map((s, i) => ({
        name: s,
        initials: s.substring(0, 2).toUpperCase(),
        branches: Object.keys(BRANCHES).filter(b => BRANCHES[b as keyof typeof BRANCHES] && b.includes(s)).length,
        cas: Object.keys(BRANCHES)
          .filter(b => BRANCHES[b as keyof typeof BRANCHES] && b.includes(s))
          .reduce((sum, b) => sum + (CAS[b as keyof typeof CAS]?.length || 0), 0),
        badge: i === 0 ? 'High risk' : undefined,
        badgeType: i === 0 ? 'danger' : undefined,
      }));
  }, [q]);

  const filteredBranches = useMemo(() => {
    const allBranches = Object.keys(BRANCHES);
    return allBranches
      .filter(b => b.toLowerCase().includes(q))
      .slice(0, 4)
      .map((b, i) => {
        const state = Object.keys(BRANCHES).find(s => BRANCHES[s as keyof typeof BRANCHES]?.includes(b)) || '';
        return {
          name: b,
          initials: b.substring(0, 2).toUpperCase(),
          state: state || 'Unknown',
          cas: CAS[b as keyof typeof CAS]?.length || 0,
          badge: i === 0 ? 'Risk' : undefined,
          badgeType: i === 0 ? 'warn' : undefined,
        };
      });
  }, [q]);

  const filteredCAs = useMemo(() => {
    const allCAs = Object.values(CAS).flat();
    return allCAs
      .filter(c => c.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c, i) => {
        const branch = Object.keys(CAS).find(b => CAS[b as keyof typeof CAS]?.includes(c)) || 'Unknown';
        return {
          id: c,
          branch: branch,
          category: 'Active',
          badge: i === 0 ? 'Over' : undefined,
          badgeType: i === 0 ? 'danger' : undefined,
        };
      });
  }, [q]);

  const handleSelectEntity = (name: string, type: string) => {
    if (type === 'state') onStateChange(name);
    else if (type === 'branch') onBranchChange(name);
    else if (type === 'ca') onCAChange(name);
    onSectionChange('excess-demand');
    setSearchOpen(false);
  };

  const handleAnomalyCTA = (section: string) => {
    onSectionChange(section);
  };

  const handleHeatmapCell = (stateName: string, month: string, monthIndex: number) => {
    if (onHeatmapCellClick) {
      onHeatmapCellClick(stateName, month, monthIndex);
    } else {
      onStateChange(stateName);
      onSectionChange('leakages');
    }
  };

  const approvalQueueItems = [
    {
      key: 'action-required',
      title: 'Action required',
      count: 34,
      countColor: '#A32D2D',
      tag: 'Bill copy failed',
      tagColor: '#791F1F',
      tagBg: '#FCEBEB',
      desc: 'BBPS fetch failed · payment blocked',
      borderColor: '#F7C1C1',
      iconBg: '#FCEBEB',
      iconPath: (
        <>
          <path d="M8 3v5" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="11.5" r="0.75" fill="#A32D2D"/>
          <circle cx="8" cy="8" r="6.5" stroke="#A32D2D" strokeWidth="1.2"/>
        </>
      ),
    },
    {
      key: 'not-generated',
      title: 'Not generated',
      count: 170,
      countColor: '#854F0B',
      tag: 'No bill this month',
      tagColor: '#633806',
      tagBg: '#FAEEDA',
      desc: 'Active CAs · no bill generated this month',
      borderColor: '#FAC775',
      iconBg: '#FAEEDA',
      iconPath: (
        <>
          <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="#854F0B" strokeWidth="1.2"/>
          <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="#854F0B" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 10l3 3" stroke="#854F0B" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 13l3-3" stroke="#854F0B" strokeWidth="1.2" strokeLinecap="round"/>
        </>
      ),
    },
    {
      key: 'copy-pending',
      title: 'Copy pending',
      count: 62,
      countColor: '#185FA5',
      tag: 'Auto-fetch in progress',
      tagColor: '#0C447C',
      tagBg: '#E6F1FB',
      desc: 'Bill copy being fetched · no action needed',
      borderColor: '#B5D4F4',
      iconBg: '#E6F1FB',
      iconPath: (
        <>
          <path d="M8 3v2.5" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 10.5V13" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3 8h2.5" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10.5 8H13" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4.5 4.5l1.8 1.8" stroke="#185FA5" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9.7 9.7l1.8 1.8" stroke="#185FA5" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11.5 4.5L9.7 6.3" stroke="#185FA5" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M6.3 9.7L4.5 11.5" stroke="#185FA5" strokeWidth="1.2" strokeLinecap="round"/>
        </>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px', background: '#f5f6fa', minHeight: '100vh' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {summaryCards.map((card, i) => (
          <SummaryCard
            key={i}
            label={card.label}
            value={card.value}
            sub={card.sub}
            subColor={card.subColor}
            borderColor="#2500D7"
          />
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744' }}>Surfaced anomalies</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Ranked by avoidable cost · click any card to drill in</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {anomalies.map(({ key: anomalyKey, ...props }) => (
            <AnomalyCard key={anomalyKey} {...props} anomalyKey={anomalyKey} onCTA={handleAnomalyCTA} onAnomalyClick={onAnomalyClick} />
          ))}
        </div>
      </div>

      {/* Approval queue */}
      <div style={{ marginBottom: '16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>Approval Queue</div>
          <div style={{ fontSize: '13px', color: '#858ea2' }}>Config-driven · skip-approval corps not counted</div>
        </div>

        {/* Summary metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px', background: '#fff', borderRadius: '12px', padding: '24px 16px' }}>
          {[
            { label: 'Pending', count: 48, color: '#C47A00' },
            { label: 'Approved', count: 312, color: '#1A7A45' },
            { label: 'On Hold', count: 28, color: '#185FA5' },
            { label: 'Rejected', count: 12, color: '#E24B4A' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: '6px' }}>{m.count}</div>
              <div style={{ fontSize: '14px', color: '#192744', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Action Required section */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '10px' }}>Action Required</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {approvalQueueItems.map(item => (
              <div
                key={item.key}
                onClick={() => onSectionChange('billers')}
                style={{
                  background: item.iconBg,
                  border: `1px solid ${item.borderColor}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
              >
                {/* Left: Title and description */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: item.countColor, marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: item.countColor }}>{item.desc}</div>
                </div>
                {/* Right: Count */}
                <div style={{ fontSize: '36px', fontWeight: 700, color: item.countColor, marginLeft: '16px', flexShrink: 0 }}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744', marginBottom: '16px' }}>Leakage heat map — state × month (%)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#858ea2' }}>Low</span>
          {[
            { bg: '#FFF0EE', label: '<10%' },
            { bg: '#FFCEC8', label: '10–15%' },
            { bg: '#FF9E95', label: '16–22%' },
            { bg: '#E24B4A', label: '23–29%' },
            { bg: '#A32D2D', label: '≥30%' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', borderRadius: '2px', background: item.bg }} />
              <span style={{ fontSize: '10px', color: '#858ea2' }}>{item.label}</span>
            </div>
          ))}
          <span style={{ fontSize: '11px', color: '#858ea2' }}>High</span>
          <span style={{ fontSize: '11px', color: '#9b9b96', marginLeft: '12px' }}>· hover a cell to see exact %</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, minmax(0, 1fr))', gap: '3px' }}>
          <div></div>
          {heatmapMonths.map((m, i) => (
            <div key={i} style={{ fontSize: '10px', color: '#9b9b96', textAlign: 'center', marginBottom: '4px' }}>{m}</div>
          ))}
          {heatmapStates.map((state, si) => (
            <React.Fragment key={state}>
              <div style={{ fontSize: '11px', color: '#858ea2', textAlign: 'right', paddingRight: '8px' }}>{state}</div>
              {heatmapData[si].map((value, mi) => {
                const { bg, textColor } = getCellStyle(value);
                const isInRange = value < 10;
                return (
                  <div
                    key={`${si}-${mi}`}
                    onClick={() => handleHeatmapCell(state, heatmapMonths[mi], mi)}
                    title={`${state} · ${heatmapMonths[mi]}\n${value}% leakage — ${severityLabel(value)}`}
                    style={{
                      height: '36px',
                      borderRadius: '4px',
                      background: bg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'opacity 0.1s',
                      gap: '1px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.opacity = '0.8'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 500, color: textColor, lineHeight: 1 }}>
                      {value}%
                    </span>
                    {isInRange && (
                      <span style={{
                        fontSize: '8px',
                        fontWeight: 500,
                        color: '#3B6D11',
                        background: '#EAF3DE',
                        borderRadius: '3px',
                        padding: '0px 3px',
                        lineHeight: '12px',
                        letterSpacing: '0.02em',
                      }}>
                        in range
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
