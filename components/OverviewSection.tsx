'use client';

import React, { useState, useMemo } from 'react';
import { STATES, BRANCHES, CAS, getStateBills } from '@/lib/calculations';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  const [pinnedEntities, setPinnedEntities] = useState([
    { type: 'ca', name: 'Mumbai - Tech Hub', meta: 'CA # 123456' },
    { type: 'branch', name: 'Bangalore East', meta: 'Branch code KA-02' },
  ]);
  const [recentEntities] = useState([
    { type: 'state', name: 'Maharashtra', meta: '24 CAs' },
    { type: 'branch', name: 'Delhi South', meta: '8 CAs' },
  ]);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        {summaryCards.map((card, i) => (
          <div key={i} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '12px', color: card.subColor }}>{card.sub}</div>
          </div>
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

      {/* Action Queue */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744' }}>Bill copy status</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Action queue across all CAs · click to drill in</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {approvalQueueItems.map((item) => (
            <div
              key={item.key}
              onClick={() => onSectionChange(item.key as any)}
              style={{
                border: `1px solid ${item.borderColor}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: '#fff',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = '#fafafa';
                el.style.borderColor = item.countColor;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = '#fff';
                el.style.borderColor = item.borderColor;
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: item.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    {item.iconPath}
                  </svg>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: item.countColor, lineHeight: 1 }}>
                    {item.count}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: item.tagColor,
                    background: item.tagBg,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    marginTop: '4px',
                  }}>
                    {item.tag}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744', marginBottom: '4px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: '#858ea2', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap — India map */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Leakage heatmap — state × month</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Leakage as % of total bill · click a state to drill in</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#858ea2' }}>
            <span>Low</span>
            {(['#EAF3DE','#FAC775','#EF9F27','#E24B4A','#A32D2D'] as const).map((bg, bi) => (
              <div key={bi} style={{ width: '16px', height: '10px', borderRadius: '2px', background: bg }} />
            ))}
            <span>High</span>
          </div>
        </div>
        {(() => {
          const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
          const leakData: Record<string, { pct: number; months: number[] }> = {}
          heatmapStates.forEach(st => {
            const full = st === 'UP' ? 'Uttar Pradesh' : st
            const d = getStateBills(full, 'monthly')
            const mths = d.map((m: any) => Math.round(m.totalLeakage / Math.max(m.totalBill, 1) * 100))
            leakData[full] = { pct: Math.round(mths.reduce((a: number, v: number) => a + v, 0) / mths.length), months: mths }
          })
          const getBg = (p: number) => p <= 0 ? '#f9f9f9' : p < 5 ? '#EAF3DE' : p < 10 ? '#FAC775' : p < 15 ? '#EF9F27' : p < 20 ? '#E24B4A' : '#A32D2D'
          const isDk = (p: number) => p >= 15
          const PATHS: Record<string,string> = {
            'Andhra Pradesh':'M152.5 287.7L150.5 291.1L147.6 292.9L144.4 293.0L141.3 294.5L140.2 298.7L138.3 302.3L135.5 300.1L132.5 301.3L130.4 304.8L129.0 308.8L128.6 313.2L129.5 317.6L129.8 322.1L129.4 326.5L130.5 330.7L131.0 335.2L127.9 336.2L125.3 338.9L121.9 338.2L119.7 341.5L116.4 342.0L113.3 343.3L112.5 347.7L109.2 347.6L111.2 344.0L112.7 340.1L110.6 336.7L108.4 333.4L106.0 330.1L103.1 331.8L100.0 330.7L96.9 331.8L95.4 327.8L98.6 328.0L101.4 325.8L98.6 323.4L95.5 324.6L94.2 320.5L94.3 316.0L96.9 313.1L97.2 308.5L96.3 304.2L96.8 299.7L100.0 299.3L101.3 295.1L98.9 292.1L101.0 288.7L101.0 284.1L100.5 279.6L102.8 276.3L101.7 271.9L102.0 267.4L101.7 262.9L104.0 259.7L106.1 256.2L104.1 252.6L105.8 248.7L109.0 247.2L110.2 243.0L113.2 241.4L116.0 243.8L118.8 246.1L122.0 245.6L125.2 244.6L127.7 247.5L126.6 251.7L127.0 256.4L130.0 258.4L133.2 259.1L135.6 262.4L137.2 266.4L138.7 270.5L141.8 271.3L145.1 271.2L148.0 269.1L151.1 267.9L153.2 264.4L156.5 264.1L159.7 263.1L160.5 258.7L163.4 256.6L164.9 252.6L167.9 254.5L170.7 256.5L173.9 256.8L175.9 253.2L175.7 257.7L173.6 261.1L171.4 264.4L168.5 266.2L165.9 268.8L163.8 272.1L161.4 275.2L158.6 277.2L155.7 279.2L153.2 281.9L153.1 286.4L152.5 287.7Z',
            'Bihar':'M171.9 126.6L174.8 128.7L178.0 130.7L179.8 134.4L182.8 136.2L185.9 137.4L189.1 137.1L192.0 139.4L195.3 139.9L198.2 141.8L201.4 142.3L204.7 143.1L208.0 142.7L211.3 142.3L214.5 141.3L214.7 145.8L212.0 148.2L212.6 152.6L214.1 156.6L211.0 157.6L208.1 159.7L205.8 162.7L203.8 166.3L201.8 169.9L198.6 170.3L195.9 172.6L193.3 169.9L190.7 167.0L188.4 170.3L185.2 171.1L182.3 173.3L179.4 171.2L176.6 173.3L173.9 170.8L170.7 169.5L167.6 171.5L165.2 168.5L163.6 164.6L164.5 160.3L167.4 158.3L170.0 155.6L173.2 154.2L176.3 153.3L174.0 149.9L171.2 147.7L172.5 143.6L169.6 141.5L172.6 139.8L171.2 135.7L170.4 131.2L171.5 127.0L171.9 126.6Z',
            'Chhattisgarh':'M163.5 177.5L165.9 180.6L167.9 184.1L170.9 185.8L171.2 190.3L172.9 194.1L173.1 198.7L170.4 201.1L168.3 204.7L166.0 208.0L165.1 212.3L163.6 216.3L162.3 220.4L159.2 221.4L156.0 222.6L154.2 226.4L152.8 230.4L153.7 234.7L155.5 238.7L152.5 240.4L149.7 238.3L149.8 242.9L150.8 247.2L151.1 251.8L151.0 256.4L148.4 258.9L146.6 263.2L144.2 266.3L142.8 270.3L139.6 271.3L138.1 267.3L135.9 263.7L134.1 260.1L131.1 258.1L130.9 253.6L132.6 249.8L135.8 249.3L136.2 244.8L133.8 241.7L133.8 237.1L134.3 232.5L134.0 228.0L132.7 223.8L134.5 220.2L135.7 216.0L136.9 211.8L137.6 207.3L139.9 204.2L142.2 201.0L145.4 200.4L146.8 196.4L148.7 192.7L151.1 189.9L148.8 186.8L145.6 186.4L145.5 181.9L148.7 181.1L152.0 181.7L155.3 181.6L158.3 179.7L161.5 180.4L163.5 177.5Z',
            'Delhi':'M98.3 106.9L99.3 111.2L96.1 111.2L96.4 106.6L98.3 106.9Z',
            'Goa':'M62.7 301.6L65.7 303.5L67.1 307.5L67.1 312.2L63.9 312.9L63.0 308.7L61.3 304.8L62.7 301.6Z',
            'Gujarat':'M43.8 169.4L46.8 171.5L50.0 172.1L53.0 173.7L55.1 177.2L57.8 179.7L58.7 184.0L60.9 187.4L64.0 188.9L66.7 191.3L68.2 195.4L66.7 199.4L66.1 203.8L65.4 208.2L62.7 211.2L62.3 215.7L65.5 215.5L63.5 219.0L60.8 221.5L63.0 224.8L62.4 229.3L59.1 228.7L57.7 232.7L56.2 236.6L53.6 233.9L50.9 236.7L51.6 232.3L51.8 227.8L50.5 223.7L49.0 219.7L50.5 215.7L48.5 212.2L48.3 207.7L51.1 205.5L47.9 205.8L45.7 209.1L45.7 213.6L44.6 217.8L42.8 221.5L39.9 223.4L37.0 225.4L34.0 226.9L30.9 227.9L29.3 223.9L26.6 226.3L23.9 223.9L21.5 220.9L19.4 217.5L17.2 214.3L14.7 211.4L12.3 208.4L10.2 205.1L13.4 204.8L16.2 202.7L19.4 202.6L22.3 200.7L24.5 197.5L26.3 193.8L23.2 194.6L20.1 195.8L17.1 197.5L14.0 196.4L11.0 194.9L8.2 192.7L6.7 188.8L5.2 184.8L7.5 181.6L8.1 176.6L11.4 175.1L14.7 175.0L17.9 175.9L21.1 176.5L24.0 174.2L27.3 172.7L29.8 175.7L32.6 173.7L32.8 169.2L36.0 169.6L39.3 169.4L42.6 169.3L43.8 169.4Z',
            'Haryana':'M94.3 76.4L97.1 78.6L98.8 82.4L101.9 83.6L100.4 87.6L98.0 90.7L97.1 95.0L97.6 99.4L98.0 104.1L95.6 106.9L94.5 111.2L97.5 112.8L100.7 112.9L101.3 117.4L99.8 121.5L96.6 122.1L95.5 117.7L92.3 117.9L89.1 116.9L87.1 120.5L85.9 116.3L83.5 113.2L80.9 110.3L79.9 105.9L78.9 101.6L75.7 101.0L73.0 98.4L69.8 98.1L70.4 93.6L72.2 89.9L75.2 91.4L77.0 95.4L79.4 92.4L82.6 92.3L86.0 92.9L87.6 89.1L90.9 88.3L92.8 84.6L95.0 81.2L93.9 76.9L94.3 76.4Z',
            'Himachal Pradesh':'M93.9 41.2L95.9 44.8L98.9 46.7L102.1 45.9L105.1 47.4L107.8 50.0L110.7 51.8L111.8 56.0L114.1 59.1L114.3 63.6L115.2 67.9L116.8 71.7L113.6 71.6L110.5 70.2L107.5 71.7L104.6 73.7L103.4 78.0L103.5 82.4L100.3 83.1L97.3 81.3L95.7 77.4L92.9 75.1L91.6 71.0L88.8 68.6L86.0 66.2L84.8 62.0L82.4 59.1L83.1 54.7L84.3 50.5L83.1 46.3L86.2 45.2L88.9 42.6L92.2 42.3L93.9 41.2Z',
            'Jammu and Kashmir':'M105.6 8.5L107.4 12.3L108.6 16.7L110.8 20.1L113.9 22.1L116.7 24.4L114.9 28.1L114.9 32.8L115.4 37.5L118.0 40.3L121.1 41.9L122.0 46.3L123.2 50.5L120.1 51.9L117.3 54.2L114.8 51.2L111.6 51.0L108.5 49.6L105.4 48.1L103.1 45.0L100.0 46.5L96.9 45.1L94.2 42.8L91.0 41.8L88.1 44.0L85.2 46.2L84.1 50.8L81.6 53.9L78.3 54.6L75.4 52.5L72.1 52.5L71.2 48.0L68.1 46.1L65.7 42.9L65.9 38.4L63.7 34.4L66.6 31.4L63.0 29.3L63.1 24.7L63.2 20.2L66.4 18.7L69.7 18.3L72.9 19.7L76.2 20.0L79.6 21.7L82.9 22.0L85.7 19.8L89.0 18.9L92.3 18.5L94.5 15.4L97.7 14.1L100.5 11.6L103.8 8.4L105.6 8.5Z',
            'Jharkhand':'M209.1 159.4L211.1 162.9L211.9 167.3L211.1 171.7L209.5 175.6L207.3 178.8L204.7 181.4L201.4 180.9L198.9 183.7L196.0 185.5L192.8 185.4L190.6 189.0L192.7 192.4L195.7 194.1L197.2 198.1L200.1 200.2L201.4 204.4L198.2 204.4L195.2 202.6L192.4 200.4L191.8 204.8L191.0 209.2L188.0 207.6L184.8 206.9L181.5 207.3L182.2 202.8L179.0 202.2L175.8 202.8L172.5 203.0L173.1 198.5L174.7 194.6L171.8 192.5L170.4 188.5L168.4 185.0L166.5 181.2L164.4 177.8L164.7 173.2L167.6 171.5L170.6 169.5L173.6 170.8L175.6 174.4L178.4 171.9L181.6 172.7L184.7 171.1L187.8 170.2L190.1 166.9L193.2 168.1L195.3 171.4L198.4 170.0L201.6 170.8L203.6 167.3L204.8 163.0L207.7 161.2L209.1 159.4Z',
            'Karnataka':'M99.6 262.0L102.4 264.3L102.9 268.8L101.4 272.7L103.3 276.3L100.7 279.0L101.2 283.4L101.0 287.9L98.7 291.3L101.7 293.0L101.3 297.5L98.2 299.1L97.3 303.4L96.4 307.9L97.3 312.2L94.1 312.1L93.7 316.6L94.5 321.1L96.6 324.7L99.8 324.1L100.0 328.6L96.8 327.6L95.9 331.9L99.0 330.5L101.9 332.4L104.8 330.2L107.9 331.5L110.3 334.4L111.7 338.7L111.5 343.2L109.1 346.6L106.0 345.3L103.5 348.1L102.5 352.5L104.2 356.3L101.6 359.1L98.7 360.9L95.4 361.2L92.7 363.9L89.6 362.7L86.9 360.0L83.7 358.6L81.2 355.7L79.1 352.4L76.9 349.1L74.3 346.4L72.4 342.8L71.7 338.5L71.2 334.0L70.3 329.7L69.1 325.6L68.0 321.3L66.7 317.2L67.1 312.8L67.4 308.3L66.8 303.9L68.3 299.9L69.3 295.6L67.7 291.7L70.6 289.8L73.1 287.0L75.6 284.2L78.9 283.7L81.9 282.3L80.8 277.7L84.0 277.4L87.1 278.9L89.2 275.6L91.3 272.0L94.2 270.1L95.5 265.9L98.3 263.6L99.6 262.0Z',
            'Kerala':'M74.6 346.2L76.9 349.4L79.1 352.7L81.4 355.8L83.9 358.8L87.1 360.1L89.7 362.9L90.4 367.3L93.0 369.8L92.5 374.3L94.5 377.8L94.3 382.4L97.6 382.8L98.5 387.2L98.2 391.7L100.2 395.3L98.8 399.4L97.9 403.7L98.2 408.2L97.6 412.6L94.9 410.2L92.9 406.8L91.0 403.2L89.7 399.0L88.6 394.8L88.2 390.4L89.1 394.7L89.5 390.2L88.0 386.3L86.4 382.3L85.1 378.3L84.1 374.0L83.1 369.8L81.4 365.9L80.0 361.9L78.0 358.4L76.1 354.8L74.5 350.9L73.3 346.8L74.6 346.2Z',
            'Madhya Pradesh':'M110.6 136.2L113.6 137.7L116.8 138.8L118.6 142.5L117.4 146.7L116.1 150.8L114.7 155.0L111.5 155.8L110.5 160.1L109.8 164.5L109.5 169.0L110.5 173.3L113.6 174.9L116.8 173.9L116.1 169.4L114.2 165.8L112.7 161.1L114.9 157.8L117.1 161.1L120.3 162.3L123.5 161.7L126.6 160.4L129.5 158.7L132.4 161.0L135.2 163.1L138.2 164.9L141.2 163.6L144.2 161.9L147.1 163.9L149.7 166.6L152.4 169.0L155.8 168.8L156.9 173.2L156.9 177.7L155.2 181.6L151.8 181.8L148.6 181.0L145.5 180.3L145.1 184.7L148.2 186.0L150.9 188.6L149.5 192.7L147.0 195.7L145.5 199.8L142.8 202.2L139.8 203.9L138.5 208.0L136.8 211.8L135.7 216.1L132.8 217.8L130.6 214.4L127.4 215.4L124.2 215.4L121.2 213.6L117.9 214.7L115.0 216.6L111.7 216.2L108.5 215.5L105.8 218.0L102.6 217.9L101.8 213.5L98.6 213.0L95.1 214.6L92.5 218.2L90.3 221.5L87.2 222.5L85.8 218.4L82.5 217.9L79.3 217.9L76.1 217.0L73.5 214.3L70.3 213.8L69.2 209.6L66.0 209.9L65.2 205.5L64.4 201.1L67.3 199.3L69.0 195.4L70.7 191.5L70.8 187.0L73.6 184.8L73.8 180.3L73.4 175.8L72.2 171.7L72.5 167.2L75.6 165.7L78.4 163.4L76.7 167.4L79.8 168.6L83.0 167.6L84.4 171.6L82.9 175.7L80.7 179.0L83.8 180.6L86.3 177.7L89.0 175.2L92.2 174.9L95.4 176.0L94.4 171.7L94.1 167.1L95.7 163.2L98.9 162.4L99.8 158.0L96.7 159.2L93.4 159.3L91.0 156.3L91.2 151.8L94.0 149.6L96.4 146.4L99.3 144.5L102.2 142.4L104.9 140.0L107.9 138.0L110.6 136.2Z',
            'Maharashtra':'M68.6 208.4L69.5 212.7L72.4 214.6L75.5 215.8L78.4 217.9L81.7 218.0L84.9 217.8L87.2 221.0L90.3 221.5L93.0 217.8L95.8 213.8L99.0 212.9L102.1 214.4L103.7 218.3L106.9 217.5L109.5 214.9L112.6 216.0L116.0 216.5L118.8 214.2L122.0 213.6L125.1 214.7L128.3 215.4L131.6 215.6L134.0 218.6L132.7 222.7L133.8 227.0L134.5 231.4L132.5 234.9L133.7 239.0L135.1 243.2L137.5 246.1L134.8 248.9L131.9 251.0L131.5 255.5L128.8 258.0L127.3 254.0L127.4 249.3L126.1 245.2L122.8 245.5L119.6 245.9L116.8 243.7L113.6 241.6L110.4 240.4L110.0 244.9L108.7 249.0L105.5 248.8L104.1 252.8L104.6 257.4L102.3 260.6L100.2 264.0L97.1 265.5L95.1 269.1L92.8 272.5L89.8 274.2L89.4 278.7L86.2 278.5L83.0 277.7L81.9 282.0L78.9 283.7L75.7 284.7L72.6 287.1L70.1 290.1L66.9 290.3L68.5 294.3L68.7 298.8L66.3 301.8L63.1 302.1L60.1 300.7L58.3 296.9L57.2 292.7L56.9 288.2L56.5 283.7L55.7 279.4L54.8 275.1L54.2 270.7L53.0 266.5L52.3 262.1L51.9 257.6L53.6 253.7L51.2 250.8L50.9 246.3L50.0 242.0L50.2 237.5L53.4 236.8L56.5 235.7L58.1 231.7L61.2 230.1L63.4 226.7L61.3 223.1L63.3 219.5L65.9 216.8L62.7 216.3L62.3 211.8L65.2 209.6L68.3 208.4L68.6 208.4Z',
            'Orissa':'M192.8 200.9L195.6 203.4L198.7 204.8L201.7 207.5L204.7 209.5L207.2 212.3L205.0 215.6L202.3 217.9L200.9 221.9L202.3 226.0L200.2 229.3L200.1 233.8L197.3 236.0L194.5 238.2L192.0 241.1L189.0 242.3L186.0 244.1L183.3 246.5L180.8 249.2L178.2 251.8L175.2 253.4L173.0 256.7L169.7 256.3L167.3 252.9L164.1 253.6L162.4 257.4L160.6 261.2L157.6 262.9L154.7 260.9L152.9 264.7L150.5 267.7L147.4 269.3L144.3 271.3L144.1 266.5L146.5 263.3L148.8 260.1L151.0 256.8L151.6 252.4L151.2 247.9L149.8 243.9L147.9 240.2L150.9 238.6L153.9 240.1L153.7 235.6L153.4 231.2L152.9 226.4L155.7 223.8L158.4 221.3L161.6 221.9L163.6 218.4L164.5 214.1L166.3 210.3L166.7 205.7L169.6 203.7L173.1 203.2L176.3 202.5L179.5 202.4L182.5 204.1L183.6 208.4L186.7 207.2L190.0 207.3L192.4 204.3L192.8 200.9Z',
            'Punjab':'M83.9 52.4L81.7 55.8L83.1 59.8L84.9 63.6L86.6 67.5L89.6 69.1L91.7 72.5L93.5 76.4L95.0 80.5L92.8 83.8L91.9 88.1L88.7 87.9L87.3 92.0L84.2 93.2L80.7 93.3L77.7 95.2L75.6 91.8L72.7 89.7L69.5 90.3L66.3 90.1L62.8 89.9L63.5 85.5L64.9 81.4L67.0 77.9L69.4 74.9L69.5 70.4L70.4 66.1L70.4 61.5L73.1 59.3L76.3 58.5L78.3 54.8L81.5 53.9L84.0 51.1L83.9 52.4Z',
            'Rajasthan':'M62.8 89.8L66.3 90.1L69.5 90.3L70.2 94.8L70.4 99.5L73.5 98.7L76.6 100.4L79.3 103.4L80.2 107.8L82.0 111.9L84.9 114.3L85.4 118.8L88.7 119.0L92.0 119.2L94.4 115.9L95.1 120.4L98.2 122.1L99.6 126.2L102.0 129.2L102.3 133.8L100.6 137.6L103.6 136.0L106.8 135.7L105.5 139.7L102.7 141.9L99.7 143.8L97.0 146.3L94.2 148.7L91.4 151.5L90.9 156.0L93.4 159.0L96.6 159.3L99.7 157.8L100.2 162.2L97.0 163.1L94.7 166.5L96.6 170.1L94.4 173.3L91.6 175.7L88.3 175.8L85.6 178.2L83.0 181.0L79.9 180.3L82.9 178.8L83.2 174.3L84.0 169.9L80.9 168.2L77.5 168.1L78.4 163.7L75.5 165.7L73.5 169.2L72.4 173.4L74.2 177.3L73.7 181.8L72.3 185.8L69.8 188.8L67.9 192.5L65.3 189.8L62.3 187.5L59.9 184.2L57.3 181.5L55.7 177.6L54.6 173.4L51.4 173.6L48.5 171.4L45.3 170.3L42.1 169.5L38.9 169.4L35.7 169.3L32.6 167.7L31.1 163.4L29.4 159.6L28.6 155.3L25.3 154.1L22.9 151.1L23.0 146.3L23.3 141.7L20.0 140.5L17.1 138.6L16.1 134.0L18.1 130.1L20.5 127.1L22.5 122.8L24.9 119.7L28.3 120.2L30.3 123.7L33.5 122.3L36.8 121.3L40.1 120.7L42.2 117.0L44.6 114.0L45.9 109.4L48.5 106.7L51.7 104.6L53.9 101.3L55.7 97.3L56.9 93.1L59.0 89.6L62.3 87.9L62.8 89.8Z',
            'Tamil Nadu':'M128.8 335.2L131.6 337.4L131.1 341.9L130.5 346.2L129.7 350.6L127.8 354.2L126.4 358.2L125.6 362.6L126.1 367.0L126.5 371.5L126.4 376.1L126.5 380.6L123.9 383.1L120.7 383.7L119.6 387.9L117.7 391.5L116.2 395.6L118.7 398.4L115.5 399.0L112.6 400.7L109.7 402.5L108.4 406.6L107.6 411.0L105.1 413.8L102.2 415.6L99.0 415.2L98.2 410.8L97.9 406.3L98.0 401.8L99.4 397.5L97.6 393.7L98.3 389.2L98.9 384.8L95.7 384.7L94.1 380.6L94.9 376.3L92.4 373.5L90.4 369.9L88.6 366.1L90.7 362.5L93.8 363.9L96.2 361.0L99.5 361.6L102.2 359.0L101.0 354.8L102.7 350.8L104.4 346.9L107.5 345.7L110.1 348.5L113.0 346.1L114.7 342.4L117.9 342.6L121.0 341.2L123.8 339.1L127.0 338.1L128.8 335.2Z',
            'Telangana':'M144.3 228.2L145.6 232.4L147.5 236.2L148.1 240.7L146.6 244.6L148.9 247.7L151.9 249.6L152.4 245.1L153.8 241.2L157.0 239.5L159.6 242.5L162.6 244.0L165.8 243.7L167.8 240.2L171.0 238.5L173.0 235.1L173.7 230.7L172.1 226.9L169.1 225.7L166.1 224.1L162.9 222.9L159.6 223.8L156.4 222.8L153.2 221.6L150.0 220.4L147.0 221.7L144.0 223.7L144.3 228.2Z',
            'Uttar Pradesh':'M102.2 83.4L105.1 85.4L103.9 89.6L104.5 94.0L107.5 95.4L110.2 92.5L112.7 95.6L115.7 97.5L116.3 101.9L119.1 104.1L121.8 106.6L125.1 106.1L127.9 108.6L131.1 108.7L134.3 109.2L137.0 111.8L140.3 113.8L142.3 117.2L145.3 119.2L148.1 121.4L151.3 121.5L154.0 124.0L157.2 124.6L160.0 127.4L163.1 129.2L166.5 127.2L169.3 129.5L170.9 133.6L173.4 136.6L171.5 140.3L172.5 144.6L172.4 149.1L175.5 150.8L173.3 154.2L170.2 155.5L167.6 158.2L164.7 160.2L163.6 164.4L165.1 168.5L164.3 172.8L163.7 177.3L161.4 180.6L158.1 179.5L157.3 175.2L156.9 170.7L154.1 168.6L151.1 167.0L148.3 164.5L145.2 163.2L142.2 161.5L140.3 165.1L137.0 165.0L134.6 162.0L131.6 163.8L131.3 159.1L128.1 159.2L125.7 162.3L122.6 162.8L120.8 159.0L118.7 162.4L116.5 159.0L113.5 157.5L113.0 162.2L114.7 166.1L116.3 170.0L116.3 174.5L113.1 174.3L110.1 172.9L109.3 168.5L110.2 164.1L110.3 159.6L111.7 155.5L115.0 154.9L116.1 150.7L117.1 146.3L118.0 141.9L115.8 138.5L112.6 137.7L109.4 136.9L106.3 135.7L103.1 136.3L102.5 131.9L100.6 128.2L99.6 123.9L101.7 120.2L101.8 115.6L99.9 112.0L98.4 107.8L97.7 103.4L97.2 98.8L97.3 94.3L98.4 90.1L100.8 86.9L102.2 83.4Z',
            'Uttaranchal':'M119.4 69.3L121.4 72.8L124.2 75.1L127.3 76.2L130.2 78.2L132.3 81.6L135.5 83.3L138.3 85.4L136.2 88.7L133.8 91.8L132.2 95.7L131.3 100.1L129.4 103.9L128.2 108.2L125.3 106.0L122.1 106.5L119.3 104.0L116.3 102.2L116.3 97.7L113.3 96.2L111.1 92.9L108.1 94.6L104.9 94.4L103.8 90.2L105.6 86.4L103.1 83.7L103.9 79.3L104.5 74.9L107.0 71.9L110.0 70.3L113.2 71.2L116.2 73.0L117.4 68.6L119.4 69.3Z',
            'West Bengal':'M214.7 132.4L217.9 133.0L221.1 132.2L223.5 135.2L226.5 136.9L229.7 137.0L232.9 138.5L233.0 143.0L230.9 146.4L228.3 149.0L225.6 146.6L223.9 142.8L220.8 144.2L218.5 141.1L217.1 145.1L215.3 148.8L216.7 152.9L218.9 156.1L222.1 156.8L223.6 160.8L220.3 161.0L217.9 164.0L214.8 165.3L213.9 169.6L216.3 172.5L219.2 174.5L221.2 178.0L219.6 182.0L220.8 186.2L221.6 190.6L222.9 194.7L223.3 199.1L222.7 203.5L220.2 206.3L219.2 210.6L216.1 211.8L215.7 207.3L213.0 204.9L213.7 209.2L211.6 212.7L208.6 214.3L205.9 211.9L202.7 210.4L200.6 207.0L200.2 202.5L198.5 198.7L196.6 195.1L193.6 193.3L190.7 191.5L190.5 187.0L193.5 185.4L196.7 184.5L199.9 183.6L202.6 181.2L205.8 180.6L207.9 177.3L210.5 174.6L211.9 170.6L212.5 166.2L210.9 162.2L210.9 157.7L214.0 156.9L212.7 152.8L211.6 148.5L214.3 146.1L215.7 142.0L215.3 137.5L213.7 133.6L214.7 132.4Z',
          }
          const LBLS: Record<string,[number,number]> = {
            'Maharashtra':[110,220],'Delhi':[97,112],'Tamil Nadu':[108,340],
            'Karnataka':[100,285],'Gujarat':[48,200],'Uttar Pradesh':[155,130],
            'West Bengal':[222,165],'Rajasthan':[78,145],'Jammu and Kashmir':[92,35],
          }
          const ABBR: Record<string,string> = {
            'Maharashtra':'MH','Delhi':'DL','Tamil Nadu':'TN','Karnataka':'KA',
            'Gujarat':'GJ','Uttar Pradesh':'UP','West Bengal':'WB','Rajasthan':'RJ',
            'Jammu and Kashmir':'J&K',
          }
          const [hov, setHov] = React.useState<string|null>(null)
          const [sel, setSel] = React.useState<string|null>(null)
          return (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg viewBox="0 0 320 440" width="300" style={{ display: 'block' }}>
                  {Object.entries(PATHS).map(([name, d]) => {
                    const info = leakData[name]
                    const fill = info ? getBg(info.pct) : '#E8E6E0'
                    const isHov = hov === name
                    return (
                      <path key={name} d={d} fill={fill}
                        stroke={isHov ? '#192744' : 'rgba(255,255,255,0.8)'}
                        strokeWidth={isHov ? 1.8 : 0.7}
                        strokeLinejoin="round"
                        style={{ cursor: info ? 'pointer' : 'default', opacity: isHov ? 0.82 : 1, transition: 'opacity .12s' }}
                        onMouseEnter={() => info && setHov(name)}
                        onMouseLeave={() => setHov(null)}
                        onClick={() => info && setSel(sel === name ? null : name)}
                      />
                    )
                  })}
                  <path d={Object.values(PATHS).join(' ')} fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinejoin="round" opacity="0.25" style={{ pointerEvents: 'none' }} />
                  {Object.entries(LBLS).map(([name, [x, y]]) => {
                    const info = leakData[name]
                    return (
                      <text key={name} x={x} y={y} textAnchor="middle"
                        fontSize={name === 'Jammu and Kashmir' ? 7 : 8}
                        fontWeight="700" fontFamily="sans-serif"
                        style={{ pointerEvents: 'none' }}
                        fill={info ? (isDk(info.pct) ? '#fff' : '#192744') : '#aaa'}>
                        {ABBR[name] || name.substring(0,2)}
                      </text>
                    )
                  })}
                  {hov && leakData[hov] && LBLS[hov] && (() => {
                    const [tx, ty] = LBLS[hov]
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={tx-42} y={ty+6} width="84" height="20" rx="4" fill="#192744" opacity="0.9" />
                        <text x={tx} y={ty+19} textAnchor="middle" fontSize="10" fill="#fff" fontFamily="sans-serif">{hov.split(' ')[0]} · {leakData[hov].pct}%</text>
                      </g>
                    )
                  })()}
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {!sel ? (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Portfolio states</div>
                    {heatmapStates.map(st => {
                      const full = st === 'UP' ? 'Uttar Pradesh' : st
                      const info = leakData[full]
                      if (!info) return null
                      return (
                        <div key={st}
                          onClick={() => setSel(full)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '3px', transition: 'background .12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f5f6fa'; setHov(full) }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; setHov(null) }}>
                          <div style={{ width: '30px', height: '28px', borderRadius: '5px', background: getBg(info.pct), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: isDk(info.pct) ? '#fff' : '#192744', flexShrink: 0 }}>
                            {info.pct}%
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744', marginBottom: '3px' }}>{full}</div>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {info.months.map((p, mi) => (
                                <div key={mi} title={MONTHS[mi]+': '+p+'%'} style={{ flex: 1, height: '4px', borderRadius: '1px', background: getBg(p) }} />
                              ))}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#858ea2', flexShrink: 0 }}>→</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (() => {
                  const info = leakData[sel]
                  const BRANCH_DATA: Record<string, [string, number][]> = {
                    'Maharashtra':[['Mumbai North',1820],['Mumbai South',1240],['Pune East',980],['Nagpur',820],['Nashik',780],['Aurangabad',637]],
                    'Delhi':[['Delhi South',1820],['Delhi North',1340],['Delhi East',980],['Delhi West',820],['Rohini',837]],
                    'Tamil Nadu':[['Chennai Central',1920],['Coimbatore',1140],['Madurai',880],['Trichy',820],['Salem',801]],
                    'Karnataka':[['Bangalore East',1820],['Bangalore West',1340],['Mysore',980],['Hubli',820],['Mangalore',452]],
                    'Gujarat':[['Ahmedabad East',1720],['Surat North',1240],['Vadodara',780],['Rajkot',820],['Gandhinagar',612]],
                    'Uttar Pradesh':[['Lucknow East',1420],['Kanpur',1140],['Agra',880],['Varanasi',820],['Meerut',634]],
                    'West Bengal':[['Kolkata South',1620],['Kolkata North',1240],['Howrah',780],['Durgapur',620],['Siliguri',401]],
                    'Rajasthan':[['Jaipur North',1420],['Jodhpur',1040],['Udaipur',680],['Kota',720],['Ajmer',639]],
                  }
                  const branches = BRANCH_DATA[sel] || []
                  const maxB = Math.max(...branches.map(b => b[1]))
                  const totalSpend = branches.reduce((a, b) => a + b[1], 0)
                  const cas = { 'Maharashtra':24,'Delhi':21,'Tamil Nadu':21,'Karnataka':21,'Gujarat':20,'Uttar Pradesh':20,'West Bengal':17,'Rajasthan':16 } as Record<string,number>
                  return (
                    <div suppressHydrationWarning>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <button onClick={() => setSel(null)} style={{ fontSize: '11px', color: '#2500D7', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ← All states
                          </button>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#192744' }}>{sel}</div>
                          <div style={{ fontSize: '11px', color: '#858ea2' }}>{cas[sel] || 0} CAs · Apr 2024 – Mar 2025</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#534AB7' }}>₹{totalSpend.toLocaleString()}L</div>
                          <div style={{ fontSize: '11px', color: '#858ea2' }}>total bill</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ background: '#f5f6fa', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '2px' }}>Avg leakage % of bill</div>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: info ? getBg(info.pct) === '#EAF3DE' ? '#27500A' : '#A32D2D' : '#192744' }}>{info ? info.pct : 0}%</div>
                        </div>
                        <div style={{ background: '#f5f6fa', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '2px' }}>YoY change</div>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B6D11' }}>+8%</div>
                        </div>
                      </div>
                      {info && (
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontSize: '11px', color: '#858ea2' }}>Leakage % per month</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#858ea2' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EAF3DE', display: 'inline-block' }} />&lt;5%
                              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF9F27', display: 'inline-block' }} />10–15%
                              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#E24B4A', display: 'inline-block' }} />15%+
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '32px' }}>
                            {info.months.map((p, mi) => (
                              <div key={mi} title={MONTHS[mi]+': '+p+'%'} style={{ flex: 1, background: getBg(p), borderRadius: '2px', height: Math.max(4, Math.round(p / 20 * 32))+'px', transition: 'height .2s' }} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#858ea2', marginTop: '3px' }}>
                            {['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map((m, i) => (
                              <span key={i}>{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Branches</div>
                      {branches.map(([br, amt]) => (
                        <div key={br} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ width: '110px', fontSize: '12px', color: '#192744', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{br}</div>
                          <div style={{ flex: 1, height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: Math.round(amt / maxB * 100)+'%', height: '100%', background: '#534AB7', borderRadius: '3px' }} />
                          </div>
                          <div style={{ width: '56px', fontSize: '12px', fontWeight: 500, color: '#192744', textAlign: 'right' }}>₹{amt.toLocaleString()}L</div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleHeatmapCell(sel, 'Apr', 0)}
                        style={{ marginTop: '14px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #f3f4f6', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#2500D7', cursor: 'pointer' }}>
                        Deep dive into {sel} →
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })()}
      </div>

    </div>
  );
}
