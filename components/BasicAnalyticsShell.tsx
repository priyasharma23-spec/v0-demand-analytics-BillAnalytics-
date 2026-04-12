'use client'
import { useState, useEffect, useRef } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
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
      <div style={{
        background: '#fff',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        padding: '0 20px',
        display: 'flex',
        gap: '2px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {BASIC_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '11px 18px',
            fontSize: '13px',
            fontWeight: section === s.id ? 600 : 400,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: section === s.id ? '#2500D7' : '#858ea2',
            borderBottom: section === s.id ? '2px solid #2500D7' : '2px solid transparent',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
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
function PlaceholderSection({ title, desc, bullets }: { title: string; desc: string; bullets?: string[] }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '40px 32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#EBEAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="2" y="16" width="5" height="8" rx="1.5" fill="#2500D7" opacity="0.35"/>
          <rect x="10" y="10" width="5" height="14" rx="1.5" fill="#2500D7" opacity="0.65"/>
          <rect x="18" y="4" width="5" height="20" rx="1.5" fill="#2500D7"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#192744', marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#858ea2', marginBottom: bullets ? '12px' : 0 }}>{desc}</div>
        {bullets && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {bullets.map(b => (
              <span key={b} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#EBEAFF', color: '#2500D7', fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: '#2500D7', fontWeight: 500, padding: '5px 14px', borderRadius: '6px', background: '#EBEAFF', flexShrink: 0 }}>
        In progress
      </div>
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

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2500D7 0%, #7B6FE8 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '5px' }}>
            Bill Payments — Basic Analytics
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', maxWidth: '480px' }}>
            Portfolio overview across {totalStates} states · {totalCAs} CAs · Apr 2024 – Mar 2025.
            Connect bill copy data to unlock leakage detection, excess demand analysis, and savings recommendations.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, marginLeft: '24px' }}>
          <button style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: '#fff', color: '#2500D7',
          }}>
            Unlock Advanced →
          </button>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
            Bill copy integration required
          </div>
        </div>
      </div>

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
        <SummaryCard label="Highest avg CA bill"  value={inr(Math.max(...stateData.map(d => d.avgBill)))} sub={stateData.sort((a,b) => b.avgBill - a.avgBill)[0].state + ' �� per CA per period'} subColor="#854F0B" borderColor="#EF9F27" />
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
  const trendRef   = useRef<HTMLCanvasElement>(null)
  const yoyRef     = useRef<HTMLCanvasElement>(null)
  const trendChart = useRef<Chart | null>(null)
  const yoyChart   = useRef<Chart | null>(null)

  const data        = getFilteredBills('monthly', 'all', 'all', 'all')
  const monthlyTotals = data.map(d => d.totalBill)
  const labels        = data.map(d => d.label)

  // Simulate prior year — each month 85-95% of current
  const priorYear = monthlyTotals.map((v, i) => {
    const seed = (i * 7 + 3) % 15
    return Math.round(v * (0.85 + seed * 0.007))
  })

  // YoY % change per month
  const yoyChanges = monthlyTotals.map((v, i) =>
    Math.round((v - priorYear[i]) / Math.max(priorYear[i], 1) * 100)
  )

  // Insights
  const maxMonthIdx  = monthlyTotals.indexOf(Math.max(...monthlyTotals))
  const minMonthIdx  = monthlyTotals.indexOf(Math.min(...monthlyTotals))
  const avgCurrent   = Math.round(monthlyTotals.reduce((a,b) => a+b,0) / monthlyTotals.length)
  const avgPrior     = Math.round(priorYear.reduce((a,b) => a+b,0) / priorYear.length)
  const overallYoy   = Math.round((avgCurrent - avgPrior) / Math.max(avgPrior,1) * 100)

  useEffect(() => {
    // Trend chart — current vs prior year
    if (trendRef.current) {
      const ctx = trendRef.current.getContext('2d')
      if (ctx) {
        if (trendChart.current) trendChart.current.destroy()
        trendChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Current year',
                data: monthlyTotals,
                borderColor: '#2500D7',
                backgroundColor: 'rgba(37,0,215,0.06)',
                borderWidth: 2.5,
                pointBackgroundColor: '#2500D7',
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.35,
                fill: true,
              },
              {
                label: 'Prior year',
                data: priorYear,
                borderColor: '#C4BFFF',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderDash: [5, 4],
                pointBackgroundColor: '#C4BFFF',
                pointRadius: 2,
                pointHoverRadius: 4,
                tension: 0.35,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#192744',
                titleColor: '#fff',
                bodyColor: 'rgba(255,255,255,0.85)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: item => `  ${item.dataset.label}: ${inrK(item.raw as number)}`,
                  footer: items => {
                    const curr = items.find(i => i.datasetIndex === 0)?.raw as number ?? 0
                    const prior = items.find(i => i.datasetIndex === 1)?.raw as number ?? 0
                    const chg = Math.round((curr - prior) / Math.max(prior,1) * 100)
                    return `YoY: ${chg > 0 ? '+' : ''}${chg}%`
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
              y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' } },
            },
          },
        })
      }
    }

    // YoY % change bar chart
    if (yoyRef.current) {
      const ctx = yoyRef.current.getContext('2d')
      if (ctx) {
        if (yoyChart.current) yoyChart.current.destroy()
        yoyChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'YoY change (%)',
              data: yoyChanges,
              backgroundColor: yoyChanges.map(v => v > 0 ? 'rgba(239,159,39,0.75)' : 'rgba(29,158,117,0.75)'),
              borderRadius: 4,
              barPercentage: 0.65,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#192744',
                callbacks: {
                  label: item => `  YoY: ${(item.raw as number) > 0 ? '+' : ''}${item.raw}%`,
                }
              }
            },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
              y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => v + '%' } },
            },
          },
        })
      }
    }

    return () => {
      if (trendChart.current) trendChart.current.destroy()
      if (yoyChart.current)   yoyChart.current.destroy()
    }
  }, [])

  return (
    <div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Overall YoY change"  value={`${overallYoy > 0 ? '+' : ''}${overallYoy}%`} sub="avg monthly spend vs prior year"          subColor={overallYoy > 0 ? '#854F0B' : '#3B6D11'} borderColor={overallYoy > 0 ? '#EF9F27' : '#1A7A45'} />
        <SummaryCard label="Peak month"          value={labels[maxMonthIdx]}                           sub={`${inr(monthlyTotals[maxMonthIdx])} · highest spend`} subColor="#A32D2D" borderColor="#E24B4A" />
        <SummaryCard label="Lowest month"        value={labels[minMonthIdx]}                           sub={`${inr(monthlyTotals[minMonthIdx])} · lowest spend`}  subColor="#3B6D11" borderColor="#1A7A45" />
        <SummaryCard label="Monthly average"     value={inr(avgCurrent)}                               sub={`vs ${inr(avgPrior)} prior year`}                      subColor="#185FA5" borderColor="#185FA5" />
      </div>

      {/* Current vs prior year trend */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Monthly spend — current vs prior year</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Total bill amount · Apr 2024 – Mar 2025 vs Apr 2023 – Mar 2024</div>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#6b6b67' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'18px', height:'2.5px', background:'#2500D7', display:'inline-block', borderRadius:'1px' }} />Current year
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'18px', height:'1.5px', background:'#C4BFFF', display:'inline-block', borderRadius:'1px', borderTop: '1px dashed #C4BFFF' }} />Prior year
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '240px' }}>
          <canvas ref={trendRef}></canvas>
        </div>
      </div>

      {/* YoY change bars */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Month-by-month YoY change</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>% change vs same month prior year · amber = increase, green = decrease</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px', color: '#6b6b67' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'rgba(239,159,39,0.75)', display:'inline-block' }} />Spend increased vs prior year
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'rgba(29,158,117,0.75)', display:'inline-block' }} />Spend decreased vs prior year
          </span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '180px' }}>
          <canvas ref={yoyRef}></canvas>
        </div>
      </div>

    </div>
  )
}

