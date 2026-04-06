'use client';

import React, { useState, useMemo } from 'react';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';

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

const AnomalyCard = ({ color, title, desc, tags, amount, amountLabel, cta, section, onCTA }: any) => {
  const iconBgs: Record<string, string> = { red: '#FCEBEB', amber: '#FAEEDA', blue: '#E6F1FB' };
  const iconChars: Record<string, string> = { red: '⚠', amber: '!', blue: 'i' };
  const tagColors: Record<string, { bg: string; color: string }> = {
    red: { bg: '#FCEBEB', color: '#A32D2D' },
    amber: { bg: '#FAEEDA', color: '#633806' },
    blue: { bg: '#E6F1FB', color: '#0C447C' },
    green: { bg: '#EAF3DE', color: '#27500A' },
  };

  return (
    <div onClick={() => onCTA(section)} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2500D7'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.15)'; }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconBgs[color], fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{iconChars[color]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744', marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: 1.5, marginBottom: '8px' }}>{desc}</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tags.map((tag: any, i: number) => (
            <div key={i} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: 500, ...tagColors[tag.color] }}>{tag.label}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#A32D2D' }}>{amount}</div>
        <div style={{ fontSize: '11px', color: '#9b9b96' }}>{amountLabel}</div>
        <div style={{ fontSize: '12px', color: '#2500D7', fontWeight: 500, padding: '6px 12px', borderRadius: '6px', border: '0.5px solid #EBEAFF', background: '#EBEAFF', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }} onMouseEnter={(e) => { (e.target as HTMLDivElement).style.background = '#dddcff'; }} onMouseLeave={(e) => { (e.target as HTMLDivElement).style.background = '#EBEAFF'; }}>{cta}</div>
      </div>
    </div>
  );
};

