'use client';
import React, { useState } from 'react';
import { getFilteredBills, inr, STATES, BRANCHES, CAS } from '@/lib/calculations';

type LeakageKey = 'Power factor <0.92' | 'Demand shrinkage' | 'Late payment surcharge' | 'Under-utilised demand';

interface LeakageDrilldownPageProps {
  leakageKey: LeakageKey;
  onBack: () => void;
  appState: { view: string; stateF: string; branchF: string; caF: string };
}

const CONFIG: Record<LeakageKey, {
  color: string; bg: string; border: string;
  amountField: string; desc: string; recommendation: string;
}> = {
  'Power factor <0.92': {
    color: '#DC2626', bg: '#fef2f2', border: '#fecaca',
    amountField: 'pfPenalty',
    desc: 'CAs with power factor below 0.92 triggering monthly PF penalty charges.',
    recommendation: 'Install capacitor banks at high-impact locations to bring PF above 0.95.',
  },
  'Demand shrinkage': {
    color: '#DC2626', bg: '#fef2f2', border: '#fecaca',
    amountField: 'excessDemandCharges',
    desc: 'CAs where contracted demand is exceeded every month, incurring excess demand charges.',
    recommendation: 'Revise contracted demand upward to P90 MDI + 15% buffer to eliminate charges.',
  },
  'Late payment surcharge': {
    color: '#F59E0B', bg: '#fffbeb', border: '#fde68a',
    amountField: 'latePaymentCharges',
    desc: 'CAs with 3+ consecutive months of late payment surcharge.',
    recommendation: 'Align payment scheduling to due dates — no tariff or infrastructure changes needed.',
  },
  'Under-utilised demand': {
    color: '#16a34a', bg: '#f0faf6', border: '#bbf7d0',
    amountField: 'totalBill',
    desc: 'CAs with TOD mismatch or contracted demand consistently under-utilised below 70%.',
    recommendation: 'Reduce contracted demand or correct TOD slot to lower fixed charges.',
  },
};

export default function LeakageDrilldownPage({ leakageKey, onBack, appState }: LeakageDrilldownPageProps) {
  const [sortCol, setSortCol] = useState<'amount' | 'months' | 'ca' | 'branch' | 'state'>('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const cfg = CONFIG[leakageKey];

  // Build CA rows from calculations
  const bills = getFilteredBills(appState.view as any, appState.stateF, appState.branchF, appState.caF);

  const rows = bills.map((b: any) => {
    const amtRaw = leakageKey === 'Under-utilised demand'
      ? Math.round((b.totalBill ?? 0) * 0.03)
      : (b[cfg.amountField] ?? 0);
    return {
      ca:     b.caNumber ?? b.ca ?? '—',
      branch: b.branch ?? '—',
      state:  b.state  ?? '—',
      months: b.monthsAffected ?? Math.min(12, Math.max(1, Math.round(amtRaw / 5000))),
      amount: amtRaw,
    };
  }).filter((r: any) => r.amount > 0);

  // Search filter
  const filtered = rows.filter((r: any) =>
    r.ca.toLowerCase().includes(search.toLowerCase()) ||
    r.branch.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    const av = a[sortCol], bv = b[sortCol];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalAmount = sorted.reduce((s: number, r: any) => s + r.amount, 0);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    <span style={{ marginLeft: 3, opacity: sortCol === col ? 1 : 0.3, fontSize: 9 }}>
      {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}
    </span>
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200, margin: '0 auto' }}>

      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <button onClick={onBack} style={{
          fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
          color: '#858ea2', background: '#fff',
          border: '1px solid #f0f1f5', borderRadius: 6,
          padding: '6px 12px', cursor: 'pointer', marginTop: 2,
          boxShadow: '0 1px 2px rgba(25,39,68,.04)',
        }}>← Back</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{leakageKey}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#192744', letterSpacing: '-0.01em', marginBottom: 4 }}>
            CA-level leakage breakdown
          </div>
          <div style={{ fontSize: 12, color: '#858ea2' }}>{cfg.desc}</div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total leakage', value: '₹' + (totalAmount / 100000).toFixed(1) + 'L', color: cfg.color },
          { label: 'CAs affected', value: String(sorted.length), color: '#192744' },
          { label: 'Avg per CA', value: sorted.length > 0 ? '₹' + (totalAmount / sorted.length / 100000).toFixed(2) + 'L' : '—', color: '#192744' },
          { label: 'Recommendation', value: cfg.recommendation, color: '#192744', small: true },
        ].map((s, i) => (
          <div key={i} style={{ background: i === 0 ? cfg.bg : '#fff', border: '1px solid ' + (i === 0 ? cfg.border : '#f0f1f5'), borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: (s as any).small ? 11 : 20, fontWeight: (s as any).small ? 400 : 700, color: s.color, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: 8, boxShadow: '0 1px 3px rgba(25,39,68,.04)', overflow: 'hidden' }}>

        {/* Table toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#192744' }}>
            {sorted.length} CA{sorted.length !== 1 ? 's' : ''} affected
          </div>
          <div style={{ position: 'relative', width: 280 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#192744" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search CA, branch, state..."
              style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #f0f1f5', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: '#192744', background: '#f5f6fa', outline: 'none' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                {([
                  { key: 'ca',     label: 'CA Number',       align: 'left'  },
                  { key: 'branch', label: 'Branch',          align: 'left'  },
                  { key: 'state',  label: 'State',           align: 'left'  },
                  { key: 'months', label: 'Months Affected', align: 'right' },
                  { key: 'amount', label: 'Leakage Amount',  align: 'right' },
                  { key: null,     label: 'Share',            align: 'right' },
                ] as any[]).map((col, i) => (
                  <th key={i}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                    style={{
                      padding: '9px 16px', textAlign: col.align,
                      fontSize: 10, fontWeight: 600, color: '#858ea2',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid #f0f1f5', whiteSpace: 'nowrap',
                      cursor: col.key ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}>
                    {col.label}{col.key && <SortIcon col={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#858ea2', fontSize: 13 }}>No CAs found</td></tr>
              ) : sorted.map((r: any, i: number) => {
                const sharePct = totalAmount > 0 ? (r.amount / totalAmount) * 100 : 0;
                const monthColor = r.months >= 9 ? '#DC2626' : r.months >= 6 ? '#F59E0B' : '#858ea2';
                return (
                  <tr key={i}
                    style={{ borderBottom: '1px solid #f0f1f5', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f6fa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#192744', fontFamily: 'monospace', fontSize: 11 }}>{r.ca}</td>
                    <td style={{ padding: '11px 16px', color: '#192744' }}>{r.branch}</td>
                    <td style={{ padding: '11px 16px', color: '#858ea2' }}>{r.state}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: monthColor }}>{r.months}</span>
                      <span style={{ color: '#858ea2' }}> / 12</span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: cfg.color, letterSpacing: '-0.01em' }}>
                      ₹{(r.amount / 100000).toFixed(2)}L
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 64, height: 4, background: '#f0f1f5', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: sharePct + '%', height: '100%', background: cfg.color, borderRadius: 99, opacity: 0.7 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#858ea2', minWidth: 32, textAlign: 'right' }}>{sharePct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#858ea2' }}>{sorted.length} CAs · sorted by {sortCol} {sortDir}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>Total: ₹{(totalAmount / 100000).toFixed(1)}L</span>
        </div>
      </div>
    </div>
  );
}
