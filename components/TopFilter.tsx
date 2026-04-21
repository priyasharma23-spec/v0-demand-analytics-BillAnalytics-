'use client';

import React, { useState, useMemo } from 'react';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';

interface Entity {
  name: string;
  type: 'state' | 'branch' | 'ca';
}

interface TopFilterProps {
  onSearch?: (query: string) => void;
  onDateRangeChange?: (range: string) => void;
  onApply?: (filters: { stateF: string; branchF: string; caF: string; dateRange: string }) => void;
  onSelectEntity?: (name: string, type: string) => void;
}

const MAX_PINS = 10;
const DOT_COLOR: Record<string, string> = {
  state: '#2500D7', branch: '#185FA5', ca: '#3B6D11',
};

export default function TopFilter({ onSearch, onDateRangeChange, onApply, onSelectEntity }: TopFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [dateRange, setDateRange]     = useState('1Y');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate]     = useState('');
  const [selectedState,  setSelectedState]  = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedCA,     setSelectedCA]     = useState('all')

  const [pinnedEntities, setPinnedEntities] = useState<Entity[]>([
    { name: 'Maharashtra',  type: 'state'  },
    { name: 'Mumbai North', type: 'branch' },
    { name: 'MH-MN-0101',  type: 'ca'     },
    { name: 'DL-DS-4202',  type: 'ca'     },
  ]);

  const [recentEntities] = useState<Entity[]>([
    { name: 'Delhi South',    type: 'branch' },
    { name: 'Gujarat',        type: 'state'  },
    { name: 'KA-BE-1103',    type: 'ca'     },
    { name: 'Tamil Nadu',     type: 'state'  },
    { name: 'Bangalore East', type: 'branch' },
    { name: 'UP-LE-6101',    type: 'ca'     },
  ]);

  const q = searchQuery.toLowerCase();

  const filteredStates = useMemo(() =>
    STATES.filter(s => s.toLowerCase().includes(q)).slice(0, 4).map(s => ({
      name: s, initials: s.substring(0, 2).toUpperCase(),
      branches: (BRANCHES[s] ?? []).length,
      cas: (BRANCHES[s] ?? []).reduce((sum, br) => sum + (CAS[br]?.length ?? 0), 0),
    })), [q]);

  const filteredBranches = useMemo(() =>
    Object.keys(BRANCHES).filter(b => b.toLowerCase().includes(q)).slice(0, 4).map(b => ({
      name: b, initials: b.substring(0, 2).toUpperCase(),
      state: STATES.find(s => (BRANCHES[s] ?? []).includes(b)) ?? '',
      cas: CAS[b]?.length ?? 0,
    })), [q]);

  const filteredCAs = useMemo(() =>
    Object.values(CAS).flat().filter(c => c.toLowerCase().includes(q)).slice(0, 5).map(c => ({
      id: c, branch: Object.keys(CAS).find(b => CAS[b]?.includes(c)) ?? 'Unknown',
    })), [q]);

  const handleUnpin = (name: string) => setPinnedEntities(prev => prev.filter(e => e.name !== name));
  const handlePin = (entity: Entity) => {
    if (pinnedEntities.length >= MAX_PINS) return;
    if (pinnedEntities.find(e => e.name === entity.name)) return;
    setPinnedEntities(prev => [...prev, entity]);
  };
  const visibleRecent = recentEntities
    .filter(r => !pinnedEntities.find(p => p.name === r.name))
    .slice(0, MAX_PINS - pinnedEntities.length);

  const handleSelectEntity = (name: string, type: string) => {
    setSearchQuery('')
    setSearchOpen(false)
    if (type === 'state')  { setSelectedState(name); setSelectedBranch('all'); setSelectedCA('all') }
    if (type === 'branch') { setSelectedBranch(name); setSelectedCA('all') }
    if (type === 'ca')     { setSelectedCA(name) }
    onSelectEntity?.(name, type)
  };

  return (
    <div style={{ background: '#fff', padding: '12px 24px 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>

      {/* Row 1 — Search + date + apply */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>

        {/* Search */}
        <div style={{ flex: 1, position: 'relative', maxWidth: '520px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="5.5" cy="5.5" r="4.5" stroke="#9b9b96" strokeWidth="1.2" fill="none"/>
            <line x1="9" y1="9" x2="12.5" y2="12.5" stroke="#9b9b96" strokeWidth="1.2"/>
          </svg>
          <input
            type="text" placeholder="Search state, branch, or CA number…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            style={{ width: '100%', height: '38px', border: '0.5px solid rgba(0,0,0,0.20)', borderRadius: '8px', padding: '0 12px 0 36px', fontSize: '13px', background: '#f9f9f9', outline: 'none', color: '#192744', fontFamily: 'inherit' }}
          />
          {searchOpen && (
            <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', zIndex: 200, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              {filteredStates.length > 0 && <>
                <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>States</div>
                {filteredStates.map(s => <SearchRow key={s.name} icon={s.initials} iconBg="#EBEAFF" iconColor="#2500D7" name={s.name} meta={`${s.branches} branches · ${s.cas} CAs`} onClick={() => handleSelectEntity(s.name, 'state')} />)}
              </>}
              {filteredBranches.length > 0 && <>
                <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>Branches</div>
                {filteredBranches.map(b => <SearchRow key={b.name} icon={b.initials} iconBg="#E6F1FB" iconColor="#0C447C" name={b.name} meta={`${b.state} · ${b.cas} CAs`} onClick={() => handleSelectEntity(b.name, 'branch')} />)}
              </>}
              {filteredCAs.length > 0 && <>
                <div style={{ fontSize: '10px', fontWeight: 500, color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px 4px' }}>CA numbers</div>
                {filteredCAs.map(c => <SearchRow key={c.id} icon="CA" iconBg="#EAF3DE" iconColor="#27500A" name={c.id} meta={c.branch} onClick={() => handleSelectEntity(c.id, 'ca')} />)}
              </>}
              {filteredStates.length === 0 && filteredBranches.length === 0 && filteredCAs.length === 0 && (
                <div style={{ padding: '16px 12px', fontSize: '13px', color: '#858ea2', textAlign: 'center' }}>No results for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '13px', color: '#192744', fontWeight: 500 }}>Apr 2024 – Mar 2025</span>
          <select value={dateRange} onChange={e => { setDateRange(e.target.value); onDateRangeChange?.(e.target.value); }}
            style={{ padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#192744', background: '#fff', cursor: 'pointer' }}>
            <option value="1M">1M</option><option value="3M">3M</option>
            <option value="6M">6M</option><option value="1Y">1Y</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" value={customFromDate} onChange={e => setCustomFromDate(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '12px', background: '#fff' }} />
            <span style={{ fontSize: '12px', color: '#858ea2' }}>to</span>
            <input type="date" value={customToDate} onChange={e => setCustomToDate(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '12px', background: '#fff' }} />
          </div>
        )}

        <button onClick={() => onApply?.({ stateF: selectedState, branchF: selectedBranch, caF: selectedCA, dateRange })} style={{ padding: '8px 20px', background: '#2500D7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a00a8'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#2500D7'}>
          Apply
        </button>
      </div>

      {/* Row 2 — Pinned + Recent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b96', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: '2px', flexShrink: 0 }}>
          Pinned ({pinnedEntities.length}/{MAX_PINS})
        </span>

        {pinnedEntities.map((e, idx) => (
          <div key={`${e.name}-${idx}`} onClick={() => handleSelectEntity(e.name, e.type)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '28px', padding: '0 6px 0 10px', borderRadius: '20px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', fontWeight: 500, color: '#192744', cursor: 'pointer' }}
            onMouseEnter={el => (el.currentTarget as HTMLDivElement).style.borderColor = '#2500D7'}
            onMouseLeave={el => (el.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.15)'}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DOT_COLOR[e.type], flexShrink: 0 }} />
            <span>{e.name}</span>
            <button onClick={ev => { ev.stopPropagation(); handleUnpin(e.name); }}
              style={{ width: '18px', height: '18px', borderRadius: '50%', border: '0.5px solid rgba(0,0,0,0.15)', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, marginLeft: '2px', color: '#6b6b67', fontSize: '13px', lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background='#FCEBEB'; (ev.currentTarget as HTMLButtonElement).style.color='#A32D2D'; }}
              onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background='#f5f5f4'; (ev.currentTarget as HTMLButtonElement).style.color='#6b6b67'; }}
              title={`Unpin ${e.name}`}>×</button>
          </div>
        ))}

        {pinnedEntities.length >= 8 && (
          <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', flexShrink: 0, color: pinnedEntities.length >= MAX_PINS ? '#A32D2D' : '#854F0B', background: pinnedEntities.length >= MAX_PINS ? '#FCEBEB' : '#FAEEDA' }}>
            {pinnedEntities.length >= MAX_PINS ? 'Max 10 reached' : `${MAX_PINS - pinnedEntities.length} slots left`}
          </span>
        )}

        {visibleRecent.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b96', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 2px', flexShrink: 0 }}>Recent</span>
        )}

        {visibleRecent.map(e => (
          <div key={e.name} onClick={() => handleSelectEntity(e.name, e.type)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '28px', padding: '0 6px 0 10px', borderRadius: '20px', border: '0.5px dashed rgba(0,0,0,0.20)', background: '#fff', fontSize: '12px', fontWeight: 400, color: '#6b6b67', cursor: 'pointer' }}
            onMouseEnter={el => { (el.currentTarget as HTMLDivElement).style.borderColor='#2500D7'; (el.currentTarget as HTMLDivElement).style.color='#192744'; }}
            onMouseLeave={el => { (el.currentTarget as HTMLDivElement).style.borderColor='rgba(0,0,0,0.20)'; (el.currentTarget as HTMLDivElement).style.color='#6b6b67'; }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DOT_COLOR[e.type], opacity: 0.6, flexShrink: 0 }} />
            <span>{e.name}</span>
            {pinnedEntities.length < MAX_PINS && (
              <button onClick={ev => { ev.stopPropagation(); handlePin(e); }}
                style={{ width: '18px', height: '18px', borderRadius: '50%', border: '0.5px solid rgba(0,0,0,0.15)', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, marginLeft: '2px', color: '#6b6b67', fontSize: '13px', lineHeight: 1, flexShrink: 0 }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background='#EBEAFF'; (ev.currentTarget as HTMLButtonElement).style.color='#2500D7'; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background='#f5f5f4'; (ev.currentTarget as HTMLButtonElement).style.color='#6b6b67'; }}
                title={`Pin ${e.name}`}>+</button>
            )}
          </div>
        ))}
      </div>

      {(selectedState !== 'all' || selectedBranch !== 'all' || selectedCA !== 'all') && (
        <div style={{ display: 'flex', gap: '6px', paddingBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#858ea2', fontWeight: 500, flexShrink: 0 }}>Active filters:</span>
          {selectedState !== 'all' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#EBEAFF', fontSize: '11px', color: '#2500D7', fontWeight: 500 }}>
              {selectedState}
              <button onClick={() => { setSelectedState('all'); setSelectedBranch('all'); setSelectedCA('all') }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2500D7', fontSize: '12px', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
          {selectedBranch !== 'all' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#E6F1FB', fontSize: '11px', color: '#185FA5', fontWeight: 500 }}>
              {selectedBranch}
              <button onClick={() => { setSelectedBranch('all'); setSelectedCA('all') }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#185FA5', fontSize: '12px', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
          {selectedCA !== 'all' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#EAF3DE', fontSize: '11px', color: '#27500A', fontWeight: 500 }}>
              {selectedCA}
              <button onClick={() => setSelectedCA('all')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#27500A', fontSize: '12px', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
          <button onClick={() => { setSelectedState('all'); setSelectedBranch('all'); setSelectedCA('all'); onApply?.({ stateF: 'all', branchF: 'all', caF: 'all', dateRange }) }}
            style={{ fontSize: '11px', color: '#858ea2', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Clear all
          </button>
        </div>
      )}

function SearchRow({ icon, iconBg, iconColor, name, meta, onClick }: { icon: string; iconBg: string; iconColor: string; name: string; meta: string; onClick: () => void; }) {
  return (
    <div onClick={onClick} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f4'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: iconBg, color: iconColor, fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744' }}>{name}</div>
        <div style={{ fontSize: '11px', color: '#858ea2' }}>{meta}</div>
      </div>
    </div>
  );
}
