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
  const weeks = [
    { label: 'Week 1 (1–7)',   days: [1,2,3,4,5,6,7]       },
    { label: 'Week 2 (8–14)',  days: [8,9,10,11,12,13,14]   },
    { label: 'Week 3 (15–21)', days: [15,16,17,18,19,20,21] },
    { label: 'Week 4 (22–28)', days: [22,23,24,25,26,27,28] },
  ]
  const weeklyAmounts = weeks.map(w => {
    const cas     = w.days.flatMap(d => byDay[d] ?? [])
    const unpaid  = cas.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
    const overdue = cas.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
    return { ...w, unpaid, overdue, count: cas.length, unpaidCount: cas.filter(c => !c.isPaid).length }
  })
  const totalUnpaid  = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)

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

      {/* KPI bar — single unified card with dividers */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Portfolio value',       value: inr(totalBill),                                                                          sub: `${totalStates} states · ${totalCAs} active CAs`,                                                 accent: '#4F46E5' },
          { label: 'Avg bill per CA',        value: inr(avgBill),                                                                            sub: 'per billing period',                                                                               accent: '#111827' },
          { label: 'Period over period',     value: `${momChange > 0 ? '+' : ''}${momChange}%`,                                            sub: `${momLabel} vs ${momPrevLabel}${appState.stateF !== 'all' ? ' · ' + appState.stateF : ''}`,   accent: momChange > 0 ? '#15803D' : momChange < 0 ? '#15803D' : '#B45309' },
          { label: 'Due this month',         value: `${billsDueCount}`,                                                                    sub: `${inr(billsDueAmount)} · next 30 days`,                                                          accent: '#B45309' },
        ].map((kpi, i) => (
          <div key={kpi.label} style={{ flex: i === 0 ? 1.4 : 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: kpi.accent, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{kpi.sub}</div>
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
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bill generation funnel</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Overall conversion: <span style={{ fontWeight: 700, color: '#15803D' }}>60%</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', marginBottom: '16px' }}>
              {[
                { label: 'Active CAs',      value: totalCAs,                          pct: 100,  color: '#4F46E5', bg: '#EEF2FF', bd: '#C7D2FE' },
                { label: 'Bills generated', value: Math.round(totalCAs * 0.757),      pct: 75.7, color: '#1D4ED8', bg: '#EFF6FF', bd: '#BFDBFE' },
                { label: 'Bills paid',      value: Math.round(totalCAs * 0.60),       pct: 60,   color: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
              ].map((step, i) => (
                <div key={step.label} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                  <div style={{ flex: 1, background: step.bg, border: `1px solid ${step.bd}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: step.color, lineHeight: 1 }}>{step.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: step.color, marginTop: '5px' }}>{step.label}</div>
                    <div style={{ fontSize: '11px', color: step.color, opacity: 0.55, marginTop: '2px' }}>{step.pct}% of {totalCAs}</div>
                    {i < 2 && (
                      <div style={{ position: 'absolute', top: '50%', right: '-22px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', zIndex: 2 }}>
                        <div style={{ background: i === 0 ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${i === 0 ? '#FDE68A' : '#FECACA'}`, borderRadius: '5px', padding: '1px 5px', fontSize: '10px', fontWeight: 700, color: i === 0 ? '#B45309' : '#B91C1C', whiteSpace: 'nowrap' }}>
                          −{i === 0 ? Math.round(totalCAs * 0.243) : Math.round(totalCAs * 0.157)}
                        </div>
                        <div style={{ color: '#9CA3AF', fontSize: '12px' }}>→</div>
                      </div>
                    )}
                  </div>
                  {i < 2 && <div style={{ width: '16px', flexShrink: 0 }}/>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F3F4F6', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }}/>
              <div style={{ fontSize: '12px', color: '#6B7280' }}><span style={{ fontWeight: 600, color: '#111827' }}>{Math.round(totalCAs * 0.068)} CAs</span> on approval hold — excluded from paid count</div>
            </div>
          {/* Due date calendar */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '16px 18px', marginTop: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>Due date calendar</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>Bills due per day · current month</div>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '11px', color: '#6B7280', flexWrap: 'wrap' }}>
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
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>Weekly capital plan</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Current month · plan ahead</div>
              </div>
              <div style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: '10px', padding: '6px 14px', textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#4F46E5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Month total</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#4338CA' }}>{inr(totalUnpaid)}</div>
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
                      <div style={{ fontSize: '10px', fontWeight: isAct ? 700 : 500, color: isAct ? '#111827' : '#6B7280' }}>{inr(w.unpaid)}</div>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '72px', borderRadius: '5px', overflow: 'hidden', background: isAct ? (hasOD ? '#FEF2F2' : '#EEF2FF') : '#F3F4F6' }}>
                        {safeH > 0 && <div style={{ height: safeH+'px', background: isAct ? '#7B6FE8' : '#C7D2FE' }} />}
                        {overdueH > 0 && <div style={{ height: overdueH+'px', background: isAct ? '#EF4444' : '#FECACA' }} />}
                      </div>
                      <div style={{ fontSize: '10px', color: isAct ? '#4F46E5' : '#9CA3AF' }}>W{wi+1}</div>
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
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>{w.label}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{w.count} bills</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: hasOD ? '#EF4444' : '#4338CA', margin: '4px 0' }}>{inr(w.unpaid)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF' }}>
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
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment status</div>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>of {Math.round(totalCAs * 0.757)} approved</span>
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
              {[
                { pct: 60, color: '#22C55E' },
                { pct: 25, color: '#F59E0B' },
                { pct: 10, color: '#9CA3AF' },
                { pct: 5,  color: '#EF4444' },
                { pct: 4,  color: '#4F46E5' },
              ].map((s, i) => <div key={i} style={{ width: s.pct+'%', background: s.color, borderRadius: '99px' }}/>)}
            </div>
            {[
              { label: 'Paid',    count: Math.round(totalCAs*0.60), pct: 60, color: '#22C55E', textColor: '#15803D' },
              { label: 'Pending', count: Math.round(totalCAs*0.25), pct: 25, color: '#F59E0B', textColor: '#B45309' },
              { label: 'On hold', count: Math.round(totalCAs*0.10), pct: 10, color: '#9CA3AF', textColor: '#6B7280' },
              { label: 'Overdue',   count: Math.round(totalCAs*0.05), pct: 5,  color: '#EF4444', textColor: '#B91C1C' },
              { label: 'Adjusted', count: Math.round(totalCAs*0.04), pct: 4,  color: '#4F46E5', textColor: '#4338CA' },
            ].map((s, i, arr) => (
              <div key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#4F46E5', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#C7D2FE', textUnderlineOffset: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.textColor, lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', width: '34px', textAlign: 'right' }}>{s.pct}%</div>
                </div>
                {i < arr.length - 1 && <div style={{ height: '1px', background: '#F3F4F6' }}/>}
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#F3F4F6' }}/>

          {/* Approval queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approval queue</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Pending',  count: 48,  textColor: '#B45309', bg: '#FFFBEB', bd: '#FDE68A' },
                { label: 'Approved', count: 312, textColor: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' },
                { label: 'On Hold',  count: 28,  textColor: '#6B7280', bg: '#F9FAFB', bd: '#E5E7EB' },
                { label: 'Rejected', count: 12,  textColor: '#B91C1C', bg: '#FEF2F2', bd: '#FECACA' },
              ].map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: a.bg, border: `1px solid ${a.bd}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: a.textColor, lineHeight: 1 }}>{a.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: a.textColor }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: '#F3F4F6' }}/>

          {/* Action required */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action required</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { label: 'Fetch failed',    sub: 'BBPS error · payment blocked',  count: 34,  tone: { bg: '#FEF2F2', bd: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
                { label: 'Not generated',   sub: 'Active CAs · no bill yet',      count: 170, tone: { bg: '#FFFBEB', bd: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
                { label: 'Copy pending',    sub: 'Bill copy being fetched',        count: 62,  tone: { bg: '#EFF6FF', bd: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' } },
                { label: 'Duplicate bills', sub: 'Same bill fetched more than once', count: 8,   tone: { bg: '#FFFBEB', bd: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
              ].map(a => (
                <div key={a.label} style={{ padding: '10px 12px', background: a.tone.bg, border: `1px solid ${a.tone.bd}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: a.tone.accent, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: a.tone.text }}>{a.label}</div>
                      <div style={{ fontSize: '11px', color: a.tone.text, opacity: 0.7 }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: a.tone.text, lineHeight: 1 }}>{a.count}</div>
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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        <div style={{ flex: 1.4, padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top location</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(topItem as any).name ?? (topItem as any).state ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{inr(topItem.total)} · {Math.round(topItem.total/portfolioTotal*100)}% of portfolio</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Avg spend per location</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{inr(avgSpend)}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{showBranches ? appState.stateF + ' · current period' : 'across all states · current period'}</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top branch</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branchRows[0]?.name ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{branchRows[0] ? '���' + (branchRows[0].total/100000).toFixed(1) + 'L' : 'No data'}</div>
        </div>
        <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Top CA</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caRows[0]?.name ?? '—'}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{caRows[0] ? '₹' + (caRows[0].total/100000).toFixed(1) + 'L' : 'No data'}</div>
        </div>
      </div>

      {/* Heatmap or branches listing based on filter */}
      {!showBranches && (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '24px', marginBottom: '12px' }}>

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
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px' }}>
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

      {/* Top states by spend */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '22px 24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top states by spend</div>
          <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>View all →</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {stateData.slice(0, 8).map((s, i) => (
            <div key={s.state}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, width: '16px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{s.state}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>{(BRANCHES[s.state] ?? []).length} branches · {s.cas} CAs</div>
                  <div style={{ height: '4px', background: '#F3F4F6', borderRadius: '99px' }}>
                    <div style={{ height: '100%', width: `${s.total / Math.max(stateData[0].total, 1) * 100}%`, background: i === 0 ? '#4F46E5' : '#C7D2FE', borderRadius: '99px' }}/>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{inr(s.total)}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{Math.round(s.total / portfolioTotal * 100)}%</div>
                </div>
              </div>
              {i < 7 && <div style={{ height: '1px', background: '#F3F4F6' }}/>}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function BasicTrends({ appState }: BasicSectionProps) {
  const trendRef   = useRef<HTMLCanvasElement>(null)
  const yoyRef     = useRef<HTMLCanvasElement>(null)
  const caRef      = useRef<HTMLCanvasElement>(null)
  const spendTrendRef   = useRef<HTMLCanvasElement>(null)
  const trendChart = useRef<Chart | null>(null)
  const yoyChart   = useRef<Chart | null>(null)
  const caChart    = useRef<Chart | null>(null)
  const spendTrendChart = useRef<Chart | null>(null)

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
  }, [appState.stateF, appState.branchF, appState.caF])

  // Monthly spend trend chart (simple line chart)
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
            borderColor: '#4F46E5',
            borderWidth: 2,
            backgroundColor: 'rgba(79,70,229,0.06)',
            pointBackgroundColor: monthlyTotals.map((_, i) =>
              i === maxMonthIdx ? '#4F46E5' : i === minMonthIdx ? '#15803D' : '#fff'
            ),
            pointBorderColor: '#4F46E5',
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
                  const lines = []
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
    }, 100)
    return () => {
      clearTimeout(timer)
      if (spendTrendChart.current) spendTrendChart.current.destroy()
    }
  }, [labels, monthlyTotals, maxVal, minVal, maxMonthIdx, minMonthIdx])

  // YoY change line chart — same style as spend chart
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
              label: 'Current year',
              data: yoyChanges,
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
              data: priorYoyChanges,
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
                label: item => '  ' + item.dataset.label + ': ' + (item.raw as number > 0 ? '+' : '') + item.raw + '%',
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: { border: { display: false }, grid: { color: '#f3f4f6' },
              ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => v + '%' } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(timer); if (yoyChart.current) yoyChart.current.destroy() }
  }, [appState.stateF, appState.branchF, appState.caF])

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
  }, [appState.stateF, appState.branchF, appState.caF])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Summary cards */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Overall YoY change', value: (overallYoy > 0 ? '+' : '') + overallYoy + '%', sub: 'avg monthly spend vs prior year',               subColor: overallYoy > 0 ? '#B45309' : '#15803D' },
          { label: 'Peak month',         value: labels[maxMonthIdx],                              sub: inr(monthlyTotals[maxMonthIdx]) + ' · highest spend', subColor: '#B91C1C' },
          { label: 'Lowest month',       value: labels[minMonthIdx],                              sub: inr(monthlyTotals[minMonthIdx]) + ' · lowest spend',  subColor: '#15803D' },
          { label: 'Monthly average',    value: inr(avgCurrent),                                  sub: 'vs ' + inr(avgPrior) + ' prior year',           subColor: '#1D4ED8' },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly spend trend */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '22px 24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Monthly spend trend</div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>Total bill amount per month · Apr 2024 – Mar 2025</div>
        <div style={{ position: 'relative', width: '100%', height: '200px' }}>
          <canvas ref={spendTrendRef}></canvas>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {[
            { label: 'Lowest month', value: inr(Math.min(...monthlyTotals)), color: '#15803D' },
            { label: 'Monthly avg',  value: inr(Math.round(monthlyTotals.reduce((a:number,v:number)=>a+v,0)/monthlyTotals.length)), color: '#111827' },
            { label: 'Peak month',   value: inr(Math.max(...monthlyTotals)), color: '#1D4ED8' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#F3F4F6', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly spend — current vs prior year */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Monthly spend — current vs prior year</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>
              {appState.stateF !== 'all'
                ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') + ' · current vs prior year · monthly'
                : 'All states · current vs prior year · monthly'}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <canvas ref={trendRef}></canvas>
        </div>
      </div>

      {/* YoY change — line chart */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Month-by-month YoY change</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>
              {appState.stateF !== 'all'
                ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') + ' · % change vs prior year'
                : 'All states · % change vs same month prior year'}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <canvas ref={yoyRef}></canvas>
        </div>
      </div>

      {/* CA additions — line chart */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>CA additions — current vs prior year</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>
              {appState.stateF !== 'all'
                ? appState.stateF + (appState.branchF !== 'all' ? ' · ' + appState.branchF : '') + ' · active CAs per month'
                : 'All states · active CAs per month'}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <canvas ref={caRef}></canvas>
        </div>
      </div>

    </div>
  )
}
function BasicDueDates({ appState }: BasicSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState(0) // 0 = current month view
  const [activeWeek, setActiveWeek] = useState<number | null>(null)

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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Total unpaid',      value: inr(totalUnpaid),   sub: `${totalCAs - caSchedule.filter(c=>c.isPaid).length} CAs · current period`,                                                                                                  subColor: '#1D4ED8' },
          { label: 'Overdue',           value: inr(totalOverdue),  sub: `${overdueCount} CAs past due date`,                                                                                                                                                subColor: '#B91C1C' },
          { label: 'Due within 7 days', value: inr(totalDueSoon),  sub: `${dueSoonCount} CAs · pay to avoid late charges`,                                                                                                                             subColor: '#B45309' },
          { label: 'Paid this period',  value: inr(caSchedule.filter(c=>c.isPaid).reduce((s,c)=>s+c.billAmt,0)), sub: `${caSchedule.filter(c=>c.isPaid).length} CAs · ${Math.round(caSchedule.filter(c=>c.isPaid).length/totalCAs*100)}% conversion`, subColor: '#15803D' },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column — calendar + weekly capital plan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', alignItems: 'start' }}>

        {/* Due date calendar */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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

        {/* Weekly capital plan — redesigned */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04), 0 8px 32px rgba(28,90,244,.07)' }}>

          {/* Header */}
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#192744', marginBottom: '3px' }}>Weekly capital plan</div>
              <div style={{ fontSize: '12px', color: '#858ea2' }}>Current month · plan ahead to avoid late charges</div>
            </div>
            <div style={{ background: '#EBEAFF', border: '1.5px solid #C4BFFF', borderRadius: '10px', padding: '6px 14px', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: '#2500D7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Month total</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a00a8', letterSpacing: '-0.5px' }}>{inr(totalUnpaid)}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ padding: '16px 20px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#9b9b96', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cash required by week</span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#9b9b96' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fca5a5', display: 'inline-block' }} />Overdue
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#C4BFFF', display: 'inline-block' }} />Due
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '0 4px' }}>
              {weeklyAmounts.map((w, wi) => {
                const maxAmt   = Math.max(...weeklyAmounts.map(x => x.unpaid))
                const totalH   = Math.round((w.unpaid  / Math.max(maxAmt, 1)) * 100)
                const overdueH = Math.round((w.overdue / Math.max(maxAmt, 1)) * 100)
                const safeH    = totalH - overdueH
                const hasOD    = w.overdue > 0
                const isAct    = activeWeek === wi
                return (
                  <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                    onMouseEnter={() => setActiveWeek(wi)}
                    onMouseLeave={() => setActiveWeek(null)}>
                    <div style={{ fontSize: '10px', fontWeight: isAct ? 700 : 500, color: isAct ? '#192744' : '#858ea2' }}>
                      {inr(w.unpaid)}
                    </div>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '88px', borderRadius: '5px', overflow: 'hidden', background: isAct ? (hasOD ? '#FEF2F2' : '#EBEAFF') : '#f5f6fa', transition: 'background 0.15s' }}>
                      {safeH > 0 && <div style={{ height: safeH + 'px', background: isAct ? '#7B6FE8' : '#C4BFFF', transition: 'all 0.15s' }} />}
                      {overdueH > 0 && <div style={{ height: overdueH + 'px', background: isAct ? '#ec2127' : '#fca5a5', transition: 'all 0.15s' }} />}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: isAct ? 700 : 400, color: isAct ? '#1c5af4' : '#9b9b96' }}>W{wi + 1}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Week cards */}
          <div style={{ padding: '4px 12px 14px', display: 'flex', gap: '6px' }}>
            {weeklyAmounts.map((w, wi) => {
              const hasOD     = w.overdue > 0
              const isAct     = activeWeek === wi
              const pct       = Math.round(w.unpaid / Math.max(totalUnpaid, 1) * 100)
              const remaining = w.unpaid - w.overdue
              return (
                <div key={wi} onClick={() => setActiveWeek(isAct ? null : wi)} style={{
                  flex: '1 1 0', minWidth: 0,
                  background: isAct ? (hasOD ? '#FEF2F2' : '#EBEAFF') : '#fff',
                  border: '1.5px solid ' + (isAct ? (hasOD ? '#FECACA' : '#C4BFFF') : '#f3f4f6'),
                  borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', transition: 'all 0.18s',
                  boxShadow: isAct ? (hasOD ? '0 2px 10px rgba(236,33,39,.10)' : '0 2px 10px rgba(28,90,244,.10)') : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#192744' }}>{w.label}</div>
                      <div style={{ fontSize: '10px', color: '#9b9b96' }}>{w.count} bills</div>
                    </div>
                    {hasOD && (
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', padding: '2px 5px' }}>OD</div>
                    )}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '5px', color: hasOD ? '#dc2626' : '#1a00a8' }}>
                    {inr(w.unpaid)}
                  </div>
                  <div style={{ height: '3px', borderRadius: '2px', background: '#f3f4f6', marginBottom: '5px', display: 'flex', overflow: 'hidden' }}>
                    {hasOD && <div style={{ width: ((w.overdue / Math.max(w.unpaid,1)) * 100) + '%', background: '#ec2127', height: '100%' }} />}
                    {remaining > 0 && <div style={{ width: ((remaining / Math.max(w.unpaid,1)) * 100) + '%', background: hasOD ? '#FECACA' : '#1c5af4', height: '100%' }} />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9b9b96' }}>
                    <span>{w.unpaidCount} unpaid</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected week detail */}
          {activeWeek !== null && weeklyAmounts[activeWeek] && (
            <div style={{ margin: '0 12px 14px', background: '#f9f9f9', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '8px' }}>
                {weeklyAmounts[activeWeek].label} detail
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                {([
                  ['Total due',   inr(weeklyAmounts[activeWeek].unpaid)],
                  ['Overdue',     weeklyAmounts[activeWeek].overdue > 0 ? inr(weeklyAmounts[activeWeek].overdue) : '—'],
                  ['On schedule', inr(weeklyAmounts[activeWeek].unpaid - weeklyAmounts[activeWeek].overdue)],
                  ['Bills',       weeklyAmounts[activeWeek].unpaidCount + ' unpaid'],
                ] as [string,string][]).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '10px', color: '#858ea2', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#192744' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>

          {/* Due date calendar */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '22px 24px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>Due date calendar</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>Bills due per day · current month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarDays.map(day => {
                const dayCAs  = byDay[day] ?? []
                const hasOver = dayCAs.some(c => c.isOverdue)
                const hasSoon = dayCAs.some(c => c.isDueSoon)
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '11px', color: '#6B7280', flexWrap: 'wrap' }}>
              {[{ color: '#FECACA', label: 'Overdue' },{ color: '#FDE68A', label: 'Due soon' },{ color: '#BBF7D0', label: 'Paid' },{ color: '#E5E7EB', label: 'No bills' }].map(item => (
                <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />{item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Weekly capital plan */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ padding: '22px 24px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>Weekly capital plan</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Current month · plan ahead</div>
              </div>
              <div style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: '10px', padding: '6px 14px', textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#4F46E5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Month total</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#4338CA' }}>{inr(totalUnpaid)}</div>
              </div>
            </div>
            <div style={{ padding: '16px 24px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                {weeklyAmounts.map((w, wi) => {
                  const maxAmt   = Math.max(...weeklyAmounts.map(x => x.unpaid))
                  const totalH   = Math.round((w.unpaid / Math.max(maxAmt,1)) * 80)
                  const overdueH = Math.round((w.overdue / Math.max(maxAmt,1)) * 80)
                  const safeH    = totalH - overdueH
                  const hasOD    = w.overdue > 0
                  const isAct    = activeWeek === wi
                  return (
                    <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                      onMouseEnter={() => setActiveWeek(wi)} onMouseLeave={() => setActiveWeek(null)}>
                      <div style={{ fontSize: '10px', fontWeight: isAct ? 700 : 500, color: isAct ? '#111827' : '#6B7280' }}>{inr(w.unpaid)}</div>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '72px', borderRadius: '5px', overflow: 'hidden', background: isAct ? (hasOD ? '#FEF2F2' : '#EEF2FF') : '#F3F4F6' }}>
                        {safeH > 0 && <div style={{ height: safeH+'px', background: isAct ? '#7B6FE8' : '#C7D2FE' }} />}
                        {overdueH > 0 && <div style={{ height: overdueH+'px', background: isAct ? '#EF4444' : '#FECACA' }} />}
                      </div>
                      <div style={{ fontSize: '10px', color: isAct ? '#4F46E5' : '#9CA3AF' }}>W{wi+1}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ padding: '4px 12px 14px', display: 'flex', gap: '6px' }}>
              {weeklyAmounts.map((w, wi) => {
                const hasOD = w.overdue > 0
                const isAct = activeWeek === wi
                const pct   = Math.round(w.unpaid / Math.max(totalUnpaid,1) * 100)
                return (
                  <div key={wi} onClick={() => setActiveWeek(isAct ? null : wi)} style={{ flex: '1 1 0', minWidth: 0, background: isAct ? (hasOD ? '#FEF2F2' : '#EEF2FF') : '#fff', border: '1.5px solid '+(isAct ? (hasOD ? '#FECACA' : '#C7D2FE') : '#E5E7EB'), borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>{w.label}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{w.count} bills</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: hasOD ? '#EF4444' : '#4338CA', margin: '4px 0' }}>{inr(w.unpaid)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF' }}>
                      <span>{w.unpaidCount} unpaid</span><span>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
    </div>
  )
}


function AnomalyCard({ a }: { a: { id: number; icon: string; iconColor: string; iconBg: string; label: string; title: string; where: string; amount: string; type: string; cta: string } }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#FAFAFA' : '#fff',
        border: '1.5px solid ' + (hov ? '#D1D5DB' : '#f3f4f6'),
        borderRadius: '14px',
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all .16s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,.07)' : 'none',
      }}>
      {/* Top row: icon + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', color: a.iconColor }}>
          {a.icon}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#192744', letterSpacing: '-0.5px' }}>{a.amount}</div>
          <div style={{ fontSize: '10.5px', color: '#858ea2' }}>{a.type}</div>
        </div>
      </div>
      {/* Label + title */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
          {a.label}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', lineHeight: 1.4 }}>
          {a.title}
        </div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '6px' }}>{a.where}</div>
      </div>
      {/* CTA */}
      <button style={{
        alignSelf: 'flex-start',
        background: hov ? '#2500D7' : '#EBEAFF',
        color: hov ? '#fff' : '#2500D7',
        border: 'none',
        borderRadius: '8px',
        padding: '7px 14px',
        fontSize: '12.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .16s',
        fontFamily: 'inherit',
      }}>
        {a.cta} →
      </button>
    </div>
  )
}


function BasicBillers({ appState, analyticsMode = 'basic' }: BasicSectionProps & { analyticsMode?: 'basic' | 'advanced' }) {
  const [activeWeek, setActiveWeek] = useState<number | null>(null)
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
  const weeks = [
    { label: 'Week 1 (1–7)',   days: [1,2,3,4,5,6,7]       },
    { label: 'Week 2 (8–14)',  days: [8,9,10,11,12,13,14]   },
    { label: 'Week 3 (15–21)', days: [15,16,17,18,19,20,21] },
    { label: 'Week 4 (22–28)', days: [22,23,24,25,26,27,28] },
  ]
  const weeklyAmounts = weeks.map(w => {
    const cas     = w.days.flatMap(d => byDay[d] ?? [])
    const unpaid  = cas.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
    const overdue = cas.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
    return { ...w, unpaid, overdue, count: cas.length, unpaidCount: cas.filter(c => !c.isPaid).length }
  })
  const totalUnpaid  = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const totalOverdue = caSchedule.filter(c => c.isOverdue).reduce((s, c) => s + c.billAmt, 0)
  const overdueCount = caSchedule.filter(c => c.isOverdue).length
  const paidAmt      = caSchedule.filter(c => c.isPaid).reduce((s, c) => s + c.billAmt, 0)
  const paidCount    = caSchedule.filter(c => c.isPaid).length
  const approvalHold = Math.round(totalCAs * 0.068)
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)
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
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
        <div style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '0.5px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{statusView === 'state' ? 'Bill status — by state' : 'Bill status — by biller'}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{statusView === 'state' ? 'Active CA states only' : 'All registered billers'}</div>
            </div>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', padding: '3px', gap: '2px' }}>
              {(['state','biller'] as const).map(v => (
                <button key={v} onClick={() => setStatusView(v)} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: statusView === v ? '#fff' : 'transparent', color: statusView === v ? '#111827' : '#6B7280' }}>By {v}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {(statusView === 'state' ? ['State','Billers','Active CAs','Bill available','Paid','Unpaid','Conversion'] : ['Biller','State','Active CAs','Bill available','Paid','Unpaid','Conversion']).map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(statusView === 'state' ? stateData : billerData).map((r: any) => {
                const convPct  = r.total > 0 ? Math.round(r.paid / r.total * 100) : 0
                const barColor = convPct >= 85 ? '#22C55E' : convPct >= 75 ? '#F59E0B' : '#EF4444'
                return (
                  <tr key={statusView === 'state' ? r.state : r.biller}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', fontWeight: 500, color: '#4F46E5' }}>{statusView === 'state' ? r.state : r.biller}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', color: '#6B7280' }}>{statusView === 'state' ? r.billers : r.state}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', color: '#111827' }}>{r.total}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', color: '#111827' }}>{r.generated}<span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '4px' }}>({r.total > 0 ? Math.round(r.generated/r.total*100) : 0}%)</span></td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', fontWeight: 500, color: '#15803D' }}>{r.paid}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6', color: '#111827' }}>{r.generated - r.paid}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: barColor }}>{convPct}%</span>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#F3F4F6', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: convPct+'%', height: '100%', borderRadius: '3px', background: barColor }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
