'use client'
import { useState } from 'react'
import { SummaryCard } from './SummaryCard'
import { getFilteredBills, inr, inrK, STATES, BRANCHES, CAS, getStateBills } from '@/lib/calculations'

interface BasicAnalyticsShellProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

const BASIC_SECTIONS = [
  { id: 'summary',   label: 'Summary'    },
  { id: 'locations', label: 'Locations'  },
  { id: 'trends',    label: 'Trends'     },
  { id: 'duedates',  label: 'Due Dates'  },
]

export default function BasicAnalyticsShell({ appState }: BasicAnalyticsShellProps) {
  const [section, setSection] = useState('summary')

  return (
    <div style={{ background: '#f0f5fa', minHeight: '100vh' }}>

      {/* Section pills */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 24px', display: 'flex', gap: '4px' }}>
        {BASIC_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '10px 16px', fontSize: '13px', fontWeight: 500,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: section === s.id ? '#2500D7' : '#858ea2',
            borderBottom: section === s.id ? '2px solid #2500D7' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div style={{ padding: '20px' }}>
        {section === 'summary' && <BasicSummary />}
        {section === 'locations' && <BasicLocations />}
        {section === 'trends' && <BasicTrends />}
        {section === 'duedates' && <BasicDueDates />}
      </div>
    </div>
  )
}

// ── Placeholder sections ────────────────────────────────
function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EBEAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="14" width="4" height="6" rx="1" fill="#2500D7" opacity="0.4"/>
          <rect x="9" y="9" width="4" height="11" rx="1" fill="#2500D7" opacity="0.7"/>
          <rect x="16" y="4" width="4" height="16" rx="1" fill="#2500D7"/>
        </svg>
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#192744' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#858ea2', textAlign: 'center', maxWidth: '320px' }}>{desc}</div>
      <div style={{ fontSize: '11px', color: '#2500D7', fontWeight: 500, padding: '4px 12px', borderRadius: '6px', background: '#EBEAFF' }}>Coming up next</div>
    </div>
  )
}