function BasicDueDates() {
  const [selectedMonth, setSelectedMonth] = useState(0) // 0 = current month view

  const data    = getFilteredBills('monthly', 'all', 'all', 'all')
  const allCAs  = Object.values(CAS).flat()
  const totalCAs = allCAs.length

  // Generate due date schedule — each CA has a due date between 1-28 of month
  // Deterministically assign due dates based on CA name seed
  const caSchedule = allCAs.map((ca, i) => {
    const seed       = ca.charCodeAt(0) + ca.charCodeAt(ca.length - 1)
    const dueDay     = (seed % 25) + 3           // due day 3–27
    const billAmt    = Math.round(180000 + (seed % 50) * 4200)
    const isPaid     = (seed % 10) < 6           // 60% paid
    const isOverdue  = !isPaid && (seed % 10) < 8 // 20% overdue
    const isDueSoon  = !isPaid && !isOverdue      // 20% due soon
    const state      = STATES[i % STATES.length]
    return { ca, dueDay, billAmt, isPaid, isOverdue, isDueSoon, state }
  })

  // Group by due day for calendar
  const byDay: Record<number, typeof caSchedule> = {}
  caSchedule.forEach(ca => {
    if (!byDay[ca.dueDay]) byDay[ca.dueDay] = []
    byDay[ca.dueDay].push(ca)
  })

  // Capital planning — cumulative amount due each week
  const weeks = [
    { label: 'Week 1 (1–7)',   days: [1,2,3,4,5,6,7]   },
    { label: 'Week 2 (8–14)',  days: [8,9,10,11,12,13,14] },
    { label: 'Week 3 (15–21)', days: [15,16,17,18,19,20,21] },
    { label: 'Week 4 (22–28)', days: [22,23,24,25,26,27,28] },
  ]
  const weeklyAmounts = weeks.map(w => {
    const cas    = w.days.flatMap(d => byDay[d] ?? [])
    const total  = cas.reduce((s, c) => s + c.billAmt, 0)
    const unpaid = cas.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
    const overdue = cas.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
    return { ...w, total, unpaid, overdue, count: cas.length, unpaidCount: cas.filter(c => !c.isPaid).length }
  })

  const totalUnpaid  = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const totalOverdue = caSchedule.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
  const totalDueSoon = caSchedule.filter(c => c.isDueSoon).reduce((s, c) => s + c.billAmt, 0)
  const overdueCount = caSchedule.filter(c => c.isOverdue).length
  const dueSoonCount = caSchedule.filter(c => c.isDueSoon).length

  // Calendar grid — 28 days
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Total unpaid"     value={inr(totalUnpaid)}   sub={`${totalCAs - caSchedule.filter(c=>c.isPaid).length} CAs · current period`}  subColor="#185FA5" borderColor="#2500D7" />
        <SummaryCard label="Overdue"          value={inr(totalOverdue)}  sub={`${overdueCount} CAs past due date`}                                           subColor="#A32D2D" borderColor="#E24B4A" />
        <SummaryCard label="Due within 7 days" value={inr(totalDueSoon)} sub={`${dueSoonCount} CAs · pay to avoid late charges`}                            subColor="#854F0B" borderColor="#EF9F27" />
        <SummaryCard label="Paid this period"  value={inr(caSchedule.filter(c=>c.isPaid).reduce((s,c)=>s+c.billAmt,0))} sub={`${caSchedule.filter(c=>c.isPaid).length} CAs · ${Math.round(caSchedule.filter(c=>c.isPaid).length/totalCAs*100)}% conversion`} subColor="#3B6D11" borderColor="#1A7A45" />
      </div>

      {/* Two column — calendar + weekly capital plan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

        {/* Due date calendar */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Due date calendar</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Bills due per day · current month</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarDays.map(day => {
              const dayCAs  = byDay[day] ?? []
              const hasOver = dayCAs.some(c => c.isOverdue)
              const hasSoon = dayCAs.some(c => c.isDueSoon)
              const hasPaid = dayCAs.some(c => c.isPaid)
              const bg      = dayCAs.length === 0 ? '#f9f9f9' : hasOver ? '#FCEBEB' : hasSoon ? '#FAEEDA' : '#EAF3DE'
              const border  = dayCAs.length === 0 ? 'rgba(0,0,0,0.06)' : hasOver ? '#F7C1C1' : hasSoon ? '#FAC775' : '#C0DD97'
              const textCol = dayCAs.length === 0 ? '#c4c4c4' : hasOver ? '#A32D2D' : hasSoon ? '#633806' : '#27500A'
              return (
                <div key={day} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: '6px', padding: '6px 4px', textAlign: 'center', cursor: dayCAs.length > 0 ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: textCol }}>{day}</div>
                  {dayCAs.length > 0 && (
                    <div style={{ fontSize: '9px', color: textCol, marginTop: '1px' }}>{dayCAs.length} CA{dayCAs.length > 1 ? 's' : ''}</div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '11px', color: '#858ea2', flexWrap: 'wrap' }}>
            {[
              { color: '#F7C1C1', label: 'Overdue' },
              { color: '#FAC775', label: 'Due soon' },
              { color: '#C0DD97', label: 'Paid' },
              { color: 'rgba(0,0,0,0.06)', label: 'No bills' },
            ].map(item => (
              <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block', border: '0.5px solid rgba(0,0,0,0.08)' }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly capital planning */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Weekly capital plan</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Cash required by week · plan ahead to avoid late charges</div>
          {weeklyAmounts.map((w, i) => (
            <div key={w.label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#192744' }}>{w.label}</span>
                  <span style={{ fontSize: '11px', color: '#858ea2', marginLeft: '6px' }}>{w.count} bills</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {w.overdue > 0 && (
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>₹{(w.overdue/100000).toFixed(1)}L overdue</span>
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{inr(w.unpaid)}</span>
                </div>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: w.overdue > 0 ? '#E24B4A' : i === 0 ? '#2500D7' : '#7B6FE8',
                  width: `${Math.round(w.unpaid / Math.max(...weeklyAmounts.map(x => x.unpaid)) * 100)}%`,
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '3px' }}>{w.unpaidCount} unpaid · {inr(w.unpaid)} cash needed</div>
            </div>
          ))}
          <div style={{ padding: '10px 12px', background: '#E6F1FB', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#0C447C' }}>Total cash required this month</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#185FA5' }}>{inr(totalUnpaid)}</span>
          </div>
        </div>
      </div>

      {/* Upcoming dues table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Upcoming & overdue bills</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Sorted by urgency — overdue first, then by due date</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['CA Number', 'State', 'Due date', 'Bill amount', 'Status', 'Action'].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {caSchedule
              .filter(c => !c.isPaid)
              .sort((a, b) => (a.isOverdue === b.isOverdue ? a.dueDay - b.dueDay : a.isOverdue ? -1 : 1))
              .slice(0, 10)
              .map(c => (
                <tr key={c.ca}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontFamily: 'monospace', fontSize: '12px', color: '#192744' }}>{c.ca}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>{c.state}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: c.isOverdue ? '#A32D2D' : '#633806' }}>
                    {c.isOverdue ? `Past due (day ${c.dueDay})` : `Day ${c.dueDay}`}
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{inr(c.billAmt)}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                      background: c.isOverdue ? '#FCEBEB' : '#FAEEDA',
                      color: c.isOverdue ? '#A32D2D' : '#633806',
                    }}>
                      {c.isOverdue ? 'Overdue' : 'Due soon'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <button style={{
                      fontSize: '11px', fontWeight: 500, padding: '4px 12px', borderRadius: '6px',
                      border: c.isOverdue ? '0.5px solid #F7C1C1' : '0.5px solid #B5D4F4',
                      background: c.isOverdue ? '#FCEBEB' : '#E6F1FB',
                      color: c.isOverdue ? '#A32D2D' : '#0C447C',
                      cursor: 'pointer',
                    }}>
                      {c.isOverdue ? 'Pay now' : 'Schedule payment'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
