'use client'
import { useState, useEffect, useRef } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
import { SummaryCard } from './SummaryCard'
import { getFilteredBills, inr, inrK, STATES, BRANCHES, CAS, getStateBills, getCABills } from '@/lib/calculations'

interface BasicAnalyticsShellProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

type BasicSectionProps = {
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
        {section === 'summary' && <BasicSummary appState={appState} />}
        {section === 'locations' && <BasicLocations appState={appState} />}
        {section === 'trends' && <BasicTrends appState={appState} />}
        {section === 'duedates' && <BasicDueDates appState={appState} />}
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

function BasicSummary({ appState }: BasicSectionProps) {
  const data          = getFilteredBills('monthly', appState.stateF, appState.branchF, appState.caF)
  const allCAs        = Object.values(CAS).flat()
  const totalBill     = data.reduce((s, d) => s + d.totalBill, 0)
  const avgBill       = Math.round(totalBill / allCAs.length)
  const totalCAs      = allCAs.length
  const totalStates   = STATES.length
  const monthlyTotals = data.map(d => d.totalBill)
  const labels        = data.map(d => d.label)
  const maxVal        = Math.max(...monthlyTotals)
  const minVal        = Math.min(...monthlyTotals)
  const maxMonthIdx   = monthlyTotals.indexOf(maxVal)
  const minMonthIdx   = monthlyTotals.indexOf(minVal)
  const lastMonth     = data[data.length - 1]
  const prevMonth     = data[data.length - 2]
  const momChange     = prevMonth && prevMonth.totalBill > 0
    ? Math.round((lastMonth.totalBill - prevMonth.totalBill) / prevMonth.totalBill * 100)
    : 0
  const momLabel      = lastMonth?.label ?? ''
  const momPrevLabel  = prevMonth?.label ?? ''
  const billsDueCount = Math.round(totalCAs * 0.30)
  const billsDueAmount = Math.round(avgBill * billsDueCount)
  const paid    = Math.round(totalCAs * 0.60)
  const pending = Math.round(totalCAs * 0.25)
  const hold    = Math.round(totalCAs * 0.10)
  const overdue = totalCAs - paid - pending - hold
  const stateAmounts = STATES.map(st => ({
    state: st,
    total: getStateBills(st, 'monthly').reduce((s, d) => s + d.totalBill, 0),
    cas:   (BRANCHES[st] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0),
  })).sort((a, b) => b.total - a.total)

  // Count CAs that have a bill each month
  const caCounts = data.map((_, mi) =>
    allCAs.filter(ca => {
      const bill = getCABills(ca, 'monthly')[mi]
      return bill && bill.totalBill > 0
    }).length
  )

  const spendTrendRef   = useRef<HTMLCanvasElement>(null)
  const spendTrendChart = useRef<Chart | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!spendTrendRef.current) return
      const ctx = spendTrendRef.current.getContext('2d')
      if (!ctx) return
      if (spendTrendChart.current) spendTrendChart.current.destroy()
      const padding = (maxVal - minVal) * 0.15
    spendTrendChart.current = new Chart(ctx, {
      type: 'line',
      data: {
          labels,
          datasets: [{
            type: 'line' as const,
            label: 'Total bill',
            data: monthlyTotals,
            borderColor: '#1c5af4',
            borderWidth: 2,
            backgroundColor: 'rgba(28,90,244,0.06)',
            pointBackgroundColor: monthlyTotals.map((_, i) =>
              i === maxMonthIdx ? '#1c5af4' : i === minMonthIdx ? '#36b37e' : '#fff'
            ),
            pointBorderColor: '#1c5af4',
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#f5f6fa',
              titleColor: '#192744',
              bodyColor: '#5e687d',
              borderColor: '#f3f4f6',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 4,
              displayColors: false,
              callbacks: {
                title: items => items[0].label,
                label: item => `  Bill amount: ₹${(Number(item.raw) / 100000).toFixed(1)}L`,
                afterLabel: item => {
                  const i = item.dataIndex
                  const count = caCounts[i] ?? 0
                  const lines = [`  Active CAs: ${count}`]
                  if (i === maxMonthIdx) lines.push('  ▲ Peak month')
                  else if (i === minMonthIdx) lines.push('  ▼ Lowest month')
                  else {
                    const prev = monthlyTotals[i - 1]
                    if (prev) {
                      const chg = Math.round((monthlyTotals[i] - prev) / prev * 100)
                      lines.push(`  ${chg > 0 ? '↑' : '↓'} ${Math.abs(chg)}% vs prev month`)
                    }
                  }
                  return lines.join('\n')
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: '#858ea2', font: { size: 11 } },
            },
            y: {
              type: 'linear' as const,
              position: 'left' as const,
              border: { display: false },
              grid: { color: '#f3f4f6' },
              min: Math.floor((minVal - padding) / 100000) * 100000,
              max: Math.ceil((maxVal + padding) / 100000) * 100000,
              ticks: {
                color: '#858ea2',
                font: { size: 11 },
                callback: (v: any) => '₹' + (Number(v) / 100000).toFixed(0) + 'L',
              },
            },
          },
        },
      })
    }, 50)
    return () => {
      clearTimeout(timer)
      if (spendTrendChart.current) spendTrendChart.current.destroy()
    }
  }, [])

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #1c5af4 0%, #7B6FE8 100%)', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '5px' }}>Bill Payments — Basic Analytics</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', maxWidth: '480px' }}>
            Portfolio overview across {totalStates} states · {totalCAs} CAs · Apr 2024 – Mar 2025. Connect bill copy data to unlock leakage detection and savings recommendations.
          </div>
        </div>
        <button style={{ padding: '8px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#fff', color: '#1c5af4', flexShrink: 0, marginLeft: '24px' }}>
          Unlock Advanced →
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Total portfolio value" value={inr(totalBill)}  sub={`${totalStates} states · ${totalCAs} active CAs`}        subColor="#858ea2" borderColor="#1c5af4" />
        <SummaryCard label="Avg bill per CA"        value={inr(avgBill)}   sub="per billing period · all CAs"                              subColor="#858ea2" borderColor="#1c5af4" />
        <SummaryCard
          label="Period-over-Period Trend"
          value={`${momChange > 0 ? '+' : ''}${momChange}%`}
          sub={`${momLabel} vs ${momPrevLabel}${appState.stateF !== 'all' ? ` · ${appState.stateF}` : ''}`}
          subColor={momChange > 5 ? '#A32D2D' : momChange < 0 ? '#3B6D11' : '#854F0B'}
          borderColor={momChange > 5 ? '#E24B4A' : momChange < 0 ? '#1A7A45' : '#EF9F27'}
        />
        <SummaryCard label="Bills due this month"   value={`${billsDueCount}`} sub={`${inr(billsDueAmount)} · next 30 days`}              subColor="#A32D2D" borderColor="#E24B4A" />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

        {/* Monthly spend trend */}
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '4px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Monthly spend trend</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '12px' }}>Total bill amount per month · Apr 2024 – Mar 2025</div>
          <div style={{ position: 'relative', width: '100%', height: '160px' }}>
            <canvas ref={spendTrendRef}></canvas>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
            {[
              { label: 'Lowest month', value: inr(minVal), color: '#36b37e' },
              { label: 'Monthly avg',  value: inr(Math.round(totalBill / data.length)), color: '#192744' },
              { label: 'Peak month',   value: inr(maxVal), color: '#1c5af4' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f5f6fa', borderRadius: '4px', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment status */}
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '4px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Payment status</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '16px' }}>Current period · {totalCAs} total CAs</div>
          {[
            { label: 'Paid',    count: paid,    pct: Math.round(paid/totalCAs*100),    color: '#36b37e', bg: '#e8f8f1' },
            { label: 'Pending', count: pending, pct: Math.round(pending/totalCAs*100), color: '#f59e0b', bg: '#fef3c7' },
            { label: 'Hold',    count: hold,    pct: Math.round(hold/totalCAs*100),    color: '#8b5cf6', bg: '#f3e8ff' },
            { label: 'Overdue', count: overdue, pct: Math.round(overdue/totalCAs*100), color: '#ec2127', bg: '#fce8e8' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: '14px' }}>
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
              <div style={{ height: '6px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: item.color, width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', padding: '10px 12px', background: '#fce8e8', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#ec2127', fontWeight: 500 }}>⚠ {overdue} CAs overdue</span>
            <span style={{ fontSize: '11px', color: '#ec2127' }}>Immediate attention needed</span>
          </div>
        </div>
      </div>

      {/* Top performers ��� tabbed: States / Branches / CAs */}
      <TopPerformers totalBill={totalBill} appState={appState} />
    </div>
  )
}

function BasicLocations({ appState }: BasicSectionProps) {
  const allCAs    = Object.values(CAS).flat()
  const totalCAs  = allCAs.length
  const showBranches = appState.stateF !== 'all'
  const [rankTab, setRankTab] = useState<'states' | 'branches' | 'cas'>('states')

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

  // If a state is selected, show branches of that state instead of all states
  const locationRows = showBranches
    ? (BRANCHES[appState.stateF] ?? []).map(br => {
        const cas   = CAS[br]?.length ?? 0
        const bills = (CAS[br] ?? []).reduce((s, ca) =>
          s + getCABills(ca, 'monthly').reduce((b, d) => b + d.totalBill, 0), 0)
        const seed  = br.charCodeAt(0) % 20
        const prior = Math.round(bills * (0.88 + seed * 0.015))
        const yoy   = Math.round((bills - prior) / Math.max(prior, 1) * 100)
        return { name: br, cas, branches: 0, total: bills, priorTotal: prior, yoy, isOutlier: Math.abs(yoy) > 10 }
      }).sort((a, b) => b.total - a.total)
    : stateData.map(d => ({ name: d.state, cas: d.cas, branches: (BRANCHES[d.state] ?? []).length, total: d.total, priorTotal: d.priorTotal, yoy: d.yoy, isOutlier: d.isOutlier }))

  const branchRows = Object.entries(BRANCHES)
    .filter(([st]) => appState.stateF === 'all' || st === appState.stateF)
    .flatMap(([st, brs]) => brs.map(br => {
      const total = (CAS[br] ?? []).reduce((s, ca) =>
        s + getCABills(ca, 'monthly').reduce((b, d) => b + d.totalBill, 0), 0)
      const cas = CAS[br]?.length ?? 0
      const seed = br.charCodeAt(0) % 20
      const prior = Math.round(total * (0.88 + seed * 0.015))
      const yoy = Math.round((total - prior) / Math.max(prior, 1) * 100)
      return { name: br, sub: st, cas, total, yoy, isOutlier: Math.abs(yoy) > 10 }
    })).sort((a, b) => b.total - a.total)

  const caRows = Object.entries(CAS)
    .filter(([br]) => appState.branchF === 'all' || br === appState.branchF)
    .flatMap(([br, cas]) => cas
      .filter(ca => appState.caF === 'all' || ca === appState.caF)
      .map(ca => {
        const total = getCABills(ca, 'monthly').reduce((s, d) => s + d.totalBill, 0)
        const seed = ca.charCodeAt(0) % 20
        const prior = Math.round(total * (0.88 + seed * 0.015))
        const yoy = Math.round((total - prior) / Math.max(prior, 1) * 100)
        return { name: ca, sub: br, cas: 1, total, yoy, isOutlier: Math.abs(yoy) > 10 }
      })
    ).sort((a, b) => b.total - a.total).slice(0, 20)

  const portfolioTotal = showBranches 
    ? locationRows.reduce((s, d) => s + d.total, 0)
    : stateData.reduce((s, d) => s + d.total, 0)
  const outliers       = stateData.filter(d => d.isOutlier)
  const topItem        = showBranches ? locationRows[0] : stateData[0]
  const avgSpend       = showBranches 
    ? Math.round(portfolioTotal / locationRows.length)
    : Math.round(portfolioTotal / STATES.length)

  return (
    <div>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Top location"          value={(topItem as any).name ?? (topItem as any).state ?? ''}                  sub={`${inr(topItem.total)} · ${Math.round(topItem.total/portfolioTotal*100)}% of portfolio`} subColor="#185FA5" borderColor="#2500D7" />
        <SummaryCard label="Avg spend per location" value={inr(avgSpend)}                sub={showBranches ? `${appState.stateF} · current period` : "across all states · current period"}                                                          subColor="#858ea2" borderColor="#185FA5" />
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderLeft: '3px solid #185FA5', borderRadius: '4px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '12px', color: '#858ea2', fontWeight: 500 }}>Top branch</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branchRows[0]?.name ?? '—'}</div>
            {branchRows.length > 1 && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', flexShrink: 0 }}>
                +{branchRows.length - 1} more
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#185FA5' }}>{branchRows[0] ? '₹' + (branchRows[0].total / 100000).toFixed(1) + 'L · ' + branchRows[0].sub : 'No data'}</div>
          {branchRows.length > 1 && (
            <button onClick={() => setRankTab('branches')} style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#1c5af4', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}>
              View all {branchRows.length} branches →
            </button>
          )}
        </div>
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderLeft: '3px solid #1A7A45', borderRadius: '4px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '12px', color: '#858ea2', fontWeight: 500 }}>Top CA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caRows[0]?.name ?? '—'}</div>
            {caRows.length > 1 && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: '#EAF3DE', color: '#27500A', flexShrink: 0 }}>
                +{caRows.length - 1} more
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#3B6D11' }}>{caRows[0] ? '₹' + (caRows[0].total / 100000).toFixed(1) + 'L · ' + caRows[0].sub : 'No data'}</div>
          {caRows.length > 1 && (
            <button onClick={() => setRankTab('cas')} style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#1c5af4', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}>
              View all {caRows.length} CAs →
            </button>
          )}
        </div>
      </div>

      {/* Heatmap or branches listing based on filter */}
      {!showBranches && (
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '16px', padding: '24px', marginBottom: '12px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', marginBottom: '3px' }}>State wise spend</div>
              <div style={{ fontSize: '13px', color: '#858ea2' }}>Apr 2024 – Mar 2025</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#858ea2' }}>
              <span>Low</span>
              {['#ebebff','#c4bfff','#9e97ff','#5a52d5','#2d2b6b'].map(c => (
                <div key={c} style={{ width: '28px', height: '28px', borderRadius: '6px', background: c }} />
              ))}
              <span style={{ fontWeight: 600, color: '#192744' }}>High</span>
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
            {stateData.map((s, i) => {
              const intensity = s.total / stateData[0].total
              const bg = intensity > 0.90 ? '#2d2b6b'
                       : intensity > 0.75 ? '#5a52d5'
                       : intensity > 0.60 ? '#7b74e8'
                       : intensity > 0.45 ? '#a09aef'
                       : intensity > 0.30 ? '#c4bfff'
                       : '#ebebff'
              const isDark   = intensity > 0.55
              const textMain = isDark ? '#fff' : '#192744'
              const textSub  = isDark ? 'rgba(255,255,255,0.65)' : '#858ea2'
              const avgPerCA = Math.round(s.total / Math.max(s.cas, 1) / 100000 * 10) / 10
              return (
                <div key={s.state}
                  onClick={() => {}}
                  style={{ background: bg, borderRadius: '12px', padding: '20px 18px', cursor: 'pointer', transition: 'opacity 0.15s', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.88'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: textMain, marginBottom: '4px' }}>{s.state}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: textMain, letterSpacing: '-0.5px', marginBottom: '10px' }}>
                      ₹{(s.total / 100000).toFixed(1)}L
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: textSub }}>
                    {s.cas} CAs · ₹{avgPerCA}L/CA
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#858ea2' }}>
              {stateData.length} states · Total ₹{(portfolioTotal / 100000).toFixed(1)}L
            </span>
            <span style={{ fontSize: '12px', color: '#858ea2' }}>Click any tile to drill down</span>
          </div>

        </div>
      )}

      {/* Ranked table */}
      <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Top Contributors (by Total Bill)</div>
          </div>
          <div style={{ display: 'flex', background: '#f5f6fa', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            {([
              { id: 'states',   label: 'By State'   },
              { id: 'branches', label: 'By Branch'  },
              { id: 'cas',      label: 'By CA'      },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setRankTab(t.id)} style={{
                padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: rankTab === t.id ? '#fff' : 'transparent',
                color: rankTab === t.id ? '#192744' : '#858ea2',
                boxShadow: rankTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['#', rankTab === 'states' ? 'State' : rankTab === 'branches' ? 'Branch' : 'CA Number', 'CAs', 'Total bill', 'Avg bill', 'Change', 'Trend'].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #f3f4f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rankTab === 'states' ? locationRows : rankTab === 'branches' ? branchRows : caRows).map((row, i) => (
              <tr key={row.name}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f5f6fa'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', color: i < 3 ? '#1c5af4' : '#858ea2', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 500, color: '#192744', fontFamily: rankTab === 'cas' ? 'monospace' : 'inherit' }}>{row.name}</div>
                  <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '1px' }}>{(row as any).sub}</div>
                </td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', color: '#858ea2' }}>{row.cas}</td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#192744' }}>₹{(row.total / 100000).toFixed(1)}L</td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', color: '#858ea2' }}>₹{(row.total / Math.max(row.cas, 1) / 100000).toFixed(1)}L</td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                    background: row.yoy > 10 ? '#fce8e8' : row.yoy < -10 ? '#fce8e8' : '#f5f5f4',
                    color: row.yoy > 10 ? '#ec2127' : row.yoy < -10 ? '#ec2127' : '#6b6b67' }}>
                    {row.yoy > 0 ? '+' : ''}{row.yoy}%
                  </span>
                </td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                    background: row.isOutlier ? (row.yoy > 0 ? '#fce8e8' : '#fce8e8') : '#e8f8f1',
                    color: row.isOutlier ? '#ec2127' : '#36b37e' }}>
                    {row.isOutlier ? (row.yoy > 0 ? '⚠ Spike' : '⚠ Drop') : '✓ Normal'}
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

function BasicTrends({ appState }: BasicSectionProps) {
  const trendRef   = useRef<HTMLCanvasElement>(null)
  const caRef      = useRef<HTMLCanvasElement>(null)
  const caGrowthRef   = useRef<HTMLCanvasElement>(null)
  const trendChart = useRef<Chart | null>(null)
  const caChart    = useRef<Chart | null>(null)
  const caGrowthChart = useRef<Chart | null>(null)

  const data        = getFilteredBills('monthly', appState.stateF, appState.branchF, appState.caF)
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

  // CA activity — count of active CAs per month
  const allCAs = Object.values(CAS).flat()
  // Simulate CA additions — start with 70% active, grow to 100% by month 12
  const totalCAsCount = allCAs.length
  const caCounts = data.map((_, mi) => {
    const base = Math.round(totalCAsCount * 0.70)
    const growth = Math.round((totalCAsCount - base) * (mi / 11))
    const noise = Math.round((((mi * 13 + 7) % 5) - 2) * 1.5)
    return Math.min(totalCAsCount, base + growth + noise)
  })
  // Prior year — 80-90% of current year counts with similar growth pattern
  const priorCACounts = data.map((_, mi) => {
    const base = Math.round(totalCAsCount * 0.60)
    const growth = Math.round((Math.round(totalCAsCount * 0.85) - base) * (mi / 11))
    const noise = Math.round((((mi * 11 + 3) % 5) - 2) * 1.5)
    return Math.max(0, base + growth + noise)
  })

  // CA growth — cumulative CA count over time
  const cumulativeCAs     = [112, 112, 124, 124, 132, 133, 133, 144, 135, 145, 155, 157]
  const priorCumulativeCAs = [98, 103, 100, 106, 110, 121, 120, 121, 124, 129, 129, 137]

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

    return () => {
      if (trendChart.current) trendChart.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (!caRef.current) return
    const ctx = caRef.current.getContext('2d')
    if (!ctx) return
    if (caChart.current) caChart.current.destroy()
    caChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Current year',
            data: caCounts,
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
            data: priorCACounts,
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
              label: item => `  ${item.dataset.label}: ${item.raw} CAs`,
              footer: items => {
                const curr  = items.find(i => i.datasetIndex === 0)?.raw as number ?? 0
                const prior = items.find(i => i.datasetIndex === 1)?.raw as number ?? 0
                const chg   = Math.round((curr - prior) / Math.max(prior, 1) * 100)
                return `YoY: ${chg > 0 ? '+' : ''}${chg}%`
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
          y: {
            border: { display: false },
            grid: { color: '#f3f4f6' },
            min: Math.floor(Math.min(...priorCACounts) * 0.9),
            max: Math.ceil(Math.max(...caCounts) * 1.1),
            ticks: {
              color: '#858ea2',
              font: { size: 11 },
              callback: (v: any) => Number.isInteger(Number(v)) ? v + ' CAs' : '',
            },
          },
        },
      },
    })
    return () => { if (caChart.current) caChart.current.destroy() }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!caGrowthRef.current) return
      const ctx = caGrowthRef.current.getContext('2d')
      if (!ctx) return
      if (caGrowthChart.current) caGrowthChart.current.destroy()
      caGrowthChart.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Current year',
              data: cumulativeCAs,
              borderColor: '#2500D7',
              backgroundColor: 'rgba(37,0,215,0.06)',
              borderWidth: 2.5,
              pointBackgroundColor: '#2500D7',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.35,
              fill: true,
            },
            {
              label: 'Prior year',
              data: priorCumulativeCAs,
              borderColor: '#C4BFFF',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [5, 4],
              pointBackgroundColor: '#C4BFFF',
              pointRadius: 3,
              pointHoverRadius: 5,
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
            legend: {
              display: true,
              position: 'top' as const,
              align: 'end' as const,
              labels: {
                boxWidth: 24,
                boxHeight: 2,
                color: '#858ea2',
                font: { size: 12 },
                usePointStyle: false,
                padding: 16,
              },
            },
            tooltip: {
              backgroundColor: '#192744',
              titleColor: '#fff',
              bodyColor: 'rgba(255,255,255,0.85)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: item => `  ${item.dataset.label}: ${item.raw} CAs`,
                footer: items => {
                  const curr  = items.find(i => i.datasetIndex === 0)?.raw as number ?? 0
                  const prior = items.find(i => i.datasetIndex === 1)?.raw as number ?? 0
                  const chg   = Math.round((curr - prior) / Math.max(prior, 1) * 100)
                  return `YoY: ${chg > 0 ? '+' : ''}${chg}%`
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: '#858ea2', font: { size: 11 } },
            },
            y: {
              border: { display: false },
              grid: { color: '#f3f4f6' },
              min: Math.floor(Math.min(...priorCumulativeCAs) * 0.88),
              ticks: {
                color: '#858ea2',
                font: { size: 11 },
                callback: (v: any) => v + ' CAs',
              },
            },
          },
        },
      })
    }, 50)
    return () => {
      clearTimeout(timer)
      if (caGrowthChart.current) caGrowthChart.current.destroy()
    }
  }, [appState.stateF, appState.branchF, appState.caF])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px' }}>
        <SummaryCard label="Overall YoY change"  value={`${overallYoy > 0 ? '+' : ''}${overallYoy}%`} sub="avg monthly spend vs prior year"          subColor={overallYoy > 0 ? '#854F0B' : '#3B6D11'} borderColor={overallYoy > 0 ? '#EF9F27' : '#1A7A45'} />
        <SummaryCard label="Peak month"          value={labels[maxMonthIdx]}                           sub={`${inr(monthlyTotals[maxMonthIdx])} · highest spend`} subColor="#A32D2D" borderColor="#E24B4A" />
        <SummaryCard label="Lowest month"        value={labels[minMonthIdx]}                           sub={`${inr(monthlyTotals[minMonthIdx])} · lowest spend`}  subColor="#3B6D11" borderColor="#1A7A45" />
        <SummaryCard label="Monthly average"     value={inr(avgCurrent)}                               sub={`vs ${inr(avgPrior)} prior year`}                      subColor="#185FA5" borderColor="#185FA5" />
      </div>

      {/* Current vs prior year trend */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Monthly spend — current vs prior year</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>
              {appState.stateF !== 'all'
                ? `${appState.stateF}${appState.branchF !== 'all' ? ` · ${appState.branchF}` : ''} · current vs prior period`
                : 'All states · current vs prior period · monthly'}
            </div>
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

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', margin: '20px 0' }} />

        {/* Active CAs chart header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>CA additions — current vs prior year</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>
              {appState.stateF !== 'all'
                ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') + ' · active CAs per month'
                : 'All states · active CAs per month'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#6b6b67', flexShrink: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '2.5px', background: '#2500D7', display: 'inline-block', borderRadius: '1px' }} />Current year
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '1.5px', background: '#C4BFFF', display: 'inline-block', borderRadius: '1px' }} />Prior year
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <canvas ref={caRef}></canvas>
        </div>
      </div>

      {/* CA addition chart */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>CA additions — current vs prior year</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '12px' }}>
          {appState.stateF !== 'all'
            ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') + ' · active CAs per month'
            : 'All states · active CAs per month'}
        </div>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <canvas ref={caGrowthRef}></canvas>
        </div>
      </div>

    </div>
  )
}

