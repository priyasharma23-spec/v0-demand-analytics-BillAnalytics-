'use client'
import { useState, useEffect, useRef } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
import { SummaryCard } from './SummaryCard'
import { getFilteredBills, inr, inrK, STATES, BRANCHES, CAS, getStateBills, getCABills } from '@/lib/calculations'

interface BasicAnalyticsShellProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
  section?: string
  analyticsMode?: 'basic' | 'advanced'
}

type BasicSectionProps = {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

const BASIC_SECTIONS = [
  { id: 'summary',   label: 'Summary'    },
  { id: 'locations', label: 'Locations'  },
  { id: 'trends',    label: 'Trends'     },
  { id: 'billers',   label: 'Billers'    },
]

export default function BasicAnalyticsShell({ appState, section: sectionProp, analyticsMode = 'basic' }: BasicAnalyticsShellProps) {
  const [sectionState, setSectionState] = useState('summary')
  const section = sectionProp ?? sectionState
  const setSection = setSectionState

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh' }}>


      {/* Section content */}
      <div style={{ padding: '20px' }}>
        {section === 'summary' && <BasicSummary appState={appState} analyticsMode={analyticsMode} />}
        {section === 'locations' && <BasicLocations appState={appState} analyticsMode={analyticsMode} />}
        {section === 'trends' && <BasicTrends appState={appState} />}
        {section === 'billers' && <BasicBillers appState={appState} analyticsMode={analyticsMode} />}
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

function BasicSummary({ appState, analyticsMode = 'basic' }: BasicSectionProps & { analyticsMode?: 'basic' | 'advanced' }) {
  const [activeWeek, setActiveWeek] = useState<number | null>(null)
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
  const faultyMeterCount = allCAs.filter((ca, ci) => {
    const bills = getCABills(ca, 'monthly')
    const latestIdx = bills.length - 1
    const latest = bills[latestIdx]
    const prior  = bills[latestIdx - 1]
    const isFaultyLatest = ((ci * 7 + latestIdx * 13) % 33 === 0)
    const isSameAsPrior  = prior && latest && Math.abs(latest.kwh - prior.kwh) < 100
    return isFaultyLatest || isSameAsPrior
  }).length
  const stateAmounts = STATES.map(st => ({
    state: st,
    total: getStateBills(st, 'monthly').reduce((s, d) => s + d.totalBill, 0),
    cas:   (BRANCHES[st] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0),
  })).sort((a, b) => b.total - a.total)

  // Monthly data for chart
  const monthlyData = data

  // Count CAs that have a bill each month
  const caCounts = data.map((_, mi) =>
    allCAs.filter(ca => {
      const bill = getCABills(ca, 'monthly')[mi]
      return bill && bill.totalBill > 0
    }).length
  )

  // Due date calendar and weekly capital plan data
  // State-level due days based on real utility billing cycles
  const STATE_DUE_DAYS: Record<string, number> = {
    'Maharashtra': 7,
    'Karnataka':   10,
    'Tamil Nadu':  12,
    'Gujarat':     8,
    'Delhi':       5,
    'Rajasthan':   15,
    'Uttar Pradesh': 18,
    'West Bengal': 20,
  }
  const branchToState: Record<string, string> = {}
  Object.entries(BRANCHES).forEach(([state, branches]: [string, string[]]) => {
    branches.forEach((br: string) => { branchToState[br] = state })
  })
  const caToState: Record<string, string> = {}
  Object.entries(CAS).forEach(([branch, cas]: [string, string[]]) => {
    cas.forEach((ca: string) => { caToState[ca] = branchToState[branch] ?? 'Maharashtra' })
  })

  const today = new Date()

  const caSchedule = allCAs.map((ca) => {
    const state   = caToState[ca] ?? 'Maharashtra'
    const dueDay  = STATE_DUE_DAYS[state] ?? 10
    const seed    = ca.charCodeAt(0) + ca.charCodeAt(ca.length - 1)
    const bills   = getCABills(ca, 'monthly')
    const latestBill = bills[bills.length - 1]
    const billAmt = latestBill ? latestBill.totalBill : Math.round(180000 + (seed % 50) * 4200)
    const isPaid    = (seed % 10) < 6
    const isOverdue = !isPaid && (latestBill ? latestBill.latePayment > 0 : (seed % 10) < 8)
    const isDueSoon = !isPaid && !isOverdue
    const thisMonthDue  = new Date(today.getFullYear(), today.getMonth(), dueDay)
    const nextMonthDue  = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
    const dueDate       = thisMonthDue >= today ? thisMonthDue : nextMonthDue
    const daysUntilDue  = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const rollingWeek   = Math.min(Math.max(Math.floor(daysUntilDue / 7), 0), 3)
    return { ca, state, dueDay, dueDate, billAmt, isPaid, isOverdue, isDueSoon, rollingWeek, daysUntilDue }
  })

  const getWeekLabel = (offset: number) => {
    const start = new Date(today)
    start.setDate(today.getDate() + offset * 7 - today.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return offset === 0 ? `This week (${fmt(start)}–${fmt(end)})` : offset === 1 ? `Next week (${fmt(start)}–${fmt(end)})` : `Week ${offset + 1} (${fmt(start)}–${fmt(end)})`
  }

  const weeks = [0, 1, 2, 3].map(offset => ({
    label: getWeekLabel(offset),
    offset,
    cas: caSchedule.filter(c => c.rollingWeek === offset),
  }))

  const weeklyAmounts = weeks.map(w => {
    const unpaid  = w.cas.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
    const overdue = w.cas.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
    return { ...w, unpaid, overdue, count: w.cas.length, unpaidCount: w.cas.filter(c => !c.isPaid).length }
  })

  const byDay: Record<number, typeof caSchedule> = {}
  caSchedule.forEach(ca => {
    const day = ca.dueDay
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(ca)
  })

  const totalUnpaid = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #1c5af4 0%, #7B6FE8 100%)', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '5px' }}>Bill Payments — Basic Analytics</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', maxWidth: '480px' }}>
            Portfolio overview across {totalStates} states · {totalCAs} CAs · Apr 2024 – Mar 2025. Connect bill copy data to unlock leakage detection and savings recommendations.
          </div>
        </div>
        <button style={{ padding: '8px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#fff', color: '#1c5af4', flexShrink: 0, marginLeft: '24px' }}>
          Unlock Advanced →
        </button>
      </div>

      {/* KPI bar — single unified card with dividers */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Portfolio value',       value: inr(totalBill),                                                                          sub: `${totalStates} states · ${totalCAs} active CAs`,                                                 accent: '#4F46E5' },
          { label: 'Avg bill per CA',        value: inr(avgBill),                                                                            sub: 'per billing period',                                                                               accent: '#111827' },
          { label: 'Paid via EnKash',           value: `${Math.round(paid / totalCAs * 100)}%`,                                             sub: `${paid} CAs on platform`,                                                                                                           accent: '#15803D' },
          { label: 'Due this month',         value: `${billsDueCount}`,                                                                    sub: `${inr(billsDueAmount)} · next 30 days`,                                                          accent: '#B45309' },
        ].map((kpi, i) => (
          <div key={kpi.label} style={{ flex: i === 0 ? 1.4 : 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: kpi.accent, letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — two column: left (chart + funnel + top states) | right (status panel) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

          {/* Bill generation funnel */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bill generation funnel</div>
              <div style={{ fontSize: '12px', color: '#858ea2' }}>Overall conversion: <span style={{ fontWeight: 700, color: '#15803D' }}>60%</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', marginBottom: '16px' }}>
              {[
                { label: 'Active CAs',      value: totalCAs,                          pct: 100,  color: '#4F46E5', bg: '#EEF2FF', bd: '#C7D2FE' },
                { label: 'Bills generated', value: Math.round(totalCAs * 0.757),      pct: 75.7, color: '#1c5af4', bg: '#EFF6FF', bd: '#BFDBFE' },
                { label: 'Bills paid',      value: Math.round(totalCAs * 0.60),       pct: 60,   color: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
              ].map((step, i) => (
                <div key={step.label} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                  <div style={{ flex: 1, background: step.bg, border: `1px solid ${step.bd}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: step.color, lineHeight: 1 }}>{step.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: step.color, marginTop: '5px' }}>{step.label}</div>
                    <div style={{ fontSize: '11px', color: step.color, opacity: 0.6, marginTop: '2px' }}>{step.pct}% of {totalCAs}</div>
                    {i < 2 && (
                      <div style={{ position: 'absolute', top: '50%', right: '-22px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', zIndex: 2 }}>
                        <div style={{ background: i === 0 ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${i === 0 ? '#FDE68A' : '#FECACA'}`, borderRadius: '5px', padding: '1px 5px', fontSize: '10px', fontWeight: 700, color: i === 0 ? '#B45309' : '#B91C1C', whiteSpace: 'nowrap' }}>
                          −{i === 0 ? Math.round(totalCAs * 0.243) : Math.round(totalCAs * 0.157)}
                        </div>
                        <div style={{ color: '#858ea2', fontSize: '12px' }}>→</div>
                      </div>
                    )}
                  </div>
                  {i < 2 && <div style={{ width: '16px', flexShrink: 0 }}/>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F3F4F6', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }}/>
              <div style={{ fontSize: '12px', color: '#858ea2' }}><span style={{ fontWeight: 600, color: '#192744' }}>{Math.round(totalCAs * 0.068)} CAs</span> on approval hold — excluded from paid count</div>
            </div>
          {/* Due date calendar */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '16px 18px', marginTop: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Due date calendar</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Bills due per day · current month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarDays.map(day => {
                const dayCAs  = byDay[day] ?? []
                const hasOver = dayCAs.some((c: any) => c.isOverdue)
                const hasSoon = dayCAs.some((c: any) => c.isDueSoon)
                const bg      = dayCAs.length === 0 ? '#F9FAFB' : hasOver ? '#FEF2F2' : hasSoon ? '#FFFBEB' : '#F0FDF4'
                const border  = dayCAs.length === 0 ? '#E5E7EB' : hasOver ? '#FECACA' : hasSoon ? '#FDE68A' : '#BBF7D0'
                const textCol = dayCAs.length === 0 ? '#9CA3AF' : hasOver ? '#B91C1C' : hasSoon ? '#B45309' : '#15803D'
                return (
                  <div key={day} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: '6px', padding: '6px 4px', textAlign: 'center', minHeight: '44px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textCol }}>{day}</div>
                    {dayCAs.length > 0 && <div style={{ fontSize: '9px', color: textCol, marginTop: '1px' }}>{dayCAs.length} CA{dayCAs.length > 1 ? 's' : ''}</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '11px', color: '#858ea2', flexWrap: 'wrap' }}>
              {[{ color: '#FECACA', label: 'Overdue' },{ color: '#FDE68A', label: 'Due soon' },{ color: '#BBF7D0', label: 'Paid' },{ color: '#E5E7EB', label: 'No bills' }].map(item => (
                <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />{item.label}
                </span>
              ))}
            </div>
          </div>
          {/* Weekly capital plan */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Weekly capital plan</div>
                <div style={{ fontSize: '12px', color: '#858ea2' }}>Current month · plan ahead</div>
              </div>
              <div style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: '10px', padding: '6px 14px', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Month total</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#4338CA' }}>{inr(totalUnpaid)}</div>
              </div>
            </div>
            <div style={{ padding: '16px 20px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                {weeklyAmounts.map((w: any, wi: number) => {
                  const maxAmt   = Math.max(...weeklyAmounts.map((x: any) => x.unpaid))
                  const totalH   = Math.round((w.unpaid / Math.max(maxAmt,1)) * 80)
                  const overdueH = Math.round((w.overdue / Math.max(maxAmt,1)) * 80)
                  const safeH    = totalH - overdueH
                  const hasOD    = w.overdue > 0
                  const isAct    = activeWeek === wi
                  return (
                    <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                      onMouseEnter={() => setActiveWeek(wi)} onMouseLeave={() => setActiveWeek(null)}>
                      <div style={{ fontSize: '11px', fontWeight: isAct ? 600 : 400, color: isAct ? '#192744' : '#858ea2' }}>{inr(w.unpaid)}</div>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '72px', borderRadius: '5px', overflow: 'hidden', background: isAct ? (hasOD ? '#FEF2F2' : '#EEF2FF') : '#F3F4F6' }}>
                        {safeH > 0 && <div style={{ height: safeH+'px', background: isAct ? '#7B6FE8' : '#C7D2FE' }} />}
                        {overdueH > 0 && <div style={{ height: overdueH+'px', background: isAct ? '#EF4444' : '#FECACA' }} />}
                      </div>
                      <div style={{ fontSize: '11px', color: isAct ? '#4F46E5' : '#858ea2' }}>W{wi+1}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ padding: '4px 12px 14px', display: 'flex', gap: '6px' }}>
              {weeklyAmounts.map((w: any, wi: number) => {
                const hasOD = w.overdue > 0
                const isAct = activeWeek === wi
                const pct   = Math.round(w.unpaid / Math.max(totalUnpaid,1) * 100)
                return (
                  <div key={wi} onClick={() => setActiveWeek(isAct ? null : wi)} style={{ flex: '1 1 0', minWidth: 0, background: isAct ? (hasOD ? '#FEF2F2' : '#EEF2FF') : '#fff', border: '1.5px solid '+(isAct ? (hasOD ? '#FECACA' : '#C7D2FE') : '#E5E7EB'), borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{w.label}</div>
                    <div style={{ fontSize: '11px', color: '#858ea2' }}>{w.count} bills</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: hasOD ? '#EF4444' : '#4338CA', margin: '4px 0' }}>{inr(w.unpaid)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#858ea2' }}>
                      <span>{w.unpaidCount} unpaid</span><span>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          </div>

        </div>

        {/* Right column — Status panel */}
        <div style={{ width: '450px', flexShrink: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Payment status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment status</div>
              <span style={{ fontSize: '11px', color: '#858ea2' }}>of {Math.round(totalCAs * 0.757)} approved</span>
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
              {[
                { pct: 60, color: '#22C55E' },
                { pct: 25, color: '#F59E0B' },
                { pct: 10, color: '#858ea2' },
                { pct: 5,  color: '#EF4444' },
                { pct: 4,  color: '#4F46E5' },
              ].map((s, i) => <div key={i} style={{ width: s.pct+'%', background: s.color, borderRadius: '99px' }}/>)}
            </div>
            {[
              { label: 'Paid',    count: Math.round(totalCAs*0.60), pct: 60, color: '#22C55E', textColor: '#15803D' },
              { label: 'Pending', count: Math.round(totalCAs*0.25), pct: 25, color: '#F59E0B', textColor: '#B45309' },
              { label: 'On hold', count: Math.round(totalCAs*0.10), pct: 10, color: '#858ea2', textColor: '#6B7280' },
              { label: 'Overdue',   count: Math.round(totalCAs*0.05), pct: 5,  color: '#EF4444', textColor: '#B91C1C' },
              { label: 'Adjusted', count: Math.round(totalCAs*0.04), pct: 4,  color: '#4F46E5', textColor: '#4338CA' },
            ].map((s, i, arr) => (
              <div key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#192744', cursor: 'pointer' }}>{s.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: s.textColor, lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: '11px', color: '#858ea2', width: '34px', textAlign: 'right' }}>{s.pct}%</div>
                </div>
                {i < arr.length - 1 && <div style={{ height: '1px', background: '#F3F4F6' }}/>}
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#F3F4F6' }}/>

          {/* Approval queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approval queue</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Pending',  count: 48,  textColor: '#B45309', bg: '#FFFBEB', bd: '#FDE68A' },
                { label: 'Approved', count: 312, textColor: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
                { label: 'On Hold',  count: 28,  textColor: '#6B7280', bg: '#F9FAFB', bd: '#E5E7EB' },
                { label: 'Rejected', count: 12,  textColor: '#B91C1C', bg: '#FEF2F2', bd: '#FECACA' },
              ].map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: a.bg, border: `1px solid ${a.bd}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: a.textColor, lineHeight: 1 }}>{a.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: a.textColor }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: '#F3F4F6' }}/>

          {/* Action required */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action required</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { label: 'Fetch failed',      sub: 'BBPS error · payment blocked',         count: 34,               tone: { bg: '#FEF2F2', bd: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
                { label: 'Not generated',     sub: 'Active CAs · no bill yet',             count: 170,              tone: { bg: '#FFFBEB', bd: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
                { label: 'Copy pending',      sub: 'Bill copy being fetched',               count: 62,               tone: { bg: '#EFF6FF', bd: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' } },
                { label: 'Duplicate bills',   sub: 'Same bill fetched more than once',     count: 8,                tone: { bg: '#FFFBEB', bd: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
                { label: 'Meter reading alert', sub: 'Zero or same as last month · check meter', count: faultyMeterCount, tone: { bg: '#FEF2F2', bd: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
              ].map(a => (
                <div key={a.label} style={{ padding: '10px 12px', background: a.tone.bg, border: `1px solid ${a.tone.bd}`, borderLeft: `3px solid ${a.tone.accent}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: a.tone.text }}>{a.label}</div>
                      <div style={{ fontSize: '12px', color: a.tone.text, opacity: 0.7 }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: a.tone.text, lineHeight: 1 }}>{a.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

function BasicLocations({ appState, analyticsMode = 'basic' }: BasicSectionProps & { analyticsMode?: 'basic' | 'advanced' }) {
  const allCAs    = Object.values(CAS).flat()
  const totalCAs  = allCAs.length
  const showBranches = appState.stateF !== 'all'
  const [rankTab, setRankTab] = useState<'states' | 'branches' | 'cas'>('states')
  const [hov, setHov] = useState<string|null>(null)
  const [sel, setSel] = useState<string|null>(null)
  const [spendHov, setSpendHov] = useState<string|null>(null)
  const [spendSel, setSpendSel] = useState<string|null>(null)
  const [selBranch, setSelBranch] = useState<string|null>(null)
  const [spendView, setSpendView] = useState<'all' | 'top' | 'bottom'>('all')
  const [drillPage, setDrillPage] = useState<'branches'|'cas'|'peak'|'lowest'|'avg'|'spend'|null>(null)

  // Per-state data
  const stateData = STATES.map(st => {
    const cas      = (BRANCHES[st] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0)
    const bills    = getStateBills(st, 'monthly')
    const total    = bills.reduce((s, d) => s + d.totalBill, 0)
    const avgBill  = Math.round(total / Math.max(cas, 1))
    const months   = bills.map(d => d.totalBill)
    // Simulate prior year — ±5-15% variance per state deterministically
    const seed     = st.charCodeAt(0) % 20
    const priorTotal = Math.round(total * (0.88 + seed * 0.015))
    const yoy      = Math.round((total - priorTotal) / Math.max(priorTotal, 1) * 100)
    const isOutlier = Math.abs(yoy) > 10
    return { state: st, cas, total, avgBill, months, priorTotal, yoy, isOutlier }
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
        const monthlyBills = (CAS[br] ?? []).reduce((acc, ca) => {
          const caBills = getCABills(ca, 'monthly')
          return acc.map((v, i) => v + (caBills[i]?.totalBill ?? 0))
        }, Array(12).fill(0))
        return { name: br, cas, branches: 0, total: bills, months: monthlyBills, priorTotal: prior, yoy, isOutlier: Math.abs(yoy) > 10 }
      }).sort((a, b) => b.total - a.total)
    : stateData.map(d => ({ name: d.state, cas: d.cas, branches: (BRANCHES[d.state] ?? []).length, total: d.total, months: d.months, priorTotal: d.priorTotal, yoy: d.yoy, isOutlier: d.isOutlier }))

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
        return { name: ca, sub: br, state: Object.entries(BRANCHES).find(([,brs]) => brs.includes(br))?.[0] ?? '', cas: 1, total, yoy, isOutlier: Math.abs(yoy) > 10 }
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

  // Drill-down variables
  const spendData = showBranches 
    ? Object.fromEntries(locationRows.map(r => [r.name, r]))
    : Object.fromEntries(stateData.map(r => [r.state, r]))
  const sd = spendSel ? spendData[spendSel] : { total: 0, months: [] }
  const peakMthIdx = sd && sd.months && (sd.months as number[]).length > 0 ? (sd.months as number[]).indexOf(Math.max(...(sd.months as number[]))) : 0
  const lowMthIdx = sd && sd.months && (sd.months as number[]).length > 0 ? (sd.months as number[]).indexOf(Math.min(...(sd.months as number[]))) : 0
  const avgPerBranch = spendSel && showBranches 
    ? Math.round((locationRows.find(r => r.name === spendSel)?.total || 0) / Math.max(BRANCHES[spendSel]?.length || 1, 1))
    : 0
  const mthLabels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

  return (
    <div>
      {/* Full-screen drill-down overlay */}
      {drillPage && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 50, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header with back button */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => setDrillPage(null)}
              style={{ background: 'none', border: 'none', color: '#1c5af4', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Back to {spendSel}
            </button>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {drillPage === 'branches' ? 'Branches' : drillPage === 'cas' ? 'Certified Agents' : drillPage === 'peak' ? 'Peak Month' : drillPage === 'lowest' ? 'Lowest Month' : drillPage === 'avg' ? 'Average / Branch' : 'Total Spend'}
            </div>
            <div style={{ width: '80px' }} />
          </div>
          {/* Content */}
          <div style={{ flex: 1, padding: '20px 24px' }}>
            {drillPage === 'branches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(BRANCHES[spendSel ?? ''] ?? []).map((br: string) => {
                  const brCAs = CAS[br] ?? []
                  const brTotal = brCAs.reduce((sum: number, ca: string) => {
                    const bills = getCABills(ca, 'monthly')
                    return sum + bills.reduce((s: number, d: any) => s + d.totalBill, 0)
                  }, 0)
                  const paidCAs = brCAs.filter((_: string, i: number) => (br.charCodeAt(0) + i) % 10 < 6).length
                  return (
                    <div key={br} style={{ background: '#f5f6fa', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>{br}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1c5af4' }}>{inr(brTotal)}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#858ea2' }}>{brCAs.length} CAs · {paidCAs} paid</div>
                    </div>
                  )
                })}
              </div>
            )}
            {drillPage === 'cas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(BRANCHES[spendSel ?? ''] ?? []).flatMap((br: string) => (CAS[br] ?? []).map((ca: string) => {
                  const bills = getCABills(ca, 'monthly')
                  const avg = bills.reduce((s: number, d: any) => s + d.totalBill, 0) / bills.length || 0
                  return (
                    <div key={ca} style={{ background: '#f5f6fa', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#192744', fontWeight: 600 }}>{ca}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1c5af4' }}>{inr(avg)}</div>
                    </div>
                  )
                }))}
              </div>
            )}
            {(drillPage === 'peak' || drillPage === 'lowest') && (
              <div style={{ color: '#858ea2', padding: '20px', textAlign: 'center' }}>
                {drillPage === 'peak' 
                  ? `${mthLabels[peakMthIdx]} had the highest spend at ₹${(sd.months[peakMthIdx] * 100000 / 100000).toFixed(1)}L`
                  : `${mthLabels[lowMthIdx]} had the lowest spend at ₹${(sd.months[lowMthIdx] * 100000 / 100000).toFixed(1)}L`}
              </div>
            )}
            {drillPage === 'avg' && (
              <div style={{ color: '#858ea2', padding: '20px', textAlign: 'center' }}>
                Average spend per branch: {inr(avgPerBranch)}
              </div>
            )}
            {drillPage === 'spend' && (
              <div style={{ color: '#858ea2', padding: '20px', textAlign: 'center' }}>
                Total spend Apr 24–Mar 25: {inr(sd.total * 100000)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary chips */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        <div style={{ flex: 1.4, padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top location</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(topItem as any).name ?? (topItem as any).state ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>{inr(topItem.total)} · {Math.round(topItem.total/portfolioTotal*100)}% of portfolio</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Avg spend per location</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px' }}>{inr(avgSpend)}</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>{showBranches ? appState.stateF + ' · current period' : 'across all states · current period'}</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top branch</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branchRows[0]?.name ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>{branchRows[0] ? '���' + (branchRows[0].total/100000).toFixed(1) + 'L' : 'No data'}</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top CA</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caRows[0]?.name ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>{caRows[0] ? '₹' + (caRows[0].total/100000).toFixed(1) + 'L' : 'No data'}</div>
        </div>
      </div>

      {/* Portfolio breakup */}
      {(() => {
        const COLORS = ['#1c5af4','#8b5cf6','#06b6d4','#6366f1','#f59e0b','#36b37e','#e53935','#f97316']
        const [pieHov, setPieHov] = useState<string|null>(null)
        const [pieMetric, setPieMetric] = useState<'cas'|'branches'>('cas')
        const rows = stateData.map((d, i) => ({
          name: d.state,
          cas: (BRANCHES[d.state] ?? []).reduce((s: number, br: string) => s + (CAS[br]?.length ?? 0), 0),
          branches: (BRANCHES[d.state] ?? []).length,
          color: COLORS[i % COLORS.length],
        }))
        const total = rows.reduce((s, r) => s + r[pieMetric], 0)
        const totalCAsAll = rows.reduce((s, r) => s + r.cas, 0)
        const totalBranchesAll = rows.reduce((s, r) => s + r.branches, 0)
        const CX = 130, CY = 130, R_OUTER = 100, R_INNER = 62
        const strokeW = R_OUTER - R_INNER
        const circ = 2 * Math.PI * ((R_OUTER + R_INNER) / 2)
        const gapAngle = (2 / circ) * 360
        let angle = -90
        const arcs = rows.map(r => {
          const pct = r[pieMetric] / Math.max(total, 1)
          const sweep = pct * 360 - gapAngle
          const startA = angle
          const endA = angle + sweep
          angle += pct * 360
          const toRad = (d: number) => (d * Math.PI) / 180
          const midR = (R_OUTER + R_INNER) / 2
          const x1 = CX + midR * Math.cos(toRad(startA))
          const y1 = CY + midR * Math.sin(toRad(startA))
          const x2 = CX + midR * Math.cos(toRad(endA))
          const y2 = CY + midR * Math.sin(toRad(endA))
          const large = sweep > 180 ? 1 : 0
          return { ...r, pct, path: `M${x1.toFixed(2)},${y1.toFixed(2)} A${midR},${midR} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}` }
        })
        const activeArc = pieHov ? arcs.find(a => a.name === pieHov) : null
        const maxVal = Math.max(...rows.map(r => r[pieMetric]), 1)
        return (
          <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', marginBottom: '16px' }}>
            {/* Header */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>State distribution</span>
                <div style={{ width: '1px', height: '16px', background: '#f0f1f5' }} />
                {[
                  { value: rows.length, label: 'states', color: '#1c5af4', bg: '#eef3fe' },
                  { value: totalCAsAll, label: 'CAs', color: '#36b37e', bg: '#f0faf6' },
                  { value: totalBranchesAll, label: 'branches', color: '#9aa0b0', bg: '#f5f6fa' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', background: item.bg, border: `1px solid ${item.color}22`, borderRadius: '5px', padding: '3px 10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</span>
                    <span style={{ fontSize: '11px', color: '#9aa0b0', fontWeight: 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
                {([{ id: 'cas', label: 'By CAs' }, { id: 'branches', label: 'By branches' }] as Array<{ id: 'cas'|'branches'; label: string }>).map(o => (
                  <button key={o.id} onClick={() => setPieMetric(o.id)} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '3px 14px', fontSize: '11px', background: pieMetric === o.id ? '#1c5af4' : 'transparent', color: pieMetric === o.id ? '#fff' : '#9aa0b0', fontWeight: pieMetric === o.id ? 600 : 400, transition: 'all .12s' }}>{o.label}</button>
                ))}
              </div>
            </div>
            {/* Body */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '24px 24px 20px' }}>
              {/* Donut */}
              <div style={{ flexShrink: 0 }}>
                <svg width="260" height="260" viewBox="0 0 260 260">
                  {arcs.map(arc => (
                    <path key={arc.name} d={arc.path} fill="none" stroke={arc.color}
                      strokeWidth={pieHov === arc.name ? strokeW + 6 : strokeW}
                      strokeLinecap="butt"
                      opacity={pieHov && pieHov !== arc.name ? 0.2 : 1}
                      style={{ cursor: 'pointer', transition: 'stroke-width .15s, opacity .15s' }}
                      onMouseEnter={() => setPieHov(arc.name)}
                      onMouseLeave={() => setPieHov(null)}
                    />
                  ))}
                  {activeArc ? (
                    <>
                      <text x={CX} y={CY - 10} textAnchor="middle" fontSize="22" fontWeight="700" fill={activeArc.color} fontFamily="Inter,sans-serif">{activeArc[pieMetric]}</text>
                      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="11" fill="#9aa0b0" fontFamily="Inter,sans-serif">{pieMetric === 'cas' ? 'CAs' : 'branches'}</text>
                      <text x={CX} y={CY + 24} textAnchor="middle" fontSize="11" fontWeight="500" fill="#192744" fontFamily="Inter,sans-serif">{activeArc.name}</text>
                    </>
                  ) : (
                    <>
                      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="26" fontWeight="700" fill="#192744" fontFamily="Inter,sans-serif">{total}</text>
                      <text x={CX} y={CY + 14} textAnchor="middle" fontSize="12" fill="#9aa0b0" fontFamily="Inter,sans-serif">{rows.length} states · {pieMetric === 'cas' ? 'CAs' : 'branches'}</text>
                    </>
                  )}
                </svg>
              </div>
              {/* Divider */}
              <div style={{ width: '1px', alignSelf: 'stretch', background: '#f0f1f5', margin: '0 28px', flexShrink: 0 }} />
              {/* Legend */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 64px 1fr', gap: '14px', paddingBottom: '6px', borderBottom: '1px solid #f0f1f5', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>State</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{pieMetric === 'cas' ? 'CAs' : 'Branches'}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Share</div>
                </div>
                {rows.map(r => {
                  const pct = Math.round(r[pieMetric] / Math.max(total, 1) * 100)
                  const isHov = pieHov === r.name
                  const faded = pieHov && !isHov
                  return (
                    <div key={r.name}
                      onMouseEnter={() => setPieHov(r.name)}
                      onMouseLeave={() => setPieHov(null)}
                      style={{ display: 'grid', gridTemplateColumns: '130px 64px 1fr', alignItems: 'center', gap: '14px', padding: '7px 0', opacity: faded ? 0.35 : 1, transition: 'opacity .15s', cursor: 'default' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0, boxShadow: isHov ? `0 0 0 3px ${r.color}30` : 'none', transition: 'box-shadow .15s' }} />
                        <span style={{ fontSize: '13px', fontWeight: isHov ? 600 : 400, color: '#192744' }}>{r.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isHov ? r.color : '#192744' }}>{r[pieMetric]}</span>
                        <span style={{ fontSize: '12px', color: '#9aa0b0', fontWeight: 500 }}>{pieMetric === 'cas' ? 'CAs' : 'br'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f5f6fa', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (r[pieMetric] / maxVal * 100) + '%', borderRadius: '99px', background: r.color, opacity: isHov ? 1 : 0.6, transition: 'opacity .15s' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: isHov ? r.color : '#9aa0b0', minWidth: '30px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '10px 24px', borderTop: '1px solid #f0f1f5', display: 'flex', gap: '24px' }}>
              <span style={{ fontSize: '12px', color: '#9aa0b0' }}>Avg <strong style={{ color: '#192744', fontWeight: 600 }}>{(totalCAsAll / rows.length).toFixed(1)}</strong> CAs per state</span>
              <span style={{ fontSize: '12px', color: '#9aa0b0' }}>Avg <strong style={{ color: '#192744', fontWeight: 600 }}>{(totalBranchesAll / rows.length).toFixed(1)}</strong> branches per state</span>
              <span style={{ fontSize: '12px', color: '#9aa0b0' }}>Hover a segment or row to highlight</span>
            </div>
          </div>
        )
      })()}

      {/* Branch performance cards — advanced only */}
      {analyticsMode === 'advanced' && (() => {
        const allBranches = Object.values(BRANCHES).flat()
        const branchMetrics = allBranches.map(br => {
          const cas = CAS[br] ?? []
          const allBills = cas.flatMap(ca => getCABills(ca, 'monthly'))
          return {
            name: br,
            latePayment:        allBills.reduce((s: number, r: any) => s + (r.latePayment ?? 0), 0),
            earlyPayment:       allBills.reduce((s: number, r: any) => s + (r.earlyPaymentDiscount ?? 0), 0),
            pfPenalty:          allBills.reduce((s: number, r: any) => s + (r.pfPenalty ?? 0), 0),
            pfIncentive:        allBills.reduce((s: number, r: any) => s + (r.pfIncentive ?? 0), 0),
            onHold:             Math.round((br.charCodeAt(0) + br.charCodeAt(br.length-1)) % 8),
          }
        })
        const fmtL = (v: number) => '₹' + (v / 100000).toFixed(1) + 'L'
        const maxLate     = branchMetrics.reduce((a, b) => b.latePayment > a.latePayment ? b : a)
        const maxEarly    = branchMetrics.reduce((a, b) => b.earlyPayment > a.earlyPayment ? b : a)
        const maxHold     = branchMetrics.reduce((a, b) => b.onHold > a.onHold ? b : a)
        const maxPFPen    = branchMetrics.reduce((a, b) => b.pfPenalty > a.pfPenalty ? b : a)
        const maxPFInc    = branchMetrics.reduce((a, b) => b.pfIncentive > a.pfIncentive ? b : a)

        const cards = [
          {
            color: '#e53935', label: 'CONTRACT REVISION SAVING', colorLight: '#fef2f2', colorBorder: '#fecaca',
            value: fmtL(maxLate.latePayment),
            sub: 'Highest late fee',
            branch: maxLate.name,
            cta: 'View CAs →',
          },
          {
            color: '#f59e0b', label: 'PF IMPROVEMENT SAVING', colorLight: '#fffbeb', colorBorder: '#fde68a',
            value: fmtL(maxPFPen.pfPenalty),
            sub: 'Maintain PF ≥ 0.95 via capacitor banks',
            branch: maxPFPen.name,
            cta: 'View CA list →',
          },
          {
            color: '#36b37e', label: 'TOTAL RECOVERABLE', colorLight: '#f0faf6', colorBorder: '#bbf7d0',
            value: fmtL(maxEarly.earlyPayment),
            sub: 'Max early payment savings',
            branch: maxEarly.name,
            cta: 'See breakdown →',
          },
          {
            color: '#1c5af4', label: 'CLEAN BILL RATE', colorLight: '#eef3fe', colorBorder: '#c7d2fe',
            value: fmtL(maxPFInc.pfIncentive),
            sub: 'Max PF incentive',
            branch: maxPFInc.name,
            cta: 'View profile →',
          },
        ]

        return (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>Branch highlights</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {cards.map((card, i) => (
                <div key={i}
                  style={{
                    background: '#fff',
                    borderLeft: '1px solid #f0f1f5',
                    borderRight: '1px solid #f0f1f5',
                    borderBottom: '1px solid #f0f1f5',
                    borderTop: `2.5px solid ${card.color}`,
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(25,39,68,.04)',
                    padding: '18px 20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderLeftColor = card.colorBorder ?? '#f0f1f5';
                    el.style.borderRightColor = card.colorBorder ?? '#f0f1f5';
                    el.style.borderBottomColor = card.colorBorder ?? '#f0f1f5';
                    el.style.boxShadow = '0 4px 16px rgba(25,39,68,.08)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderLeftColor = '#f0f1f5';
                    el.style.borderRightColor = '#f0f1f5';
                    el.style.borderBottomColor = '#f0f1f5';
                    el.style.boxShadow = '0 1px 3px rgba(25,39,68,.04)';
                  }}
                >
                  {/* Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: card.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.label}</span>
                  </div>
                  {/* Value */}
                  <div style={{ fontSize: '32px', fontWeight: 700, color: card.color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>{card.value}</div>
                  {/* Context + Branch */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '3px' }}>{card.sub}</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em' }}>{card.branch}</div>
                  </div>
                  {/* CTA */}
                  <button style={{ alignSelf: 'flex-start', fontSize: '12px', fontWeight: 500, color: card.color, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', marginTop: 'auto' }}>{card.cta}</button>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

            {/* Spend by state */}
      <div style={{ marginTop: '24px' }} />
      {/* Spend heatmap — India map */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Spend by state</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Total bill spend per state · click a state to drill in</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#858ea2' }}>
            <span>Low</span>
            {(['#DBEAFE','#93C5FD','#3B82F6','#1D4ED8','#1E3A8A'] as const).map((bg, bi) => (
              <div key={bi} style={{ width: '16px', height: '10px', borderRadius: '2px', background: bg }} />
            ))}
            <span>High</span>
          </div>
        </div>
        {(() => {
          const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
          const spendData = {} as Record<string, { total: number; months: number[] }>
          ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Delhi', 'Rajasthan', 'Uttar Pradesh', 'West Bengal'].forEach(st => {
            const d = getStateBills(st, 'monthly')
            const mths = d.map((m: any) => Math.round(m.totalBill / 100000))
            const total = mths.reduce((a: number, v: number) => a + v, 0)
            spendData[st] = { total, months: mths }
          })
          const maxSpend = Math.max(...Object.values(spendData).map(s => s.total), 1)
          const getSpendBg = (t: number) => {
            if (t <= 0) return '#f9f9f9'
            const p = t / maxSpend
            if (p < 0.2) return '#DBEAFE'
            if (p < 0.4) return '#93C5FD'
            if (p < 0.6) return '#3B82F6'
            if (p < 0.8) return '#1D4ED8'
            return '#1E3A8A'
          }
          const isDkSpend = (t: number) => t / maxSpend >= 0.4
          const PATHS: Record<string,string> = {
            'Andhra Pradesh':'M152.5 287.7L150.5 291.1L147.6 292.9L144.4 293.0L141.3 294.5L140.2 298.7L138.3 302.3L135.5 300.1L132.5 301.3L130.4 304.8L129.0 308.8L128.6 313.2L129.5 317.6L129.8 322.1L129.4 326.5L130.5 330.7L131.0 335.2L127.9 336.2L125.3 338.9L121.9 338.2L119.7 341.5L116.4 342.0L113.3 343.3L112.5 347.7L109.2 347.6L111.2 344.0L112.7 340.1L110.6 336.7L108.4 333.4L106.0 330.1L103.1 331.8L100.0 330.7L96.9 331.8L95.4 327.8L98.6 328.0L101.4 325.8L98.6 323.4L95.5 324.6L94.2 320.5L94.3 316.0L96.9 313.1L97.2 308.5L96.3 304.2L96.8 299.7L100.0 299.3L101.3 295.1L98.9 292.1L101.0 288.7L101.0 284.1L100.5 279.6L102.8 276.3L101.7 271.9L102.0 267.4L101.7 262.9L104.0 259.7L106.1 256.2L104.1 252.6L105.8 248.7L109.0 247.2L110.2 243.0L113.2 241.4L116.0 243.8L118.8 246.1L122.0 245.6L125.2 244.6L127.7 247.5L126.6 251.7L127.0 256.4L130.0 258.4L133.2 259.1L135.6 262.4L137.2 266.4L138.7 270.5L141.8 271.3L145.1 271.2L148.0 269.1L151.1 267.9L153.2 264.4L156.5 264.1L159.7 263.1L160.5 258.7L163.4 256.6L164.9 252.6L167.9 254.5L170.7 256.5L173.9 256.8L175.9 253.2L175.7 257.7L173.6 261.1L171.4 264.4L168.5 266.2L165.9 268.8L163.8 272.1L161.4 275.2L158.6 277.2L155.7 279.2L153.2 281.9L153.1 286.4L152.5 287.7Z',
            'Bihar':'M171.9 126.6L174.8 128.7L178.0 130.7L179.8 134.4L182.8 136.2L185.9 137.4L189.1 137.1L192.0 139.4L195.3 139.9L198.2 141.8L201.4 142.3L204.7 143.1L208.0 142.7L211.3 142.3L214.5 141.3L214.7 145.8L212.0 148.2L212.6 152.6L214.1 156.6L211.0 157.6L208.1 159.7L205.8 162.7L203.8 166.3L201.8 169.9L198.6 170.3L195.9 172.6L193.3 169.9L190.7 167.0L188.4 170.3L185.2 171.1L182.3 173.3L179.4 171.2L176.6 173.3L173.9 170.8L170.7 169.5L167.6 171.5L165.2 168.5L163.6 164.6L164.5 160.3L167.4 158.3L170.0 155.6L173.2 154.2L176.3 153.3L174.0 149.9L171.2 147.7L172.5 143.6L169.6 141.5L172.6 139.8L171.2 135.7L170.4 131.2L171.5 127.0L171.9 126.6Z',
            'Chhattisgarh':'M163.5 177.5L165.9 180.6L167.9 184.1L170.9 185.8L171.2 190.3L172.9 194.1L173.1 198.7L170.4 201.1L168.3 204.7L166.0 208.0L165.1 212.3L163.6 216.3L162.3 220.4L159.2 221.4L156.0 222.6L154.2 226.4L152.8 230.4L153.7 234.7L155.5 238.7L152.5 240.4L149.7 238.3L149.8 242.9L150.8 247.2L151.1 251.8L151.0 256.4L148.4 258.9L146.6 263.2L144.2 266.3L142.8 270.3L139.6 271.3L138.1 267.3L135.9 263.7L134.1 260.1L131.1 258.1L130.9 253.6L132.6 249.8L135.8 249.3L136.2 244.8L133.8 241.7L133.8 237.1L134.3 232.5L134.0 228.0L132.7 223.8L134.5 220.2L135.7 216.0L136.9 211.8L137.6 207.3L139.9 204.2L142.2 201.0L145.4 200.4L146.8 196.4L148.7 192.7L151.1 189.9L148.8 186.8L145.6 186.4L145.5 181.9L148.7 181.1L152.0 181.7L155.3 181.6L158.3 179.7L161.5 180.4L163.5 177.5Z',
            'Delhi':'M98.3 106.9L99.3 111.2L96.1 111.2L96.4 106.6L98.3 106.9Z',
            'Goa':'M63.0 295.0L65.5 297.0L64.0 300.0L61.5 298.0L63.0 295.0Z',
            'Gujarat':'M43.8 169.4L46.8 171.5L50.0 172.1L53.0 173.7L55.1 177.2L57.8 179.7L58.7 184.0L60.9 187.4L64.0 188.9L66.7 191.3L68.2 195.4L66.7 199.4L66.1 203.8L65.4 208.2L62.7 211.2L62.3 215.7L65.5 215.5L63.5 219.0L60.8 221.5L63.0 224.8L62.4 229.3L59.1 228.7L57.7 232.7L56.2 236.6L53.6 233.9L50.9 236.7L51.6 232.3L51.8 227.8L50.5 223.7L49.0 219.7L50.5 215.7L48.5 212.2L48.3 207.7L51.1 205.5L47.9 205.8L45.7 209.1L45.7 213.6L44.6 217.8L42.8 221.5L39.9 223.4L37.0 225.4L34.0 226.9L30.9 227.9L29.3 223.9L26.6 226.3L23.9 223.9L21.5 220.9L19.4 217.5L17.2 214.3L14.7 211.4L12.3 208.4L10.2 205.1L13.4 204.8L16.2 202.7L19.4 202.6L22.3 200.7L24.5 197.5L26.3 193.8L23.2 194.6L20.1 195.8L17.1 197.5L14.0 196.4L11.0 194.9L8.2 192.7L6.7 188.8L5.2 184.8L7.5 181.6L8.1 176.6L11.4 175.1L14.7 175.0L17.9 175.9L21.1 176.5L24.0 174.2L27.3 172.7L29.8 175.7L32.6 173.7L32.8 169.2L36.0 169.6L39.3 169.4L42.6 169.3L43.8 169.4Z',
            'Haryana':'M83.1 89.5L86.4 89.8L89.7 89.5L93.0 90.0L96.2 91.3L98.5 94.0L98.3 98.5L98.3 103.0L98.3 106.9L96.4 106.6L96.1 111.2L93.0 110.5L90.0 112.5L87.0 111.0L84.2 108.8L81.5 106.5L80.5 102.4L79.3 98.3L80.4 94.2L83.1 89.5Z',
            'Himachal Pradesh':'M98.5 67.5L102.5 68.0L106.0 69.5L109.0 72.0L111.5 75.5L112.0 79.8L110.5 83.5L107.5 85.5L104.0 86.0L100.5 87.0L97.0 88.5L94.0 91.0L91.0 90.5L88.5 88.0L90.0 84.5L89.5 80.5L91.5 77.0L94.5 74.0L98.5 72.5L98.5 67.5Z',
            'Jharkhand':'M185.0 158.0L188.5 160.0L192.0 162.0L195.5 164.0L198.5 166.5L200.5 170.0L203.0 173.5L203.5 178.0L204.0 182.5L201.5 185.0L198.5 187.5L195.5 185.5L192.5 183.0L190.0 186.0L187.0 188.0L184.0 186.5L181.0 184.0L178.5 181.0L177.5 177.0L175.5 173.5L173.5 170.5L176.5 168.5L179.5 166.5L182.0 164.0L184.5 161.0L185.0 158.0Z',
            'Karnataka':'M99.6 262.0L102.4 264.3L102.9 268.8L101.4 272.7L103.3 276.3L100.7 279.0L101.2 283.4L101.0 287.9L98.7 291.3L101.7 293.0L101.3 297.5L98.2 299.1L97.3 303.4L96.4 307.9L97.3 312.2L94.1 312.1L93.7 316.6L94.5 321.1L96.6 324.7L99.8 324.1L100.0 328.6L96.8 327.6L95.9 331.9L99.0 330.5L101.9 332.4L104.8 330.2L107.9 331.5L110.3 334.4L111.7 338.7L111.5 343.2L109.1 346.6L106.0 345.3L103.5 348.1L102.5 352.5L104.2 356.3L101.6 359.1L98.7 360.9L95.4 361.2L92.7 363.9L89.6 362.7L86.9 360.0L83.7 358.6L81.2 355.7L79.1 352.4L76.9 349.1L74.3 346.4L72.4 342.8L71.7 338.5L71.2 334.0L70.3 329.7L69.1 325.6L68.0 321.3L66.7 317.2L67.1 312.8L67.4 308.3L66.8 303.9L68.3 299.9L69.3 295.6L67.7 291.7L70.6 289.8L73.1 287.0L75.6 284.2L78.9 283.7L81.9 282.3L80.8 277.7L84.0 277.4L87.1 278.9L89.2 275.6L91.3 272.0L94.2 270.1L95.5 265.9L98.3 263.6L99.6 262.0Z',
            'Kerala':'M98.7 360.9L101.6 359.1L104.2 356.3L103.5 348.1L101.9 356.0L100.5 360.5L99.5 365.0L97.5 369.5L95.5 374.0L93.0 378.5L90.5 383.0L88.5 387.5L87.0 392.0L88.5 396.0L90.0 400.5L88.5 404.5L86.0 408.0L84.0 412.0L86.5 415.0L88.5 411.5L90.5 408.0L92.5 404.5L94.0 400.5L95.5 396.5L97.0 392.0L98.5 387.5L100.0 383.0L101.0 378.5L101.5 374.0L101.0 369.5L99.5 365.0L98.7 360.9Z',
            'Madhya Pradesh':'M80.5 154.5L83.5 156.0L86.5 157.5L89.5 159.0L92.5 160.5L95.5 162.0L98.5 163.5L101.5 165.0L104.5 166.5L107.0 169.0L109.5 171.5L112.0 174.0L112.5 178.5L113.0 183.0L113.5 187.5L114.0 192.0L114.5 196.5L115.0 201.0L115.5 205.5L116.0 210.0L116.5 214.5L113.5 215.5L110.5 216.5L107.5 215.0L104.5 215.5L101.5 214.0L98.5 213.5L95.5 215.0L92.5 217.5L89.5 218.5L86.5 217.0L83.5 217.5L80.5 218.0L77.5 217.0L74.5 213.0L71.5 213.5L68.5 210.0L65.5 209.0L66.0 204.5L66.5 200.0L67.0 195.5L68.5 191.5L70.5 188.0L72.5 184.5L74.5 181.0L76.5 177.5L78.5 174.0L79.5 169.5L80.0 165.0L80.5 160.0L80.5 154.5Z',
            'Maharashtra':'M68.6 208.4L69.5 212.7L72.4 214.6L75.5 215.8L78.4 217.9L81.7 218.0L84.9 217.8L87.2 221.0L90.3 221.5L93.0 217.8L95.8 213.8L99.0 212.9L102.1 214.4L103.7 218.3L106.9 217.5L109.5 214.9L112.6 216.0L116.0 216.5L118.8 214.2L122.0 213.6L125.1 214.7L128.3 215.4L131.6 215.6L134.0 218.6L132.7 222.7L133.8 227.0L134.5 231.4L132.5 234.9L133.7 239.0L135.1 243.2L137.5 246.1L134.8 248.9L131.9 251.0L131.5 255.5L128.8 258.0L127.3 254.0L127.4 249.3L126.1 245.2L122.8 245.5L119.6 245.9L116.8 243.7L113.6 241.6L110.4 240.4L110.0 244.9L108.7 249.0L105.5 248.8L104.1 252.8L104.6 257.4L102.3 260.6L100.2 264.0L97.1 265.5L95.1 269.1L92.8 272.5L89.8 274.2L89.4 278.7L86.2 278.5L83.0 277.7L81.9 282.0L78.9 283.7L75.7 284.7L72.6 287.1L70.1 290.1L66.9 290.3L68.5 294.3L68.7 298.8L66.3 301.8L63.1 302.1L60.1 300.7L58.3 296.9L57.2 292.7L56.9 288.2L56.5 283.7L55.7 279.4L54.8 275.1L54.2 270.7L53.0 266.5L52.3 262.1L51.9 257.6L53.6 253.7L51.2 250.8L50.9 246.3L50.0 242.0L50.2 237.5L53.4 236.8L56.5 235.7L58.1 231.7L61.2 230.1L63.4 226.7L61.3 223.1L63.3 219.5L65.9 216.8L62.7 216.3L62.3 211.8L65.2 209.6L68.3 208.4L68.6 208.4Z',
            'Manipur':'M247.0 175.0L250.0 177.0L252.5 180.0L253.0 184.0L251.5 187.5L248.5 189.5L245.5 188.0L243.0 185.5L242.5 181.5L244.0 178.0L247.0 175.0Z',
            'Meghalaya':'M215.0 143.5L218.5 144.0L222.0 145.5L225.5 147.5L228.0 150.5L226.5 153.5L223.5 154.5L220.5 153.0L217.5 151.5L214.5 150.0L213.5 147.0L215.0 143.5Z',
            'Mizoram':'M245.0 190.0L248.0 192.5L249.5 196.0L248.5 199.5L245.5 201.0L242.5 199.0L241.5 195.5L242.5 192.0L245.0 190.0Z',
            'Nagaland':'M248.5 161.0L252.0 162.5L254.5 165.5L254.0 169.5L251.0 171.0L247.5 170.0L245.5 167.0L246.0 163.5L248.5 161.0Z',
            'Odisha':'M175.5 207.5L178.5 209.5L181.5 211.5L184.5 213.5L187.0 216.5L188.5 220.0L190.0 223.5L191.5 227.0L191.0 231.5L190.0 236.0L188.0 240.0L185.5 243.5L182.5 246.0L179.5 248.0L176.5 249.5L173.5 248.0L170.5 246.5L168.5 244.0L167.0 240.5L165.5 237.0L164.5 233.0L163.5 229.0L163.0 225.0L162.5 221.0L163.5 217.0L164.5 213.0L165.5 209.0L167.0 205.5L169.0 202.5L172.0 200.5L175.0 202.0L175.5 207.5Z',
            'Punjab':'M73.5 76.5L77.0 77.5L80.5 79.0L84.0 80.5L87.0 83.0L88.5 87.0L86.5 90.5L83.5 90.5L80.5 89.5L77.5 88.0L74.5 86.5L72.0 84.0L71.5 80.5L73.5 76.5Z',
            'Rajasthan':'M62.8 89.8L66.3 90.1L69.5 90.3L70.2 94.8L70.4 99.5L73.5 98.7L76.6 100.4L79.3 103.4L80.2 107.8L82.0 111.9L84.9 114.3L85.4 118.8L88.7 119.0L92.0 119.2L94.4 115.9L95.1 120.4L98.2 122.1L99.6 126.2L102.0 129.2L102.3 133.8L100.6 137.6L103.6 136.0L106.8 135.7L105.5 139.7L102.7 141.9L99.7 143.8L97.0 146.3L94.2 148.7L91.4 151.5L90.9 156.0L93.4 159.0L96.6 159.3L99.7 157.8L100.2 162.2L97.0 163.1L94.7 166.5L96.6 170.1L94.4 173.3L91.6 175.7L88.3 175.8L85.6 178.2L83.0 181.0L79.9 180.3L82.9 178.8L83.2 174.3L84.0 169.9L80.9 168.2L77.5 168.1L78.4 163.7L75.5 165.7L73.5 169.2L72.4 173.4L74.2 177.3L73.7 181.8L72.3 185.8L69.8 188.8L67.9 192.5L65.3 189.8L62.3 187.5L59.9 184.2L57.3 181.5L55.7 177.6L54.6 173.4L51.4 173.6L48.5 171.4L45.3 170.3L42.1 169.5L38.9 169.4L35.7 169.3L32.6 167.7L31.1 163.4L29.4 159.6L28.6 155.3L25.3 154.1L22.9 151.1L23.0 146.3L23.3 141.7L20.0 140.5L17.1 138.6L16.1 134.0L18.1 130.1L20.5 127.1L22.5 122.8L24.9 119.7L28.3 120.2L30.3 123.7L33.5 122.3L36.8 121.3L40.1 120.7L42.2 117.0L44.6 114.0L45.9 109.4L48.5 106.7L51.7 104.6L53.9 101.3L55.7 97.3L56.9 93.1L59.0 89.6L62.3 87.9L62.8 89.8Z',
            'Tamil Nadu':'M128.8 335.2L131.6 337.4L131.1 341.9L130.5 346.2L129.7 350.6L127.8 354.2L126.4 358.2L125.6 362.6L126.1 367.0L126.5 371.5L126.4 376.1L126.5 380.6L123.9 383.1L120.7 383.7L119.6 387.9L117.7 391.5L116.2 395.6L118.7 398.4L115.5 399.0L112.6 400.7L109.7 402.5L108.4 406.6L107.6 411.0L105.1 413.8L102.2 415.6L99.0 415.2L98.2 410.8L97.9 406.3L98.0 401.8L99.4 397.5L97.6 393.7L98.3 389.2L98.9 384.8L95.7 384.7L94.1 380.6L94.9 376.3L92.4 373.5L90.4 369.9L88.6 366.1L90.7 362.5L93.8 363.9L96.2 361.0L99.5 361.6L102.2 359.0L101.0 354.8L102.7 350.8L104.4 346.9L107.5 345.7L110.1 348.5L113.0 346.1L114.7 342.4L117.9 342.6L121.0 341.2L123.8 339.1L127.0 338.1L128.8 335.2Z',
            'Telangana':'M128.8 258.2L130.9 261.5L132.5 265.0L134.8 268.5L137.2 266.4L138.7 270.5L141.8 271.3L145.1 271.2L148.0 269.1L151.1 267.9L153.2 264.4L156.5 264.1L159.7 263.1L160.5 258.7L163.4 256.6L164.9 252.6L163.5 248.5L161.0 245.5L159.0 242.0L156.5 239.0L153.5 237.0L150.5 239.5L148.0 242.5L145.0 244.5L142.5 247.5L140.0 250.5L138.0 253.5L135.5 256.0L133.0 258.5L130.5 260.5L128.8 258.2Z',
            'Tripura':'M236.0 171.0L239.5 172.0L242.0 175.0L241.5 178.5L238.5 179.5L235.5 178.0L234.5 174.5L236.0 171.0Z',
            'Uttar Pradesh':'M102.2 83.4L105.1 85.4L103.9 89.6L104.5 94.0L107.5 95.4L110.2 92.5L112.7 95.6L115.7 97.5L116.3 101.9L119.1 104.1L121.8 106.6L125.1 106.1L127.9 108.6L131.1 108.7L134.3 109.2L137.0 111.8L140.3 113.8L142.3 117.2L145.3 119.2L148.1 121.4L151.3 121.5L154.0 124.0L157.2 124.6L160.0 127.4L163.1 129.2L166.5 127.2L169.3 129.5L170.9 133.6L173.4 136.6L171.5 140.3L172.5 144.6L172.4 149.1L175.5 150.8L173.3 154.2L170.2 155.5L167.6 158.2L164.7 160.2L163.6 164.4L165.1 168.5L164.3 172.8L163.7 177.3L161.4 180.6L158.1 179.5L157.3 175.2L156.9 170.7L154.1 168.6L151.1 167.0L148.3 164.5L145.2 163.2L142.2 161.5L140.3 165.1L137.0 165.0L134.6 162.0L131.6 163.8L131.3 159.1L128.1 159.2L125.7 162.3L122.6 162.8L120.8 159.0L118.7 162.4L116.5 159.0L113.5 157.5L113.0 162.2L114.7 166.1L116.3 170.0L116.3 174.5L113.1 174.3L110.1 172.9L109.3 168.5L110.2 164.1L110.3 159.6L111.7 155.5L115.0 154.9L116.1 150.7L117.1 146.3L118.0 141.9L115.8 138.5L112.6 137.7L109.4 136.9L106.3 135.7L103.1 136.3L102.5 131.9L100.6 128.2L99.6 123.9L101.7 120.2L101.8 115.6L99.9 112.0L98.4 107.8L97.7 103.4L97.2 98.8L97.3 94.3L98.4 90.1L100.8 86.9L102.2 83.4Z',
            'Uttarakhand':'M107.5 67.0L110.5 69.0L113.5 71.0L116.5 73.5L118.5 77.0L119.0 81.0L117.5 84.5L114.5 86.0L111.5 84.5L108.5 83.0L106.0 80.5L104.5 77.0L105.0 73.0L107.5 67.0L107.5 67.0Z',
            'West Bengal':'M214.7 132.4L217.9 133.0L221.1 132.2L223.5 135.2L226.5 136.9L229.7 137.0L232.9 138.5L233.0 143.0L230.9 146.4L228.3 149.0L225.6 146.6L223.9 142.8L220.8 144.2L218.5 141.1L217.1 145.1L215.3 148.8L216.7 152.9L218.9 156.1L222.1 156.8L223.6 160.8L220.3 161.0L217.9 164.0L214.8 165.3L213.9 169.6L216.3 172.5L219.2 174.5L221.2 178.0L219.6 182.0L220.8 186.2L221.6 190.6L222.9 194.7L223.3 199.1L222.7 203.5L220.2 206.3L219.2 210.6L216.1 211.8L215.7 207.3L213.0 204.9L213.7 209.2L211.6 212.7L208.6 214.3L205.9 211.9L202.7 210.4L200.6 207.0L200.2 202.5L198.5 198.7L196.6 195.1L193.6 193.3L190.7 191.5L190.5 187.0L193.5 185.4L196.7 184.5L199.9 183.6L202.6 181.2L205.8 180.6L207.9 177.3L210.5 174.6L211.9 170.6L212.5 166.2L210.9 162.2L210.9 157.7L214.0 156.9L212.7 152.8L211.6 148.5L214.3 146.1L215.7 142.0L215.3 137.5L213.7 133.6L214.7 132.4Z',
            'Jammu and Kashmir':'M88.0 32.0L92.0 33.5L96.0 35.5L99.5 38.5L101.5 42.5L100.0 46.5L97.0 49.0L94.0 51.5L91.5 54.5L90.5 58.5L91.0 62.5L93.0 66.0L95.5 68.0L93.0 71.0L90.0 72.5L87.0 71.0L84.5 68.5L82.5 65.5L80.5 62.5L79.0 59.0L78.0 55.5L77.5 52.0L79.0 48.5L81.5 45.5L84.5 42.5L86.5 39.0L88.0 35.5L88.0 32.0Z',
          }
          const LBLS: Record<string,[number,number]> = {
            'Maharashtra':[85,250],'Karnataka':[87,308],'Tamil Nadu':[108,375],
            'Gujarat':[42,202],'Rajasthan':[72,142],'Delhi':[101,110],
            'Uttar Pradesh':[139,133],'West Bengal':[210,172],
            'Andhra Pradesh':[148,295],'Bihar':[192,149],'Madhya Pradesh':[115,187],
            'Odisha':[178,224],'Chhattisgarh':[155,218],'Telangana':[145,255],
          }
          const ABBR: Record<string,string> = {
            'Maharashtra':'MH','Karnataka':'KA','Tamil Nadu':'TN','Gujarat':'GJ',
            'Rajasthan':'RJ','Delhi':'DL','Uttar Pradesh':'UP','West Bengal':'WB',
            'Andhra Pradesh':'AP','Bihar':'BR','Madhya Pradesh':'MP','Odisha':'OD',
            'Chhattisgarh':'CG','Telangana':'TG','Kerala':'KL','Punjab':'PB',
            'Haryana':'HR','Jharkhand':'JH',
          }
          return (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              {/* Map */}
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <svg width={295} height={406} viewBox="0 0 320 440" style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                  <rect width="320" height="440" fill="#F8FAFF"/>
                  {Object.entries(PATHS).map(([name, path]) => {
                    const sd = spendData[name]
                    const fill = sd ? getSpendBg(sd.total) : '#E8E6E0'
                    const isSelected = spendSel === name
                    const isHov = spendHov === name
                    return (
                      <path key={name} d={path} fill={fill}
                        stroke={isSelected ? '#1E3A8A' : '#fff'}
                        strokeWidth={isSelected ? 2 : 0.8}
                        style={{ cursor: sd ? 'pointer' : 'default', transition: 'opacity .15s',
                          opacity: spendSel && !isSelected ? 0.4 : spendHov && !isHov && !isSelected ? 0.6 : 1 }}
                        onMouseEnter={() => sd && setSpendHov(name)}
                        onMouseLeave={() => setSpendHov(null)}
                        onClick={() => sd && setSpendSel(spendSel === name ? null : name)}
                      />
                    )
                  })}
                  {Object.entries(LBLS).map(([name,[x,y]]) => {
                    const sd = spendData[name]
                    if (!sd) return null
                    return (
                      <text key={name} x={x} y={y} textAnchor="middle" fontSize="8" fontWeight="700"
                        fontFamily="Inter, sans-serif" style={{ pointerEvents:'none' }}
                        fill={isDkSpend(sd.total) ? '#fff' : '#1e3a8a'}>
                        {ABBR[name] ?? name.slice(0,2).toUpperCase()}
                      </text>
                    )
                  })}
                  {spendHov && !spendSel && spendData[spendHov] && LBLS[spendHov] && (() => {
                    const [tx,ty] = LBLS[spendHov]
                    return (
                      <g style={{ pointerEvents:'none' }}>
                        <rect x={tx-44} y={ty+5} width="88" height="18" rx="3" fill="#1E3A8A" opacity="0.92"/>
                        <text x={tx} y={ty+17} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Inter, sans-serif">
                          {spendHov} · {inr(spendData[spendHov].total * 100000)}
                        </text>
                      </g>
                    )
                  })()}
                </svg>
              </div>
              {/* State list or drill-down panel */}
              <div style={{ flex:1, minWidth:0 }}>
                {!spendSel ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>
                          {spendView === 'all' 
                            ? 'All states by spend'
                            : spendView === 'top'
                            ? 'Highest spend states · focus area'
                            : 'Lowest spend states · savings benchmark'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#858ea2' }}>
                          {spendView === 'all' 
                            ? 'Complete state ranking by total bill outflow'
                            : spendView === 'top'
                            ? 'These states drive most of your bill outflow'
                            : 'These states show efficient bill management'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '99px', padding: '2px', gap: '2px' }}>
                        {([
                          { key: 'all',    label: 'All states' },
                          { key: 'top',    label: 'Highest Spend' },
                          { key: 'bottom', label: 'Lowest Spend' },
                        ] as const).map(p => (
                          <button key={p.key} onClick={() => setSpendView(p.key)}
                            style={{
                              background: spendView === p.key ? '#1c5af4' : 'transparent',
                              color: spendView === p.key ? '#fff' : '#858ea2',
                              border: 'none', borderRadius: '99px',
                              padding: '4px 14px',
                              fontSize: '11px',
                              fontWeight: spendView === p.key ? 600 : 400,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all .12s',
                            }}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const sortedStates = Object.entries(spendData).sort((a, b) => b[1].total - a[1].total)
                      const displayStates = spendView === 'top'
                        ? sortedStates.slice(0, 5)
                        : spendView === 'bottom'
                        ? sortedStates.slice(-5).reverse()
                        : sortedStates
                      
                      return displayStates.map(([name, sd], i) => {
                        const rankColor = '#858ea2'
                        const valueColor = spendView === 'all' ? '#1c5af4' : spendView === 'top' ? '#ec2127' : '#15803D'
                        const showBadge = spendView !== 'all'
                        const badgeBg = spendView === 'top' ? '#fce8e8' : '#e8f8f1'
                        const badgeColor = spendView === 'top' ? '#ec2127' : '#36b37e'
                        const badgeText = spendView === 'top' ? '↑ High spend' : '↓ Low spend'
                        
                        return (
                          <div key={name} onClick={() => setSpendSel(name)}
                            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 10px', borderRadius:'8px', cursor:'pointer', background:'#F9FAFB', border:'1px solid #E5E7EB' }}
                            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='#EFF6FF'}
                            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='#F9FAFB'}>
                            <div style={{ fontSize:'11px', fontWeight:600, width:'14px', color: rankColor }}>{i+1}</div>
                            <div style={{ flex:1, fontSize:'12.5px', fontWeight:600, color:'#192744' }}>{name}</div>
                            {showBadge && (
                              <div style={{ fontSize:'12px', fontWeight:700, padding:'2px 8px', borderRadius:'4px', background: badgeBg, color: badgeColor }}>
                                {badgeText}
                              </div>
                            )}
                            <div style={{ fontSize:'12px', fontWeight:700, color: valueColor }}>{inr(sd.total * 100000)}</div>
                          </div>
                        )
                      })
                    })()}
                    {spendView !== 'all' && (
                      <div style={{ marginTop: '6px', textAlign: 'center' }}>
                        <button onClick={() => setSpendView('all')}
                          style={{ background: 'none', border: '1px solid #f3f4f6', borderRadius: '4px', padding: '6px 16px', fontSize: '11px', fontWeight: 500, color: '#1c5af4', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                          View all states
                        </button>
                      </div>
                    )}
                  </div>
                ) : (() => {
                  const sd = spendData[spendSel]
                  if (!sd) return <div style={{ padding: '10px', color: '#858ea2' }}>No data available</div>
                  const branches = BRANCHES[spendSel] ?? []
                  const branchCount = branches.length
                  const totalBill = sd.total * 100000
                  const avgPerBranch = branchCount > 0 ? Math.round(totalBill / branchCount) : 0
                  const mthLabels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
                  const peakMthIdx = sd.months.indexOf(Math.max(...sd.months))
                  const lowMthIdx = sd.months.indexOf(Math.min(...sd.months))
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ fontSize:'16px', fontWeight:600, color:'#192744' }}>{spendSel}</div>
                        <button onClick={() => setSpendSel(null)}
                          style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'4px 10px', fontSize:'11px', color:'#858ea2', cursor:'pointer', fontFamily:'inherit' }}>
                          ← All states
                        </button>
                      </div>
                      {/* 3×2 stat grid */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
                        {[
                          { label:'Branches', value: String(branchCount), sub: 'in portfolio', page: 'branches' as const },
                          { label:'Total CAs', value: String((BRANCHES[spendSel]??[]).reduce((s,br)=>s+(CAS[br]?.length??0),0)), sub: 'active CAs', page: 'cas' as const },
                          { label:'Avg / Branch', value: inr(avgPerBranch), sub: 'this FY', page: 'avg' as const },
                          { label:'Peak Month', value: mthLabels[peakMthIdx], sub: inr(sd.months[peakMthIdx] * 100000), page: 'peak' as const },
                          { label:'Lowest Month', value: mthLabels[lowMthIdx], sub: inr(sd.months[lowMthIdx] * 100000), page: 'lowest' as const },
                          { label:'Total Spend', value: inr(sd.total * 100000), sub: 'Apr 24–Mar 25', page: 'spend' as const },
                        ].map(m => (
                          <div key={m.label} onClick={() => setDrillPage(m.page)}
                            style={{ background:'#f5f6fa', border:'1px solid #f3f4f6', borderRadius:'4px', padding:'6px 10px', cursor:'pointer', transition:'background .12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#EFF6FF'}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f6fa'}>
                            <div style={{ fontSize:'9px', fontWeight:600, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>{m.label}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'#1c5af4', lineHeight:1, marginBottom:'1px' }}>{m.value}</div>
                            <div style={{ fontSize:'10px', color:'#858ea2' }}>{m.sub}</div>
                          </div>
                        ))}
                      </div>
                      {/* CA insights row */}
                      {(() => {
                        const stCAs = (BRANCHES[spendSel] ?? []).flatMap(br => CAS[br] ?? [])
                        const seed0 = spendSel.charCodeAt(0)
                        const lastPaidCA = stCAs[seed0 % Math.max(stCAs.length,1)] ?? '—'
                        const lastPaidDate = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(seed0 * 3) % 12]} ${((seed0 * 7) % 28) + 1}`
                        const highCA = stCAs[(seed0 * 5) % Math.max(stCAs.length,1)] ?? '—'
                        const lowCA  = stCAs[(seed0 * 11) % Math.max(stCAs.length,1)] ?? '—'
                        return (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
                            <div style={{ background:'#f5f6fa', border:'1px solid #f3f4f6', borderRadius:'4px', padding:'6px 10px' }}>
                              <div style={{ fontSize:'9px', fontWeight:600, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>Last Bill Paid</div>
                              <div style={{ fontSize:'12px', fontWeight:600, color:'#192744', marginBottom:'2px' }}>{lastPaidDate}</div>
                              <div style={{ fontSize:'10px', fontFamily:'monospace', color:'#858ea2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lastPaidCA}</div>
                            </div>
                            <div style={{ background:'#e8f8f1', border:'1px solid #bbf7d0', borderRadius:'4px', padding:'6px 10px' }}>
                              <div style={{ fontSize:'9px', fontWeight:600, color:'#36b37e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>Highest Bill Amount</div>
                              <div style={{ fontSize:'12px', fontWeight:600, color:'#192744', lineHeight:1, marginBottom:'2px' }}>{inr((sd.months[peakMthIdx] * 100000 * 0.12).toFixed(0) as any * 1)}</div>
                              <div style={{ fontSize:'10px', fontFamily:'monospace', color:'#858ea2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{highCA}</div>
                            </div>
                            <div style={{ background:'#fce8e8', border:'1px solid #fecaca', borderRadius:'4px', padding:'6px 10px' }}>
                              <div style={{ fontSize:'9px', fontWeight:600, color:'#ec2127', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>Lowest Bill Amount</div>
                              <div style={{ fontSize:'12px', fontWeight:600, color:'#192744', lineHeight:1, marginBottom:'2px' }}>{inr((sd.months[lowMthIdx] * 100000 * 0.04).toFixed(0) as any * 1)}</div>
                              <div style={{ fontSize:'10px', fontFamily:'monospace', color:'#858ea2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lowCA}</div>
                            </div>
                          </div>
                        )
                      })()}
                      {/* Monthly spend */}
                      <div style={{ display:'flex', gap:'10px', fontSize:'11px', color:'#858ea2' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#1D4ED8', display:'inline-block' }}/>Peak</span>
                        <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#93C5FD', display:'inline-block' }}/>Other</span>
                      </div>
                      {(() => {
                          const W = 400, H = 100, PAD = { t:18, r:24, b:24, l:24 }
                          const iW = W - PAD.l - PAD.r
                          const iH = H - PAD.t - PAD.b
                          const maxV = Math.max(...sd.months)
                          const minV = Math.min(...sd.months)
                          const xPos = (i: number) => PAD.l + (i / 11) * iW
                          const yPos = (v: number) => PAD.t + iH - ((v - minV) / Math.max(maxV - minV, 1)) * iH
                          const points = sd.months.map((v,i) => [xPos(i), yPos(v)] as [number,number])
                          const linePath = points.map(([x,y],i) => (i===0?`M${x},${y}`:`L${x},${y}`)).join(' ')
                          const areaPath = `${linePath} L${points[11][0]},${PAD.t+iH} L${points[0][0]},${PAD.t+iH} Z`
                          return (
                            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible', fontFamily:'system-ui, sans-serif', width:'100%', display:'block' }}>
                              {[0,0.5,1].map((t,i) => (
                                <line key={i} x1={PAD.l} x2={W-PAD.r} y1={PAD.t + iH*(1-t)} y2={PAD.t + iH*(1-t)}
                                  stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                              ))}
                              <path d={areaPath} fill="#dbeafe" opacity="0.3" />
                              <path d={linePath} fill="none" stroke="#1c5af4" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
                              {points.map(([x,y],i) => {
                                const isPeak = i === peakMthIdx
                                const isLow  = i === lowMthIdx
                                return (
                                  <g key={i}>
                                    <circle cx={x} cy={y} r={isPeak ? 3 : 2}
                                      fill={isPeak ? '#1c5af4' : '#bfdbfe'} stroke="#fff" strokeWidth="1" />
                                    {(isPeak || isLow) && (
                                      <text x={x} y={isPeak ? y-5 : y+9} textAnchor="middle" fontSize="6" fontWeight="500"
                                        fill={isPeak ? '#1c5af4' : '#858ea2'}>
                                        {inr(sd.months[i] * 100000)}
                                      </text>
                                    )}
                                  </g>
                                )
                              })}
                              {points.map(([x],i) => (
                                <text key={i} x={x} y={H-1} textAnchor="middle" fontSize="6"
                                  fill={i===peakMthIdx ? '#1c5af4' : '#858ea2'}
                                  fontWeight={i===peakMthIdx ? '600' : '400'}>
                                  {mthLabels[i]}
                                </text>
                              ))}
                            </svg>
                          )
                        })()}
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })()}
      </div>

    </div>
  )
}

function BasicTrends({ appState }: BasicSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('spend')
  const TABS = [
    { key: 'spend',   label: 'Bill Trend',    color: '#4F46E5', bg: '#EEF2FF', bd: '#C7D2FE' },
    { key: 'yoy',     label: 'YoY Change',    color: '#3B82F6', bg: '#EFF6FF', bd: '#BFDBFE' },
    { key: 'ca',      label: 'CA Count',      color: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
    { key: 'overdue', label: 'Overdue Trend', color: '#ec2127', bg: '#FEF2F2', bd: '#FECACA' },
  ]
  const trendRef   = useRef<HTMLCanvasElement>(null)
  const yoyRef     = useRef<HTMLCanvasElement>(null)
  const caRef      = useRef<HTMLCanvasElement>(null)
  const overdueRef = useRef<HTMLCanvasElement>(null)
  const caCompRef   = useRef<HTMLCanvasElement>(null)
  const trendChart = useRef<Chart | null>(null)
  const yoyChart   = useRef<Chart | null>(null)
  const caChart    = useRef<Chart | null>(null)
  const overdueChart = useRef<Chart | null>(null)
  const caCompChart = useRef<Chart | null>(null)

  const data          = getFilteredBills('monthly', appState.stateF, appState.branchF, appState.caF)
  const monthlyTotals = data.map(d => d.totalBill)
  const labels        = data.map(d => d.label)
  const maxVal        = Math.max(...monthlyTotals)
  const minVal        = Math.min(...monthlyTotals)
  const maxMonthIdx   = monthlyTotals.indexOf(maxVal)
  const minMonthIdx   = monthlyTotals.indexOf(minVal)
  const avgCurrent    = Math.round(monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length)
  const overallYoy    = 8

  const priorYear = monthlyTotals.map((v, i) => {
    const seed = (i * 7 + 3) % 15
    return Math.round(v * (0.85 + seed * 0.007))
  })
  const avgPrior = Math.round(priorYear.reduce((a, b) => a + b, 0) / priorYear.length)

  const yoyChanges = monthlyTotals.map((v, i) =>
    Math.round((v - priorYear[i]) / Math.max(priorYear[i], 1) * 100)
  )
  const priorYoyChanges = yoyChanges.map((v, i) => {
    const seed = (i * 7 + 3) % 15
    return Math.round(v * (0.80 + seed * 0.01))
  })

  const caCounts      = [112, 112, 124, 124, 132, 133, 133, 144, 135, 145, 155, 157]
  const priorCACounts = [98,  103, 100, 106, 110, 121, 120, 121, 124, 129, 129, 137]

  // Spend trend chart
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!trendRef.current) return
      const ctx = trendRef.current.getContext('2d')
      if (!ctx) return
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
              pointRadius: 4,
              pointHoverRadius: 6,
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
            legend: {
              display: true,
              position: 'top' as const,
              align: 'end' as const,
              labels: { boxWidth: 24, boxHeight: 2, color: '#858ea2', font: { size: 12 }, padding: 16 },
            },
            tooltip: {
              backgroundColor: '#192744',
              titleColor: '#fff',
              bodyColor: 'rgba(255,255,255,0.85)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: item => '  ' + item.dataset.label + ': ' + inrK(item.raw as number),
                footer: items => {
                  const curr  = items.find(i => i.datasetIndex === 0)?.raw as number ?? 0
                  const prior = items.find(i => i.datasetIndex === 1)?.raw as number ?? 0
                  const chg   = Math.round((curr - prior) / Math.max(prior, 1) * 100)
                  return 'YoY: ' + (chg > 0 ? '+' : '') + chg + '%'
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: { border: { display: false }, grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (trendChart.current) trendChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab])

  // Bill Trend chart - single current year line with last year avg as dashed reference line
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!trendRef.current) return
      const ctx = trendRef.current.getContext('2d')
      if (!ctx) return
      if (trendChart.current) trendChart.current.destroy()
      
      const billChg = avgCurrent > avgPrior 
        ? Math.round((avgCurrent - avgPrior) / avgPrior * 100)
        : Math.round((avgCurrent - avgPrior) / avgPrior * 100)
      
      trendChart.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Monthly outflow',
              data: monthlyTotals,
              borderColor: '#1c5af4',
              backgroundColor: 'rgba(28,90,244,0.06)',
              borderWidth: 2.5,
              pointBackgroundColor: '#1c5af4',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.35,
              fill: true,
            },
            {
              label: 'Last year avg',
              data: Array(12).fill(avgPrior),
              borderColor: '#F59E0B',
              borderDash: [6, 4],
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              pointRadius: 0,
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
              labels: { boxWidth: 24, boxHeight: 2, color: '#858ea2', font: { size: 12 }, padding: 16 },
            },
            tooltip: {
              backgroundColor: '#192744',
              titleColor: '#fff',
              bodyColor: 'rgba(255,255,255,0.85)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (item) => {
                  if (item.datasetIndex === 0) {
                    const curr = item.raw as number
                    const i = item.dataIndex
                    const prev = i > 0 ? monthlyTotals[i - 1] : 0
                    const momChg = prev > 0 ? Math.round((curr - prev) / prev * 100) : 0
                    const vsAvg = avgPrior > 0 ? Math.round((curr - avgPrior) / avgPrior * 100) : 0
                    return `Monthly outflow: ₹${inrK(curr)}  (${momChg > 0 ? '+' : ''}${momChg}% vs last month)\n(${Math.abs(vsAvg)}% ${vsAvg > 0 ? "above" : "below"} last year's avg)`
                  } else {
                    return `Last year avg: ₹${inrK(item.raw as number)}`
                  }
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: { border: { display: false }, grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (trendChart.current) trendChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab, monthlyTotals, avgCurrent, avgPrior])

  // YoY chart — current year vs prior year bill spend
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!yoyRef.current) return
      const ctx = yoyRef.current.getContext('2d')
      if (!ctx) return
      if (yoyChart.current) yoyChart.current.destroy()

      yoyChart.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Current year (CY)',
              data: monthlyTotals,
              borderColor: '#1c5af4',
              backgroundColor: 'rgba(28,90,244,0.06)',
              borderWidth: 2.5,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#1c5af4',
              pointBorderWidth: 2,
              pointRadius: 3.5,
              pointHoverRadius: 5,
              tension: 0.35,
              fill: true,
            },
            {
              label: 'Prior year (PY)',
              data: priorYear,
              borderColor: '#c8cbd6',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 3],
              pointRadius: 0,
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
                label: (item: any) => {
                  const val = item.raw as number
                  const prefix = item.datasetIndex === 0 ? '  CY: ' : '  PY: '
                  return prefix + '₹' + (val / 100000).toFixed(1) + 'L'
                },
                afterBody: (items: any) => {
                  const cy = items[0]?.raw as number
                  const py = items[1]?.raw as number
                  if (!cy || !py) return []
                  const chg = Math.round((cy - py) / Math.max(py, 1) * 100)
                  return ['', '  YoY: ' + (chg > 0 ? '↑ +' : '↓ ') + chg + '% vs same month last year']
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: { border: { display: false }, grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v) / 100000).toFixed(0) + 'L' } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (yoyChart.current) yoyChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab, yoyChanges])

  // CA additions line chart — same style as spend chart
  useEffect(() => {
    const timer = setTimeout(() => {
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
              pointRadius: 4,
              pointHoverRadius: 6,
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
            legend: {
              display: true,
              position: 'top' as const,
              align: 'end' as const,
              labels: { boxWidth: 24, boxHeight: 2, color: '#858ea2', font: { size: 12 }, padding: 16 },
            },
            tooltip: {
              backgroundColor: '#192744',
              titleColor: '#fff',
              bodyColor: 'rgba(255,255,255,0.85)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: item => '  ' + item.dataset.label + ': ' + item.raw + ' CAs',
                footer: items => {
                  const curr  = items.find(i => i.datasetIndex === 0)?.raw as number ?? 0
                  const prior = items.find(i => i.datasetIndex === 1)?.raw as number ?? 0
                  const chg   = Math.round((curr - prior) / Math.max(prior, 1) * 100)
                  return 'YoY: ' + (chg > 0 ? '+' : '') + chg + '%'
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: {
              border: { display: false },
              grid: { color: '#f3f4f6' },
              min: Math.floor(Math.min(...priorCACounts) * 0.88),
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => v + ' CAs' },
            },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (caChart.current) caChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab])

  // Overdue Trend useEffect - bar chart for overdue amounts (red bars) and line chart for overdue CA count (amber line, y2 axis)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!overdueRef.current) return
      const ctx = overdueRef.current.getContext('2d')
      if (!ctx) return
      if (overdueChart.current) overdueChart.current.destroy()
      
      // Generate mock overdue data
      const overdueAmounts = monthlyTotals.map((v, i) => Math.round(v * (0.065 + Math.random() * 0.02)))
      const overdueCACounts = caCounts.map((_, i) => Math.round(Math.random() * 25 + 5))
      
      overdueChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'bar' as const,
              label: 'Overdue amount',
              data: overdueAmounts,
              backgroundColor: 'rgba(236,33,39,0.15)',
              borderColor: '#ec2127',
              borderWidth: 1.5,
              borderRadius: 4,
              yAxisID: 'y',
            },
            {
              type: 'line' as const,
              label: 'Overdue CAs',
              data: overdueCACounts,
              borderColor: '#F59E0B',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              pointBackgroundColor: '#F59E0B',
              pointRadius: 3,
              tension: 0.35,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' as const, align: 'end' as const, labels: { boxWidth: 24, boxHeight: 2, color: '#858ea2', font: { size: 12 }, padding: 16 } },
            tooltip: {
              backgroundColor: '#192744',
              titleColor: '#fff',
              bodyColor: 'rgba(255,255,255,0.85)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (item) => {
                  return item.datasetIndex === 0 
                    ? `Overdue: ₹${inrK(item.raw as number)}`
                    : `Overdue CAs: ${item.raw}`
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: { 
              type: 'linear' as const,
              position: 'left' as const,
              border: { display: false }, 
              grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' } 
            },
            y1: {
              type: 'linear' as const,
              position: 'right' as const,
              border: { display: false },
              grid: { display: false },
              ticks: { color: '#F59E0B', font: { size: 11 } },
            },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (overdueChart.current) overdueChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab, monthlyTotals, caCounts])

  // CA comparison chart — bar for this year, line for last year (shows on spend tab)
  useEffect(() => {
    if (activeTab !== 'spend') return
    const timer = setTimeout(() => {
      if (!caCompRef.current) return
      const ctx = caCompRef.current.getContext('2d')
      if (!ctx) return
      if (caCompChart.current) caCompChart.current.destroy()
      caCompChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'bar' as const,
              label: 'CAs this year',
              data: caCounts,
              backgroundColor: 'rgba(28,90,244,0.15)',
              borderColor: '#1c5af4',
              borderWidth: 1.5,
              borderRadius: 3,
              yAxisID: 'y',
            },
            {
              type: 'line' as const,
              label: 'CAs last year',
              data: priorCACounts,
              borderColor: '#C4BFFF',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [5, 4],
              pointRadius: 2,
              pointBackgroundColor: '#C4BFFF',
              tension: 0.35,
              yAxisID: 'y',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index' as const, intersect: false },
          plugins: {
            legend: { display: true, position: 'top' as const, align: 'end' as const,
              labels: { boxWidth: 24, boxHeight: 2, color: '#858ea2', font: { size: 11 }, padding: 12 } },
            tooltip: {
              backgroundColor: '#192744', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.85)',
              padding: 10, cornerRadius: 4, displayColors: false,
              callbacks: {
                title: (items: any[]) => items[0].label,
                label: (item: any) => item.datasetIndex === 0
                  ? `  CAs this year: ${item.raw}`
                  : `  CAs last year: ${item.raw}`,
                afterLabel: (item: any) => {
                  if (item.datasetIndex !== 0) return ''
                  const i = item.dataIndex
                  const curr = caCounts[i]
                  const prior = priorCACounts[i]
                  const diff = curr - prior
                  const pct = Math.round(diff / Math.max(prior, 1) * 100)
                  const outflowCurr = monthlyTotals[i]
                  const outflowPrior = priorYear[i]
                  const outflowChg = Math.round((outflowCurr - outflowPrior) / Math.max(outflowPrior, 1) * 100)
                  const caDriver = Math.abs(pct) > Math.abs(outflowChg - pct)
                  return [
                    `  CA change: ${diff > 0 ? '+' : ''}${diff} (${pct > 0 ? '+' : ''}${pct}% vs last year)`,
                    `  Outflow change: ${outflowChg > 0 ? '+' : ''}${outflowChg}% — driven by ${caDriver ? '👥 CA additions' : '📈 avg bill increase'}`,
                  ].join('\n')
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 10 } } },
            y: { border: { display: false }, grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 10 }, callback: (v: any) => v + ' CAs' } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (caCompChart.current) caCompChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF, activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Summary cards - tab-aware */}
      {(() => {
        const billChg = Math.round((avgCurrent - avgPrior) / Math.max(avgPrior, 1) * 100)
        const avgYoy = Math.round(yoyChanges.reduce((a: number, v: number) => a + v, 0) / yoyChanges.length)
        const bestYoy = Math.max(...yoyChanges)
        const worstYoy = Math.min(...yoyChanges)
        const posMonths = yoyChanges.filter((v: number) => v > 0).length
        const avgCA = Math.round(caCounts.reduce((a: number, v: number) => a + v, 0) / caCounts.length)
        const avgOverdue = Math.round(avgCurrent * 0.065)
        const peakOverdue = Math.round(Math.max(...monthlyTotals) * 0.085)
        const overdueChg = 12

        const cards: Record<string, { label: string; value: string; sub: string; subColor: string }[]> = {
          spend: [
            { label: 'Avg monthly outflow — This year', value: inr(avgCurrent), sub: (billChg > 0 ? '+' : '') + billChg + '% vs last year', subColor: billChg > 0 ? '#ec2127' : '#15803D' },
            { label: 'Avg monthly outflow — Last year', value: inr(avgPrior), sub: 'prior year baseline', subColor: '#4F46E5' },
            { label: 'Peak month outflow', value: inr(Math.max(...monthlyTotals)), sub: labels[maxMonthIdx] + ' · highest', subColor: '#ec2127' },
            { label: 'Lowest month outflow', value: inr(Math.min(...monthlyTotals)), sub: labels[minMonthIdx] + ' · lowest', subColor: '#15803D' },
          ],
          yoy: [
            { label: 'Overall YoY change', value: (overallYoy > 0 ? '+' : '') + overallYoy + '%', sub: 'avg monthly spend vs prior year', subColor: overallYoy > 0 ? '#ec2127' : '#15803D' },
            { label: 'Highest cost increase', value: '+' + bestYoy + '%', sub: 'worst month vs last year', subColor: '#ec2127' },
            { label: 'Highest cost decrease', value: worstYoy + '%', sub: 'best month vs last year', subColor: '#15803D' },
            { label: 'Months cost went up', value: posMonths + ' / 12', sub: posMonths > 6 ? 'majority of year costlier' : 'majority of year cheaper', subColor: posMonths > 6 ? '#ec2127' : '#15803D' },
          ],
          ca: [
            { label: 'Total CAs — This year', value: String(caCounts[11]), sub: 'end of current year', subColor: '#1c5af4' },
            { label: 'Total CAs — Last year', value: String(priorCACounts[11]), sub: 'end of prior year', subColor: '#4F46E5' },
            { label: 'Peak CA month', value: String(Math.max(...caCounts)), sub: 'highest active CAs', subColor: '#15803D' },
            { label: 'Monthly avg CAs', value: String(avgCA), sub: 'avg active CAs per month', subColor: '#858ea2' },
          ],
          overdue: [
            { label: 'Avg overdue / month', value: inr(avgOverdue), sub: '6.5% of monthly outflow', subColor: '#ec2127' },
            { label: 'Peak overdue month', value: inr(peakOverdue), sub: 'highest single month', subColor: '#B91C1C' },
            { label: 'Overdue % of bill', value: '6.5%', sub: 'of total monthly outflow', subColor: '#B45309' },
            { label: 'Months worsening', value: '4 / 12', sub: 'overdue increased vs prior month', subColor: '#4F46E5' },
          ],
        }
        const summaryCards = cards[activeTab] || cards.spend
        return (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
            {summaryCards.map((k, i) => (
              <div key={k.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
                <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Single chart card with tabs */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px' }}>

        {/* Tab pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '99px', padding: '3px', gap: '2px' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ background: activeTab === t.key ? '#4F46E5' : 'transparent', color: activeTab === t.key ? '#fff' : '#6B7280', border: 'none', borderRadius: '99px', padding: '4px 14px', fontSize: '11.5px', fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#858ea2' }}>
            {appState.stateF !== 'all' ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') : 'All states'} · Apr 2024 – Mar 2025
          </div>
        </div>

        {/* Chart area */}
        {activeTab === 'spend' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              <canvas key='spend-canvas' ref={trendRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}></canvas>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '4px' }}>Active CA count — current vs last year</div>
            <div style={{ position: 'relative', width: '100%', height: '180px' }}>
              <canvas key='ca-comp-canvas' ref={caCompRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}></canvas>
            </div>
          </div>
        ) : activeTab === 'yoy' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
              {[
                { color: '#1c5af4', label: 'Current year (CY)', dash: false },
                { color: '#c8cbd6', label: 'Prior year (PY)',    dash: true  },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke={l.color} strokeWidth="2" strokeDasharray={l.dash ? '5 3' : 'none'}/></svg>
                  <span style={{ fontSize: '11px', color: '#858ea2' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', width: '100%', height: '280px' }}>
              <canvas key='yoy-canvas' ref={yoyRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}></canvas>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '280px' }}>
            {activeTab === 'ca'      && <canvas key='ca-canvas'      ref={caRef}      style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}></canvas>}
            {activeTab === 'overdue' && <canvas key='overdue-canvas' ref={overdueRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}></canvas>}
          </div>
        )}
      </div>

    </div>
  )
}
function BasicBillers({ appState, analyticsMode = 'basic' }: BasicSectionProps & { analyticsMode?: 'basic' | 'advanced' }) {
  const [statusView, setStatusView] = useState<'state'|'biller'>('state')

  const allCAs = Object.values(CAS).flat()
  const totalCAs = allCAs.length
  const caSchedule = allCAs.map((ca) => {
    const seed      = ca.charCodeAt(0) + ca.charCodeAt(ca.length - 1)
    const dueDay    = (seed % 25) + 3
    const billAmt   = Math.round(180000 + (seed % 50) * 4200)
    const isPaid    = (seed % 10) < 6
    const isOverdue = !isPaid && (seed % 10) < 8
    const isDueSoon = !isPaid && !isOverdue
    return { ca, dueDay, billAmt, isPaid, isOverdue, isDueSoon }
  })
  const byDay: Record<number, typeof caSchedule> = {}
  caSchedule.forEach(ca => {
    if (!byDay[ca.dueDay]) byDay[ca.dueDay] = []
    byDay[ca.dueDay].push(ca)
  })
  const totalUnpaid  = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const totalOverdue = caSchedule.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
  const overdueCount = caSchedule.filter(c => c.isOverdue).length
  const paidAmt      = caSchedule.filter(c => c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const paidCount    = caSchedule.filter(c => c.isPaid).length
  const approvalHold = Math.round(totalCAs * 0.068)
  const STATE_BILLERS: Record<string, string[]> = {
    'Maharashtra':['MSEDCL','BEST'], 'Karnataka':['BESCOM'],
    'Tamil Nadu':['TNEB'], 'Gujarat':['DGVCL','UGVCL'],
    'Delhi':['TPDDL','BSES Rajdhani'], 'Rajasthan':['JVVNL'],
    'Uttar Pradesh':['UPPCL'], 'West Bengal':['WBSEDCL'],
  }
  const CAS_PER_STATE: Record<string, number> = {}
  STATES.forEach(state => {
    CAS_PER_STATE[state] = (BRANCHES[state] ?? []).reduce((s, br) => s + (CAS[br]?.length ?? 0), 0)
  })
  const stateData = STATES.map(state => {
    const total = CAS_PER_STATE[state]
    const generated = Math.round(total * 0.757)
    const paid      = Math.round(total * 0.60)
    return { state, billers: (STATE_BILLERS[state] ?? []).length, total, generated, paid }
  })
  const billerData = STATES.flatMap(state => {
    const billers = STATE_BILLERS[state] ?? []
    const stateTotal = CAS_PER_STATE[state]
    return billers.map((biller, idx) => {
      const sf    = billers.length === 2 ? (idx === 0 ? 0.55 : 0.45) : 1.0
      const total = Math.round(stateTotal * sf)
      return { biller, state, total, generated: Math.round(total * 0.757), paid: Math.round(total * 0.60) }
    })
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Total unpaid',      value: inr(totalUnpaid),  sub: `${totalCAs - paidCount} CAs · current period`,         subColor: '#1D4ED8' },
          { label: 'Overdue',           value: inr(totalOverdue), sub: `${overdueCount} CAs past due date`,                          subColor: '#B91C1C' },
          { label: 'Approval pending',  value: `${approvalHold}`, sub: 'bills stuck in approval queue',                              subColor: '#B45309' },
          { label: 'Paid this period', value: inr(paidAmt), sub: `${paidCount} CAs · ${Math.round(paidCount/totalCAs*100)}% conversion`, subColor: '#15803D' },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>
      {/* CA Breakdown — shown in both Basic and Advanced */}
      {(() => {
        const total = totalCAs
        const prepaid  = Math.round(total * 0.39)
        const postpaid = total - prepaid
        const lt = Math.round(postpaid * 0.66)
        const ht = postpaid - lt
        const prepaidPct  = Math.round(prepaid / total * 100)
        const postpaidPct = Math.round(postpaid / total * 100)
        const ltPct = Math.round(lt / postpaid * 100)
        const htPct = Math.round(ht / postpaid * 100)
        // Donut ring
        const R = 52, STROKE = 10, SIZE = 120
        const circ = 2 * Math.PI * R
        const dashPrepaid  = (prepaidPct / 100) * circ
        const dashPostpaid = (postpaidPct / 100) * circ
        return (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '20px 24px', marginBottom: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Connection Type Breakdown</div>
                <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '3px' }}>Connection type by Active CAs</div>
              </div>

            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
              {/* Donut */}
              <div style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#E5E7EB" strokeWidth={STROKE}/>
                  {/* Postpaid — darker blue */}
                  <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#4F46E5" strokeWidth={STROKE}
                    strokeDasharray={`${dashPostpaid} ${circ - dashPostpaid}`} strokeLinecap="round"/>
                  {/* Prepaid — lighter blue, offset after postpaid */}
                  <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#93C5FD" strokeWidth={STROKE}
                    strokeDasharray={`${dashPrepaid} ${circ - dashPrepaid}`}
                    strokeDashoffset={-dashPostpaid} strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', lineHeight: 1 }}>{total}</div>
                  <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '2px' }}>CAs</div>
                </div>
              </div>
              {/* Bars */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Prepaid row */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#93C5FD' }}/>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>Prepaid</div>
                      <div style={{ fontSize: '12px', color: '#858ea2' }}>· no connection type</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: '#4F46E5' }}>{prepaid}</div>
                      <div style={{ fontSize: '12px', color: '#858ea2' }}>{prepaidPct}%</div>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: '#EEF2FF', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${prepaidPct}%`, height: '100%', background: 'linear-gradient(90deg, #818CF8, #4F46E5)', borderRadius: '99px' }}/>
                  </div>
                </div>
                {/* Postpaid row */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4F46E5' }}/>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>Postpaid</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: '#4F46E5' }}>{postpaid}</div>
                      <div style={{ fontSize: '12px', color: '#858ea2' }}>{postpaidPct}%</div>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: '#EEF2FF', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${postpaidPct}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #3730A3)', borderRadius: '99px' }}/>
                  </div>
                  {/* LT / HT sub-cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    {[
                      { key: 'LT', label: 'Low Tension',  count: lt, pct: ltPct, bg: '#EEF2FF', color: '#4F46E5', bd: '#C7D2FE' },
                      { key: 'HT', label: 'High Tension', count: ht, pct: htPct, bg: '#F5F3FF', color: '#7C3AED', bd: '#DDD6FE' },
                    ].map(t => (
                      <div key={t.key} style={{ background: t.bg, border: `1px solid ${t.bd}`, borderRadius: '4px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: t.color, background: '#fff', border: `1px solid ${t.bd}`, borderRadius: '4px', padding: '1px 6px' }}>{t.key}</div>
                          <div style={{ fontSize: '12px', color: '#858ea2' }}>{t.pct}%</div>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: t.color, lineHeight: 1, marginBottom: '3px' }}>{t.count}</div>
                        <div style={{ fontSize: '12px', color: t.color, opacity: 0.7 }}>{t.label}</div>
                        <div style={{ height: '4px', background: '#fff', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
                          <div style={{ width: `${t.pct}%`, height: '100%', background: t.color, borderRadius: '99px', opacity: 0.6 }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      {analyticsMode === 'advanced' && (() => {
        // Digital bill copy block v2 — redesigned 2026-04-28
        const TOTAL_CAS_DBC = totalCAs
        const optedIn  = Math.round(TOTAL_CAS_DBC * 0.75)
        const received = Math.round(TOTAL_CAS_DBC * 0.59)
        const pending  = Math.round(TOTAL_CAS_DBC * 0.10)
        const failed   = Math.round(TOTAL_CAS_DBC * 0.06)
        const failedPct = Math.round(failed / Math.max(optedIn, 1) * 100)
        const multiBillCount = 4
        const multiBillCAs = 8
        const dbcTableData = [
          { biller: 'MSEDCL',        state: 'Maharashtra', opted: 22, received: 19, pending: 3, failed: 2 },
          { biller: 'BSES Rajdhani', state: 'Delhi',       opted: 18, received: 15, pending: 4, failed: 1 },
          { biller: 'BESCOM',        state: 'Karnataka',   opted: 17, received: 14, pending: 2, failed: 3 },
          { biller: 'TNEB',          state: 'Tamil Nadu',  opted: 19, received: 17, pending: 3, failed: 1 },
          { biller: 'UGVCL',         state: 'Gujarat',     opted: 16, received: 13, pending: 2, failed: 2 },
          { biller: 'DVVNL',         state: 'Uttar Pradesh', opted: 15, received: 11, pending: 3, failed: 3 },
          { biller: 'WBSEDCL',       state: 'West Bengal', opted: 14, received: 11, pending: 1, failed: 2 },
          { biller: 'JVVNL',         state: 'Rajasthan',   opted: 13, received: 11, pending: 1, failed: 1 },
          { biller: 'BBMB Rajpur',   state: 'Multiple',    opted: 7,  received: 7,  pending: 1, failed: 0 },
        ]
        const [dbcView, setDbcView] = useState<'Biller'|'State'|'Branch'>('Biller')

        // Aggregate by state for State view
        const stateData = Object.entries(
          dbcTableData.reduce((acc, r) => {
            const k = r.state === 'Multiple' ? 'Multiple' : r.state
            if (!acc[k]) acc[k] = { state: k, opted: 0, received: 0, pending: 0, failed: 0 }
            acc[k].opted += r.opted; acc[k].received += r.received
            acc[k].pending += r.pending; acc[k].failed += r.failed
            return acc
          }, {} as Record<string, { state: string; opted: number; received: number; pending: number; failed: number }>)
        ).map(([, v]) => ({ ...v, pct: v.opted > 0 ? Math.round(v.received / v.opted * 100) : 0 }))

        // Branch data derived from CAS/BRANCHES
        const branchData = Object.entries(BRANCHES)
          .filter(([st]) => appState.stateF === 'all' || st === appState.stateF)
          .flatMap(([st, brs]) => brs.map(br => {
            const cas = CAS[br]?.length ?? 0
            const opted = Math.round(cas * 0.75)
            const received = Math.round(opted * 0.787)
            const pending = Math.round(opted * 0.138)
            const failed = opted - received - pending
            return { name: br, sub: st, opted, received, pending, failed, pct: opted > 0 ? Math.round(received / opted * 100) : 0 }
          })).sort((a, b) => b.opted - a.opted).slice(0, 10)

        const items = dbcView === 'Biller'
          ? dbcTableData.map(r => ({ ...r, name: r.biller, sub: r.state, pct: r.opted > 0 ? Math.round(r.received / r.opted * 100) : 0 }))
          : dbcView === 'Branch'
          ? branchData
          : stateData.map(r => ({ ...r, name: r.state, sub: '', pct: r.opted > 0 ? Math.round(r.received / r.opted * 100) : 0 }))

        const cols = items.length <= 5 ? items.length : items.length <= 8 ? 4 : 5

        return (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px 24px', marginBottom: '12px' }}>

            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#192744' }}>Digital Bill Copy — Postpaid Billers</div>
                <div style={{ fontSize: '13px', color: '#858ea2', marginTop: '4px' }}>Bill Copies Status — Current month</div>
              </div>
              <div style={{ fontSize: '11.5px', color: '#858ea2' }}>Updated daily · Apr 2025</div>
            </div>

            {/* Funnel cards — 4 col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {([
                { label: 'Bill Copy Active', sublabel: `${TOTAL_CAS_DBC} Active CAs`, count: optedIn, pct: Math.round(optedIn/Math.max(TOTAL_CAS_DBC,1)*100), tone: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', accent: '#4F46E5' } },
                { label: 'Received',         sublabel: 'Bill copy fetched',           count: received, pct: Math.round(received/Math.max(optedIn,1)*100),     tone: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' } },
                { label: 'Pending',          sublabel: 'Fetch in progress',           count: pending,  pct: Math.round(pending/Math.max(optedIn,1)*100),      tone: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
                { label: 'Failed',           sublabel: 'Fetch error · needs fix',count: failed,   pct: Math.round(failed/Math.max(optedIn,1)*100),       tone: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
              ] as const).map((step, i) => {
                const r2 = 18, stroke = 4, size = 44
                const circ = 2 * Math.PI * r2
                const dash = (step.pct / 100) * circ
                return (
                  <div key={step.label} style={{ background: step.tone.bg, border: `1px solid ${step.tone.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <div style={{ fontSize: '36px', fontWeight: 700, color: step.tone.text, lineHeight: 1 }}>{step.count}</div>
                          {i === 0 && <div style={{ fontSize: '13px', fontWeight: 500, color: step.tone.text, opacity: 0.5 }}>/ {TOTAL_CAS_DBC}</div>}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: step.tone.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '6px' }}>{step.label}</div>
                        <div style={{ fontSize: '11.5px', color: step.tone.text, opacity: 0.6, marginTop: '3px' }}>{step.sublabel}</div>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke={step.tone.accent + '33'} strokeWidth={stroke}/>
                          <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke={step.tone.accent} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
                        </svg>
                        <div style={{ position: 'absolute', fontSize: '10px', fontWeight: 700, color: step.tone.text }}>{step.pct}%</div>
                      </div>
                    </div>
                    {i > 0 && (
                      <div style={{ height: '3px', borderRadius: '99px', background: step.tone.accent + '22', overflow: 'hidden' }}>
                        <div style={{ width: `${step.pct}%`, height: '100%', background: step.tone.accent, borderRadius: '99px' }}/>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Attention needed cards — white + borderLeft */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {([
                { accent: '#EF4444', accentL: '#FEF2F2', accentBd: '#FECACA', accentD: '#B91C1C', title: 'Failed bill copies', value: String(failed),   sub: failedPct + '% failure rate',                                          detail: 'Check biller API. Repeated failures block payment.',           cta: 'Fix now' },
                { accent: '#F59E0B', accentL: '#FFFBEB', accentBd: '#FDE68A', accentD: '#B45309', title: 'Pending > 48 hrs',   value: String(Math.round(pending * 0.44)), sub: 'of ' + pending + ' pending',                     detail: 'Bills stalled over 48 hrs — manual intervention needed.', cta: 'Review' },
                { accent: '#22C55E', accentL: '#F0FDF4', accentBd: '#BBF7D0', accentD: '#15803D', title: 'Opt-in coverage',    value: Math.round(optedIn/Math.max(TOTAL_CAS_DBC,1)*100) + '%', sub: optedIn + ' of ' + TOTAL_CAS_DBC + ' CAs', detail: (TOTAL_CAS_DBC - optedIn) + ' CAs yet to opt in. Consider nudging.', cta: 'View' },
                { accent: '#3B82F6', accentL: '#EFF6FF', accentBd: '#BFDBFE', accentD: '#1D4ED8', title: 'Multi-bill billers', value: String(multiBillCount), sub: 'billers',                                                     detail: multiBillCAs + ' CAs received 2+ bills. Review for duplicates.', cta: 'Check' },
              ] as const).map((card, ci) => (
                <div key={ci} style={{ background: '#fff', border: `1px solid #E5E7EB`, borderTop: `2.5px solid ${card.accent}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.accent, flexShrink: 0 }} />
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: card.accentD, lineHeight: 1 }}>{card.value}</div>
                    <div style={{ fontSize: '11.5px', color: card.accentD, opacity: 0.65 }}>{card.sub}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#858ea2', lineHeight: 1.5, flex: 1 }}>{card.detail}</div>
                  <button style={{ alignSelf: 'flex-start', background: '#fff', border: `1px solid ${card.accentBd}`, borderRadius: '6px', color: card.accentD, fontSize: '11px', fontWeight: 600, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {card.cta} →
                  </button>
                </div>
              ))}
            </div>

            {/* Bill copy status — donut grid */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>Bill Copy Status — by {dbcView}</div>
                  <div style={{ fontSize: '11.5px', color: '#858ea2', marginTop: '2px' }}>Opt-in CAs, delivery status and coverage</div>
                </div>
                <div style={{ display: 'flex', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '99px', padding: '3px', gap: '2px' }}>
                  {(['Biller','State','Branch'] as const).map(v => (
                    <button key={v} onClick={() => setDbcView(v)} style={{ background: dbcView === v ? '#4F46E5' : 'transparent', color: dbcView === v ? '#fff' : '#6B7280', border: 'none', borderRadius: '99px', padding: '4px 14px', fontSize: '11.5px', fontWeight: dbcView === v ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Donut cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}>
                {items.map((b, i) => {
                  const color = b.pct >= 85 ? '#22C55E' : b.pct >= 75 ? '#F59E0B' : '#EF4444'
                  const bg    = b.pct >= 85 ? '#F0FDF4' : b.pct >= 75 ? '#FFFBEB' : '#FEF2F2'
                  const bd    = b.pct >= 85 ? '#BBF7D0' : b.pct >= 75 ? '#FDE68A' : '#FECACA'
                  const textC = b.pct >= 85 ? '#15803D' : b.pct >= 75 ? '#B45309' : '#B91C1C'
                  const r3 = 26, stroke3 = 5, size3 = 64
                  const circ3 = 2 * Math.PI * r3
                  const dash3 = (b.pct / 100) * circ3
                  return (
                    <div key={b.name} style={{ background: '#fff', border: `1px solid #E5E7EB`, borderRadius: '12px', padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      {/* Donut */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width={size3} height={size3} viewBox={`0 0 ${size3} ${size3}`} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={size3/2} cy={size3/2} r={r3} fill="none" stroke={color + '33'} strokeWidth={stroke3}/>
                          <circle cx={size3/2} cy={size3/2} r={r3} fill="none" stroke={color} strokeWidth={stroke3} strokeDasharray={`${dash3} ${circ3 - dash3}`} strokeLinecap="round"/>
                        </svg>
                        <div style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: textC }}>{b.pct}%</div>
                      </div>
                      {/* Name */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744', lineHeight: 1.3 }}>{b.name}</div>
                        {b.sub && <div style={{ fontSize: '10.5px', color: '#858ea2', marginTop: '3px' }}>{b.sub}</div>}
                      </div>
                      {/* Expected */}
                      <div style={{ fontSize: '12px', color: '#858ea2', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#192744' }}>{b.opted}</span> Expected Bill Copies
                      </div>
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>{b.received}</div>
                          <div style={{ fontSize: '9.5px', color: '#858ea2' }}>rcvd</div>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }}/>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>{b.pending}</div>
                          <div style={{ fontSize: '9.5px', color: '#858ea2' }}>pend</div>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }}/>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{b.failed}</div>
                          <div style={{ fontSize: '9.5px', color: '#858ea2' }}>fail</div>
                        </div>
                      </div>
                      {/* Stacked bar */}
                      <div style={{ display: 'flex', height: '4px', borderRadius: '99px', overflow: 'hidden', background: '#F3F4F6', gap: '1px', width: '100%' }}>
                        <div style={{ width: `${(b.received/Math.max(b.opted,1))*100}%`, background: '#22C55E' }}/>
                        <div style={{ width: `${(b.pending/Math.max(b.opted,1))*100}%`, background: '#F59E0B' }}/>
                        <div style={{ width: `${(b.failed/Math.max(b.opted,1))*100}%`, background: '#EF4444' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
      {/* BBPS_Billers — Basic only, independent copy, do not modify Advanced */}
      {analyticsMode !== 'advanced' && (() => {
        const dbcBasic = [
          { biller: 'MSEDCL',        state: 'Maharashtra', opted: 22, received: 19, pending: 3, failed: 2 },
          { biller: 'BSES Rajdhani', state: 'Delhi',       opted: 18, received: 15, pending: 4, failed: 1 },
          { biller: 'BESCOM',        state: 'Karnataka',   opted: 17, received: 14, pending: 2, failed: 3 },
          { biller: 'TNEB',          state: 'Tamil Nadu',  opted: 19, received: 17, pending: 3, failed: 1 },
          { biller: 'UGVCL',         state: 'Gujarat',     opted: 16, received: 13, pending: 2, failed: 2 },
          { biller: 'DVVNL',         state: 'Uttar Pradesh', opted: 15, received: 11, pending: 3, failed: 3 },
          { biller: 'WBSEDCL',       state: 'West Bengal', opted: 14, received: 11, pending: 1, failed: 2 },
          { biller: 'JVVNL',         state: 'Rajasthan',   opted: 13, received: 11, pending: 1, failed: 1 },
        ]
        const [basicDbcView, setBasicDbcView] = useState<'Biller'|'State'|'Branch'>('Biller')
        const basicStateData = Object.entries(
          dbcBasic.reduce((acc, r) => {
            if (!acc[r.state]) acc[r.state] = { state: r.state, opted: 0, received: 0, pending: 0, failed: 0 }
            acc[r.state].opted += r.opted; acc[r.state].received += r.received
            acc[r.state].pending += r.pending; acc[r.state].failed += r.failed
            return acc
          }, {} as Record<string, { state: string; opted: number; received: number; pending: number; failed: number }>)
        ).map(([, v]) => ({ biller: v.state, ...v, state: '' }))
        const basicBranchData = Object.entries(BRANCHES)
          .filter(([st]) => appState.stateF === 'all' || st === appState.stateF)
          .flatMap(([st, brs]) => brs.map(br => {
            const cas = CAS[br]?.length ?? 0
            const opted = Math.round(cas * 0.75)
            const received = Math.round(opted * 0.787)
            const pending = Math.round(opted * 0.138)
            const failed = opted - received - pending
            return { biller: br, state: st, opted, received, pending, failed }
          })).sort((a, b) => b.opted - a.opted).slice(0, 8)
        const basicItems = basicDbcView === 'Biller' ? dbcBasic : basicDbcView === 'Branch' ? basicBranchData : basicStateData
        const basicCols = basicItems.length <= 5 ? basicItems.length : basicItems.length <= 8 ? 4 : 5
        return (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Bill Status — by {basicDbcView}</div>
                <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>BBPS fetch status</div>
              </div>
              <div style={{ display: 'flex', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '99px', padding: '3px', gap: '2px' }}>
                {(['Biller','State','Branch'] as const).map(v => (
                  <button key={v} onClick={() => setBasicDbcView(v)} style={{ background: basicDbcView === v ? '#4F46E5' : 'transparent', color: basicDbcView === v ? '#fff' : '#6B7280', border: 'none', borderRadius: '99px', padding: '4px 14px', fontSize: '11.5px', fontWeight: basicDbcView === v ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>{v}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${basicCols}, 1fr)`, gap: '12px' }}>
              {basicItems.map((b) => {
                const pct = b.opted > 0 ? Math.round(b.received / b.opted * 100) : 0
                const color = pct >= 85 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444'
                const textC = pct >= 85 ? '#15803D' : pct >= 75 ? '#B45309' : '#B91C1C'
                const r2 = 26, stroke2 = 5, size2 = 64
                const circ2 = 2 * Math.PI * r2
                const dash2 = (pct / 100) * circ2
                return (
                  <div key={b.biller} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={size2} height={size2} viewBox={`0 0 ${size2} ${size2}`} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={size2/2} cy={size2/2} r={r2} fill="none" stroke={color + '33'} strokeWidth={stroke2}/>
                        <circle cx={size2/2} cy={size2/2} r={r2} fill="none" stroke={color} strokeWidth={stroke2} strokeDasharray={`${dash2} ${circ2 - dash2}`} strokeLinecap="round"/>
                      </svg>
                      <div style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: textC }}>{pct}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{b.biller}</div>
                      <div style={{ fontSize: '10.5px', color: '#858ea2', marginTop: '3px' }}>{b.state}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#858ea2', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#192744' }}>{b.opted}</span> Expected Bills
                    </div>
                    <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>{b.received}</div>
                        <div style={{ fontSize: '9.5px', color: '#858ea2' }}>rcvd</div>
                      </div>
                      <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }}/>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>{b.pending}</div>
                        <div style={{ fontSize: '9.5px', color: '#858ea2' }}>pend</div>
                      </div>
                      <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }}/>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{b.failed}</div>
                        <div style={{ fontSize: '9.5px', color: '#858ea2' }}>fail</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', height: '4px', borderRadius: '99px', overflow: 'hidden', background: '#F3F4F6', gap: '1px', width: '100%' }}>
                      <div style={{ width: `${(b.received/Math.max(b.opted,1))*100}%`, background: '#22C55E' }}/>
                      <div style={{ width: `${(b.pending/Math.max(b.opted,1))*100}%`, background: '#F59E0B' }}/>
                      <div style={{ width: `${(b.failed/Math.max(b.opted,1))*100}%`, background: '#EF4444' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
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
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '4px', padding: '16px 18px' }}>

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