function BasicSummary() {
  const data     = getFilteredBills('monthly', 'all', 'all', 'all')
  const allCAs   = Object.values(CAS).flat()
  const totalBill = data.reduce((s, d) => s + d.totalBill, 0)
  const avgBill   = Math.round(totalBill / allCAs.length)
  const totalCAs  = allCAs.length
  const totalStates = STATES.length

  // YoY: compare first 6 months vs last 6 months as a proxy
  const firstHalf  = data.slice(0, 6).reduce((s, d) => s + d.totalBill, 0)
  const secondHalf = data.slice(6).reduce((s, d) => s + d.totalBill, 0)
  const yoyChange  = firstHalf > 0 ? Math.round((secondHalf - firstHalf) / firstHalf * 100) : 0

  // Bills due this month — simulate ~30% of CAs have bills due
  const billsDueCount  = Math.round(totalCAs * 0.30)
  const billsDueAmount = Math.round(avgBill * billsDueCount)

  // Payment status breakdown
  const paid    = Math.round(totalCAs * 0.60)
  const pending = Math.round(totalCAs * 0.25)
  const overdue = totalCAs - paid - pending

  // Monthly trend for sparkline
  const monthlyTotals = data.map(d => d.totalBill)
  const maxMonth      = Math.max(...monthlyTotals)

  // Top 5 states by bill
  const stateAmounts = STATES.map(st => ({
    state: st,
    total: getStateBills(st, 'monthly').reduce((s, d) => s + d.totalBill, 0),
    cas:   (BRANCHES[st] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0),
  })).sort((a, b) => b.total - a.total)

  return (
    <div>

      {/* Summary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Total portfolio value" value={inr(totalBill)}  sub={`${totalStates} states · ${totalCAs} active CAs`}        subColor="#858ea2" borderColor="#2500D7" />
        <SummaryCard label="Avg bill per CA"        value={inr(avgBill)}   sub="per billing period · all CAs"                              subColor="#185FA5" borderColor="#185FA5" />
        <SummaryCard label="H2 vs H1 change"        value={`${yoyChange > 0 ? '+' : ''}${yoyChange}%`} sub="second half vs first half of period" subColor={yoyChange > 0 ? '#854F0B' : '#3B6D11'} borderColor={yoyChange > 0 ? '#EF9F27' : '#1A7A45'} />
        <SummaryCard label="Bills due this month"   value={`${billsDueCount}`} sub={`${inr(billsDueAmount)} · next 30 days`}              subColor="#A32D2D" borderColor="#E24B4A" />
      </div>

      {/* Two column layout — trend + payment status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

        {/* Monthly spend trend — sparkline bars */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Monthly spend trend</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '16px' }}>Total bill amount per month · Apr 2024 – Mar 2025</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
            {data.map((d, i) => {
              const h = Math.round((d.totalBill / maxMonth) * 80)
              const isMax = d.totalBill === maxMonth
              return (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: `${h}px`, borderRadius: '3px 3px 0 0', background: isMax ? '#2500D7' : '#EBEAFF', transition: 'height 0.3s' }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {data.filter((_, i) => i % 3 === 0).map(d => (
              <span key={d.label} style={{ fontSize: '10px', color: '#858ea2' }}>{d.label}</span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '10px 12px', background: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{inr(Math.min(...monthlyTotals))}</div>
              <div style={{ fontSize: '10px', color: '#858ea2' }}>Lowest month</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{inr(totalBill / data.length)}</div>
              <div style={{ fontSize: '10px', color: '#858ea2' }}>Monthly avg</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{inr(maxMonth)}</div>
              <div style={{ fontSize: '10px', color: '#858ea2' }}>Peak month</div>
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Payment status</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '16px' }}>Current period · {totalCAs} total CAs</div>
          {[
            { label: 'Paid',    count: paid,    pct: Math.round(paid/totalCAs*100),    color: '#1D9E75', bg: '#EAF3DE' },
            { label: 'Pending', count: pending, pct: Math.round(pending/totalCAs*100), color: '#EF9F27', bg: '#FAEEDA' },
            { label: 'Overdue', count: overdue, pct: Math.round(overdue/totalCAs*100), color: '#E24B4A', bg: '#FCEBEB' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#192744' }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{item.count}</span>
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: item.bg, color: item.color, fontWeight: 500 }}>{item.pct}%</span>
                </div>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: item.color, width: `${item.pct}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '10px 12px', background: '#FCEBEB', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#A32D2D', fontWeight: 500 }}>⚠ {overdue} CAs overdue</div>
            <div style={{ fontSize: '11px', color: '#A32D2D' }}>Immediate attention needed</div>
          </div>
        </div>
      </div>

      {/* Top states by bill amount */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Top states by bill amount</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Ranked by total bill · Apr 2024 – Mar 2025</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stateAmounts.map((s, i) => {
            const pct = Math.round(s.total / totalBill * 100)
            const barPct = Math.round(s.total / stateAmounts[0].total * 100)
            return (
              <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', fontSize: '11px', fontWeight: 600, color: i < 3 ? '#2500D7' : '#858ea2', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ width: '110px', fontSize: '12px', fontWeight: 500, color: '#192744', flexShrink: 0 }}>{s.state}</div>
                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '4px', background: i === 0 ? '#2500D7' : i < 3 ? '#7B6FE8' : '#EBEAFF', width: `${barPct}%` }} />
                </div>
                <div style={{ width: '70px', fontSize: '12px', fontWeight: 600, color: '#192744', textAlign: 'right', flexShrink: 0 }}>{inr(s.total)}</div>
                <div style={{ width: '32px', fontSize: '11px', color: '#858ea2', textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function BasicLocations() {
  const allCAs    = Object.values(CAS).flat()
  const totalCAs  = allCAs.length

  // Per-state data
  const stateData = STATES.map(st => {
    const cas      = (BRANCHES[st] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0)
    const bills    = getStateBills(st, 'monthly')
    const total    = bills.reduce((s, d) => s + d.totalBill, 0)
    const avgBill  = Math.round(total / Math.max(cas, 1))
    // Simulate prior year — ±5-15% variance per state deterministically
    const seed     = st.charCodeAt(0) % 20
    const priorTotal = Math.round(total * (0.88 + seed * 0.015))
    const yoy      = Math.round((total - priorTotal) / Math.max(priorTotal, 1) * 100)
    const isOutlier = Math.abs(yoy) > 10
    return { state: st, cas, total, avgBill, priorTotal, yoy, isOutlier }
  }).sort((a, b) => b.total - a.total)

  const portfolioTotal = stateData.reduce((s, d) => s + d.total, 0)
  const outliers       = stateData.filter(d => d.isOutlier)
  const topState       = stateData[0]
  const avgStateSpend  = Math.round(portfolioTotal / STATES.length)

  return (
    <div>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Top state"            value={topState.state}               sub={`${inr(topState.total)} · ${Math.round(topState.total/portfolioTotal*100)}% of portfolio`} subColor="#185FA5" borderColor="#2500D7" />
        <SummaryCard label="Avg spend per state"  value={inr(avgStateSpend)}           sub="across all states · current period"                                                          subColor="#858ea2" borderColor="#185FA5" />
        <SummaryCard label="Outlier states"       value={`${outliers.length}`}         sub=">10% YoY change · needs review"                                                              subColor={outliers.length > 2 ? '#A32D2D' : '#854F0B'} borderColor={outliers.length > 2 ? '#E24B4A' : '#EF9F27'} />
        <SummaryCard label="Highest avg CA bill"  value={inr(Math.max(...stateData.map(d => d.avgBill)))} sub={stateData.sort((a,b) => b.avgBill - a.avgBill)[0].state + ' · per CA per period'} subColor="#854F0B" borderColor="#EF9F27" />
      </div>

      {/* State heatmap — grid of states coloured by spend */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>State spend heatmap</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Darker = higher total bill · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#858ea2' }}>
            <span>Low</span>
            {['#EBEAFF','#C4BFFF','#9E97FF','#7B6FE8','#2500D7'].map(c => (
              <div key={c} style={{ width: '16px', height: '16px', borderRadius: '3px', background: c }} />
            ))}
            <span>High</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '8px' }}>
          {stateData.map((s, i) => {
            const intensity = s.total / stateData[0].total
            const bg = intensity > 0.8 ? '#2500D7' : intensity > 0.6 ? '#7B6FE8' : intensity > 0.4 ? '#9E97FF' : intensity > 0.2 ? '#C4BFFF' : '#EBEAFF'
            const textColor = intensity > 0.5 ? '#fff' : '#192744'
            return (
              <div key={s.state} style={{ background: bg, borderRadius: '8px', padding: '12px 14px', position: 'relative' }}>
                {s.isOutlier && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: s.yoy > 0 ? '#EF9F27' : '#E24B4A' }} />
                )}
                <div style={{ fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '3px' }}>{s.state}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>{inr(s.total)}</div>
                <div style={{ fontSize: '10px', color: intensity > 0.5 ? 'rgba(255,255,255,0.75)' : '#858ea2', marginTop: '2px' }}>{s.cas} CAs</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '11px', color: '#858ea2', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF9F27', display: 'inline-block' }} />Spending up &gt;10% YoY
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} />Spending down &gt;10% YoY
          </span>
        </div>
      </div>

      {/* Ranked table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>All locations ranked</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Sorted by total bill · YoY change vs prior year</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['#', 'State', 'CAs', 'Total bill', 'Avg per CA', 'vs Prior year', 'Status'].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stateData.map((s, i) => (
              <tr key={s.state}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: i < 3 ? '#2500D7' : '#858ea2', fontWeight: 600 }}>{i + 1}</td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{s.state}</td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>{s.cas}</td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{inr(s.total)}</td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>{inr(s.avgBill)}</td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                    background: s.yoy > 10 ? '#FAEEDA' : s.yoy < -10 ? '#FCEBEB' : '#f5f5f4',
                    color:      s.yoy > 10 ? '#854F0B' : s.yoy < -10 ? '#A32D2D' : '#6b6b67',
                  }}>
                    {s.yoy > 0 ? '+' : ''}{s.yoy}%
                  </span>
                </td>
                <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                    background: s.isOutlier ? (s.yoy > 0 ? '#FAEEDA' : '#FCEBEB') : '#EAF3DE',
                    color:      s.isOutlier ? (s.yoy > 0 ? '#633806' : '#A32D2D') : '#27500A',
                  }}>
                    {s.isOutlier ? (s.yoy > 0 ? '⚠ Spike' : '⚠ Drop') : '✓ Normal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

function BasicTrends() {
  return <PlaceholderSection title="Trends & comparisons" desc="Monthly spend trend, YoY comparison lines, and seasonal patterns across your portfolio" />
}

function BasicDueDates() {
  return <PlaceholderSection title="Due date calendar" desc="Upcoming bill due dates, capital planning view, and payment prioritisation by amount" />
}