function BasicDueDates({ appState }: BasicSectionProps) {
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

function TopPerformers({ totalBill, appState }: { totalBill: number; appState: BasicSectionProps['appState'] }) {
  const [tab, setTab] = useState<'states' | 'branches' | 'cas'>('states')

  const stateRows = STATES.map(st => {
    const branches = BRANCHES[st] ?? []
    const cas      = branches.reduce((s, br) => s + (CAS[br]?.length ?? 0), 0)
    const total    = getStateBills(st, 'monthly').reduce((s, d) => s + d.totalBill, 0)
    return { name: st, branches: branches.length, cas, total }
  }).sort((a, b) => b.total - a.total)

  const branchRows = Object.entries(BRANCHES)
    .filter(([st]) => appState.stateF === 'all' || st === appState.stateF)
    .flatMap(([st, brs]) =>
      brs.map(br => ({
        name:  br,
        state: st,
        cas:   CAS[br]?.length ?? 0,
        total: (CAS[br] ?? []).reduce((s, ca) =>
          s + getCABills(ca, 'monthly').reduce((b, d) => b + d.totalBill, 0), 0),
      }))
    ).sort((a, b) => b.total - a.total).slice(0, 8)

  const caRows = Object.entries(CAS)
    .filter(([br]) => appState.branchF === 'all' || br === appState.branchF)
    .flatMap(([br, cas]) =>
      cas
        .filter(ca => appState.caF === 'all' || ca === appState.caF)
        .map(ca => ({
          name:   ca,
          branch: br,
          total:  getCABills(ca, 'monthly').reduce((s, d) => s + d.totalBill, 0),
        }))
    ).sort((a, b) => b.total - a.total).slice(0, 8)

  const BAR_COLORS = ['#1c5af4', '#1c5af4', '#7B6FE8', '#7B6FE8', '#c4bfff', '#c4bfff', '#c4bfff', '#c4bfff']
  const maxTotal = tab === 'states'
    ? (stateRows[0]?.total ?? 1)
    : tab === 'branches'
    ? (branchRows[0]?.total ?? 1)
    : (caRows[0]?.total ?? 1)

  return (
    <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '4px', padding: '16px 18px' }}>

      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Top by bill amount</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>Highest spend · Apr 2024 – Mar 2025</div>
        </div>
        <div style={{ display: 'flex', background: '#f5f6fa', borderRadius: '4px', padding: '2px' }}>
          {([
            { id: 'states',   label: 'By State'   },
            { id: 'branches', label: 'By Branch'  },
            { id: 'cas',      label: 'By CA'      },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '4px 12px', borderRadius: '3px', fontSize: '12px', fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#192744' : '#858ea2',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* State rows */}
      {tab === 'states' && stateRows.map((r, i) => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f6fa'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
          <div style={{ width: '18px', fontSize: '11px', fontWeight: 700, color: i < 2 ? '#1c5af4' : '#858ea2', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744' }}>{r.name}</div>
            <div style={{ fontSize: '10px', color: '#858ea2', marginTop: '1px' }}>{r.branches} branches · {r.cas} CAs</div>
          </div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: BAR_COLORS[i] ?? '#c4bfff', width: `${Math.round(r.total / maxTotal * 100)}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{inr(r.total)}</div>
            <div style={{ fontSize: '10px', color: '#858ea2' }}>{Math.round(r.total / totalBill * 100)}% of portfolio</div>
          </div>
        </div>
      ))}

      {/* Branch rows */}
      {tab === 'branches' && branchRows.map((r, i) => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f6fa'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
          <div style={{ width: '18px', fontSize: '11px', fontWeight: 700, color: i < 2 ? '#1c5af4' : '#858ea2', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: '10px', color: '#858ea2', marginTop: '1px' }}>{r.state} · {r.cas} CAs</div>
          </div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: BAR_COLORS[i] ?? '#c4bfff', width: `${Math.round(r.total / maxTotal * 100)}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{inr(r.total)}</div>
            <div style={{ fontSize: '10px', color: '#858ea2' }}>{Math.round(r.total / totalBill * 100)}% of portfolio</div>
          </div>
        </div>
      ))}

      {/* CA rows */}
      {tab === 'cas' && caRows.map((r, i) => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f6fa'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
          <div style={{ width: '18px', fontSize: '11px', fontWeight: 700, color: i < 2 ? '#1c5af4' : '#858ea2', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744', fontFamily: 'monospace' }}>{r.name}</div>
            <div style={{ fontSize: '10px', color: '#858ea2', marginTop: '1px' }}>{r.branch}</div>
          </div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: BAR_COLORS[i] ?? '#c4bfff', width: `${Math.round(r.total / maxTotal * 100)}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{inr(r.total)}</div>
            <div style={{ fontSize: '10px', color: '#858ea2' }}>{Math.round(r.total / totalBill * 100)}% of portfolio</div>
          </div>
        </div>
      ))}

    </div>
  )
}