export default function OverviewSection({ appState, onStateChange, onBranchChange, onCAChange, onSectionChange, onHeatmapCellClick }: OverviewSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<'impact' | 'frequency' | 'state'>('impact');

  const pinnedEntities = [
    { name: 'Maharashtra', type: 'state' },
    { name: 'Mumbai North', type: 'branch' },
    { name: 'MH-MN-0101', type: 'ca' },
    { name: 'DL-DS-4202', type: 'ca' },
  ];

  const recentEntities = [
    { name: 'Delhi South', type: 'branch' },
    { name: 'Gujarat', type: 'state' },
    { name: 'KA-BE-1103', type: 'ca' },
  ];

  const summaryCards = [
    { label: 'Total portfolio', value: '₹48.3L', sub: '8 states · 62 branches · 187 CAs', subColor: '#858ea2' },
    { label: 'Total leakages', value: '₹9.2L', sub: '19% of total bill', subColor: '#A32D2D' },
    { label: 'CAs over contracted', value: '43 / 187', sub: '23% of all CAs', subColor: '#854F0B' },
    { label: 'Potential savings', value: '₹6.1L', sub: 'recoverable annually', subColor: '#3B6D11' },
  ];

  const anomalies = [
    {
      color: 'red',
      title: '43 CAs exceeded contracted demand every single month',
      desc: 'Across Maharashtra, Delhi and Karnataka — these CAs have structurally under-sized contracts. Raising contracted demand to P90 MDI + 15% buffer would eliminate excess charges.',
      tags: [{ label: 'Excess demand', color: 'red' }, { label: '12/12 months', color: 'red' }, { label: 'Maharashtra · Delhi · Karnataka', color: 'amber' }],
      amount: '₹4.8L',
      amountLabel: 'avoidable / yr',
      cta: 'View CAs →',
      section: 'excess-demand',
    },
    {
      color: 'amber',
      title: 'Power factor below 0.90 in 28 branches for 6+ months',
      desc: 'PF penalty triggered consistently in Uttar Pradesh and Rajasthan clusters. Installing capacitor banks at 6 high-impact branches would recover most of this charge.',
      tags: [{ label: 'PF penalty', color: 'amber' }, { label: '6+ months', color: 'amber' }, { label: '28 branches', color: 'blue' }],
      amount: '₹2.1L',
      amountLabel: 'avoidable / yr',
      cta: 'View branches →',
      section: 'leakages',
    },
    {
      color: 'red',
      title: 'Late payment surcharge recurring in 19 CAs — 3+ consecutive months',
      desc: 'Concentrated in West Bengal and Gujarat. Payment scheduling alignment would eliminate this entirely — no tariff or infrastructure changes needed.',
      tags: [{ label: 'Late payment', color: 'red' }, { label: '3+ consecutive months', color: 'amber' }, { label: 'West Bengal · Gujarat', color: 'blue' }],
      amount: '₹1.3L',
      amountLabel: 'avoidable / yr',
      cta: 'View CAs →',
      section: 'leakages',
    },
    {
      color: 'blue',
      title: '12 CAs under-utilising contracted demand below 70% — revision opportunity',
      desc: 'Tamil Nadu and Rajasthan clusters are consistently drawing well below contracted level. Reducing contracted demand for these CAs would lower fixed charges.',
      tags: [{ label: 'Under-utilised', color: 'blue' }, { label: 'Savings opportunity', color: 'green' }, { label: 'Tamil Nadu · Rajasthan', color: 'blue' }],
      amount: '₹0.8L',
      amountLabel: 'saveable / yr',
      cta: 'View CAs →',
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
      {/* Topbar */}
      <div style={{ background: '#fff', border: '0.5px solid #F3F4F6', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: '480px' }}>
          <SearchIcon />
          <input
            placeholder="Search state, branch, or CA number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            style={{ width: '100%', height: '38px', border: '0.5px solid rgba(0,0,0,0.30)', borderRadius: '8px', padding: '0 12px 0 36px', fontSize: '13px', background: '#f5f5f4', outline: 'none' }}
          />
          {searchOpen && (
            <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>States</div>
              {filteredStates.map(s => (
                <SearchResult key={s.name} icon={s.initials} iconBg="#EBEAFF" iconColor="#2500D7" name={s.name} meta={`${s.branches} branches · ${s.cas} CAs`} badge={s.badge} badgeType={s.badgeType} onClick={() => handleSelectEntity(s.name, 'state')} />
              ))}
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>Branches</div>
              {filteredBranches.map(b => (
                <SearchResult key={b.name} icon={b.initials} iconBg="#E6F1FB" iconColor="#0C447C" name={b.name} meta={`${b.state} · ${b.cas} CAs`} badge={b.badge} badgeType={b.badgeType} onClick={() => handleSelectEntity(b.name, 'branch')} />
              ))}
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>CA numbers</div>
              {filteredCAs.map(c => (
                <SearchResult key={c.id} icon="CA" iconBg="#EAF3DE" iconColor="#27500A" name={c.id} meta={`${c.branch} · ${c.category}`} badge={c.badge} badgeType={c.badgeType} onClick={() => handleSelectEntity(c.id, 'ca')} />
              ))}
            </div>
          )}
        </div>
        <div style={{ height: '36px', background: '#fff', border: '1px solid #F3F4F6', borderRadius: '8px', paddingTop: '0', paddingBottom: '0', paddingLeft: '14px', paddingRight: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <span style={{ color: '#192744' }}>Apr 2024 – Mar 2025</span>
          <span style={{ width: '1px', height: '16px', background: '#F3F4F6' }}></span>
          <span style={{ color: '#2500D7', fontWeight: 500, cursor: 'pointer' }}>1Y ▾</span>
        </div>
        <button style={{ height: '36px', background: '#2500D7', border: 'none', borderRadius: '8px', paddingTop: '0', paddingBottom: '0', paddingLeft: '20px', paddingRight: '20px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>Apply</button>
      </div>

      {/* Pinned + Recent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#9b9b96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pinned</span>
        {pinnedEntities.map(e => (
          <PinChip key={e.name} name={e.name} type={e.type} dashed={false} onClick={() => handleSelectEntity(e.name, e.type)} />
        ))}
        <span style={{ fontSize: '11px', color: '#9b9b96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '8px' }}>Recent</span>
        {recentEntities.map(e => (
          <PinChip key={e.name} name={e.name} type={e.type} dashed={true} onClick={() => handleSelectEntity(e.name, e.type)} />
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {summaryCards.map((card, i) => (
          <div key={i} style={{ background: '#fff', borderTop: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', borderLeft: '4px solid #2500d7', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '11px', color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 500, color: '#192744', marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '11px', color: card.subColor }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Anomalies */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744' }}>Surfaced anomalies</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Ranked by avoidable cost · click any card to drill in</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SortPill label="By impact" active={activeSort === 'impact'} onClick={() => setActiveSort('impact')} />
            <SortPill label="By frequency" active={activeSort === 'frequency'} onClick={() => setActiveSort('frequency')} />
            <SortPill label="By state" active={activeSort === 'state'} onClick={() => setActiveSort('state')} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {anomalies.map((a, i) => (
            <AnomalyCard key={i} {...a} onCTA={handleAnomalyCTA} />
          ))}
        </div>
      </div>

      {/* Approval queue */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Approval queue
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px' }}>
          {approvalQueueItems.map(item => (
            <div
              key={item.key}
              onClick={() => onSectionChange('billers')}
              style={{
                background: '#fff',
                border: `0.5px solid ${item.borderColor}`,
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'border-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#2500D7'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = item.borderColor}
            >
              {/* Icon dot */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: item.iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {item.iconPath}
                </svg>
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744' }}>{item.title}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.countColor, marginLeft: '8px', flexShrink: 0 }}>{item.count}</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: item.tagColor, background: item.tagBg, borderRadius: '4px', padding: '2px 7px', display: 'inline-block', marginBottom: '4px' }}>
                  {item.tag}
                </div>
                <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
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
