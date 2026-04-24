'use client'

import { useState } from 'react'
import { CAS, BRANCHES, STATES, inr } from '@/lib/calculations'
import { KpiCard } from './KpiCard'
import { SummaryCard } from '@/components/SummaryCard'

interface BillersSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
  onMultiBillReview?: () => void
}

const TOTAL_CAS = Object.values(CAS).flat().length

const CAS_PER_STATE: Record<string, number> = {}
STATES.forEach(state => {
  CAS_PER_STATE[state] = (BRANCHES[state] ?? [])
    .reduce((sum, br) => sum + (CAS[br]?.length ?? 0), 0)
})

const BRANCHES_PER_STATE: Record<string, number> = {}
STATES.forEach(state => {
  BRANCHES_PER_STATE[state] = BRANCHES[state]?.length ?? 0
})

const FUNNEL = {
  activeCAs:     TOTAL_CAS,
  generated:     Math.round(TOTAL_CAS * 0.757),
  paid:          Math.round(TOTAL_CAS * 0.60),
  notGenerated:  TOTAL_CAS - Math.round(TOTAL_CAS * 0.757),
  unpaid:        Math.round(TOTAL_CAS * 0.757) - Math.round(TOTAL_CAS * 0.60),
  approvalHold:  Math.round(TOTAL_CAS * 0.068),
  generatedDrop: TOTAL_CAS - Math.round(TOTAL_CAS * 0.757),
  paidDrop:      Math.round(TOTAL_CAS * 0.757) - Math.round(TOTAL_CAS * 0.60),
  generatedPct:  75.7,
  paidPct:       60.0,
  conversionPct: 60,
}

const STATE_BILLERS_LIST: Record<string, string[]> = {
  'Maharashtra':   ['MSEDCL', 'BEST'],
  'Karnataka':     ['BESCOM'],
  'Tamil Nadu':    ['TNEB'],
  'Gujarat':       ['DGVCL', 'UGVCL'],
  'Delhi':         ['TPDDL', 'BSES Rajdhani'],
  'Rajasthan':     ['JVVNL'],
  'Uttar Pradesh': ['UPPCL'],
  'West Bengal':   ['WBSEDCL'],
}

const stateData = STATES.map(state => {
  const total = CAS_PER_STATE[state]
  const generated = Math.round(total * 0.757)
  const received  = Math.round(total * 0.70)
  const processed = Math.round(total * 0.63)
  const paid      = Math.round(total * 0.60)
  const dropPct   = total > 0 ? Math.round((total - paid) / total * 100) : 0
  return { state, billers: (STATE_BILLERS_LIST[state] ?? []).length, total, generated, received, processed, paid, dropPct }
})

const billerData = STATES.flatMap(state => {
  const billers = STATE_BILLERS_LIST[state] ?? []
  const stateTotal = CAS_PER_STATE[state]
  return billers.map((biller, idx) => {
    const splitFactor = billers.length === 2 ? (idx === 0 ? 0.55 : 0.45) : 1.0
    const total      = Math.round(stateTotal * splitFactor)
    const generated  = Math.round(total * 0.757)
    const received   = Math.round(total * 0.70)
    const processed  = Math.round(total * 0.63)
    const paid       = Math.round(total * 0.60)
    const dropPct    = total > 0 ? Math.round((total - paid) / total * 100) : 0
    return { biller, state, total, generated, received, processed, paid, dropPct }
  })
})

const dbcTableData = billerData.map(b => {
  const opted    = Math.round(b.total * 0.75)
  const received = Math.round(opted * 0.787)
  const pending  = Math.round(opted * 0.138)
  const failed   = opted - received - pending
  return { biller: b.biller, state: b.state, opted, received, pending, failed }
})

const totalBillers = Object.values(STATE_BILLERS_LIST).flat().length
const MULTI_BILL_BILLERS = ['MSEDCL', 'BEST', 'DGVCL', 'TPDDL']
const multiBillCount = MULTI_BILL_BILLERS.length
const multiBillCAs = MULTI_BILL_BILLERS.reduce((s, b) => {
  const stateEntry = Object.entries(STATE_BILLERS_LIST).find(([, billers]) => billers.includes(b))
  if (!stateEntry) return s
  const stateCAs = CAS_PER_STATE[stateEntry[0]] ?? 0
  const billerShare = 1 / (STATE_BILLERS_LIST[stateEntry[0]]?.length ?? 1)
  return s + Math.round(stateCAs * billerShare * 0.18)
}, 0)
const multiBillExtraBills = Math.round(multiBillCAs * 0.3)
const totalOpted    = dbcTableData.reduce((s, r) => s + r.opted, 0)
const totalReceived = dbcTableData.reduce((s, r) => s + r.received, 0)
const billCopySuccessPct = totalOpted > 0 ? Math.round(totalReceived / totalOpted * 100) : 0
const totalFailed  = dbcTableData.reduce((s, r) => s + r.failed, 0)
const totalPending = dbcTableData.reduce((s, r) => s + r.pending, 0)
const totalUnpaid  = stateData.reduce((s, r) => s + (r.generated - r.paid), 0)
const overdue      = Math.round(totalUnpaid * 0.30)
const overdueAmt   = Math.round(totalUnpaid * 0.30 * 185000)

const summaryMetrics = [
  { label: 'Total unpaid',      value: inr(Math.round(totalUnpaid * 185000)),  sub: `${totalUnpaid} CAs · current period`,       subColor: '#185FA5', borderColor: '#2500D7' },
  { label: 'Overdue',           value: `${overdue} CAs`,                       sub: inr(overdueAmt) + ' · not yet paid',         subColor: '#A32D2D', borderColor: '#E24B4A' },
  { label: 'Approval pending',  value: `${FUNNEL.approvalHold}`,               sub: 'bills stuck in approval queue',             subColor: '#854F0B', borderColor: '#EF9F27' },
  { label: 'Paid this period',  value: inr(Math.round(FUNNEL.paid * 185000)),  sub: `${FUNNEL.paid} CAs · ${FUNNEL.conversionPct}% conversion`, subColor: '#3B6D11', borderColor: '#1A7A45' },
]

const dbcFunnel = {
  optedIn:     totalOpted,
  received:    totalReceived,
  pending:     totalPending,
  failed:      totalFailed,
  receivedPct: totalOpted > 0 ? Math.round(totalReceived / totalOpted * 100) : 0,
  pendingPct:  totalOpted > 0 ? Math.round(totalPending  / totalOpted * 100) : 0,
  failedPct:   totalOpted > 0 ? Math.round(totalFailed   / totalOpted * 100) : 0,
}

export default function BillersSection({ appState, onMultiBillReview }: BillersSectionProps) {
  const [statusView, setStatusView] = useState<'state'|'biller'>('state')

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        {summaryMetrics.map((m) => (
          <SummaryCard key={m.label} label={m.label} value={m.value} sub={m.sub} subColor={m.subColor} borderColor={m.borderColor} />
        ))}
      </div>

      {/* Due date calendar + Weekly capital plan */}
      {(() => {
        const useLocalState = useState
        const [activeWeek, setActiveWeek] = useLocalState<number | null>(null)
        const allCAsLocal = Object.values(CAS).flat()
        const totalCAsLocal = allCAsLocal.length
        const caSchedule = allCAsLocal.map((ca, i) => {
          const seed = ca.charCodeAt(0) + ca.charCodeAt(ca.length - 1)
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
        const totalUnpaidLocal = caSchedule.filter(c => !c.isPaid).reduce((s, c) => s + c.billAmt, 0)
        const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)
        const inrLocal = (v: number) => '\u20b9' + (v / 100000).toFixed(1) + 'L'
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            {/* Due date calendar */}
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Due date calendar</div>
              <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '14px' }}>Bills due per day · current month</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {calendarDays.map(day => {
                  const dayCAs  = byDay[day] ?? []
                  const hasOver = dayCAs.some(c => c.isOverdue)
                  const hasSoon = dayCAs.some(c => c.isDueSoon)
                  const bg      = dayCAs.length === 0 ? '#f9f9f9' : hasOver ? '#FCEBEB' : hasSoon ? '#FAEEDA' : '#EAF3DE'
                  const border  = dayCAs.length === 0 ? 'rgba(0,0,0,0.06)' : hasOver ? '#F7C1C1' : hasSoon ? '#FAC775' : '#C0DD97'
                  const textCol = dayCAs.length === 0 ? '#c4c4c4' : hasOver ? '#A32D2D' : hasSoon ? '#633806' : '#27500A'
                  return (
                    <div key={day} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: '6px', padding: '6px 4px', textAlign: 'center', minHeight: '44px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: textCol }}>{day}</div>
                      {dayCAs.length > 0 && <div style={{ fontSize: '9px', color: textCol, marginTop: '1px' }}>{dayCAs.length} CA{dayCAs.length > 1 ? 's' : ''}</div>}
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
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            {/* Weekly capital plan */}
            <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#192744', marginBottom: '3px' }}>Weekly capital plan</div>
                  <div style={{ fontSize: '12px', color: '#858ea2' }}>Current month · plan ahead to avoid late charges</div>
                </div>
                <div style={{ background: '#EBEAFF', border: '1.5px solid #C4BFFF', borderRadius: '10px', padding: '6px 14px', textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#2500D7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Month total</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a00a8', letterSpacing: '-0.5px' }}>{inrLocal(totalUnpaidLocal)}</div>
                </div>
              </div>
              <div style={{ padding: '16px 20px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                  {weeklyAmounts.map((w, wi) => {
                    const maxAmt = Math.max(...weeklyAmounts.map(x => x.unpaid))
                    const totalH   = Math.round((w.unpaid  / Math.max(maxAmt, 1)) * 80)
                    const overdueH = Math.round((w.overdue / Math.max(maxAmt, 1)) * 80)
                    const safeH    = totalH - overdueH
                    const hasOD    = w.overdue > 0
                    const isAct    = activeWeek === wi
                    return (
                      <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        onMouseEnter={() => setActiveWeek(wi)}
                        onMouseLeave={() => setActiveWeek(null)}>
                        <div style={{ fontSize: '10px', fontWeight: isAct ? 700 : 500, color: isAct ? '#192744' : '#858ea2' }}>{inrLocal(w.unpaid)}</div>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '72px', borderRadius: '5px', overflow: 'hidden', background: isAct ? (hasOD ? '#FEF2F2' : '#EBEAFF') : '#f5f6fa' }}>
                          {safeH > 0 && <div style={{ height: safeH + 'px', background: isAct ? '#7B6FE8' : '#C4BFFF' }} />}
                          {overdueH > 0 && <div style={{ height: overdueH + 'px', background: isAct ? '#ec2127' : '#fca5a5' }} />}
                        </div>
                        <div style={{ fontSize: '10px', color: isAct ? '#1c5af4' : '#9b9b96' }}>W{wi + 1}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ padding: '4px 12px 14px', display: 'flex', gap: '6px' }}>
                {weeklyAmounts.map((w, wi) => {
                  const hasOD  = w.overdue > 0
                  const isAct  = activeWeek === wi
                  const pct    = Math.round(w.unpaid / Math.max(totalUnpaidLocal, 1) * 100)
                  return (
                    <div key={wi} onClick={() => setActiveWeek(isAct ? null : wi)} style={{
                      flex: '1 1 0', minWidth: 0,
                      background: isAct ? (hasOD ? '#FEF2F2' : '#EBEAFF') : '#fff',
                      border: '1.5px solid ' + (isAct ? (hasOD ? '#FECACA' : '#C4BFFF') : '#f3f4f6'),
                      borderRadius: '10px', padding: '10px 12px', cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#192744' }}>{w.label}</div>
                      <div style={{ fontSize: '10px', color: '#9b9b96' }}>{w.count} bills</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: hasOD ? '#dc2626' : '#1a00a8', letterSpacing: '-0.5px', margin: '4px 0' }}>{inrLocal(w.unpaid)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9b9b96' }}>
                        <span>{w.unpaidCount} unpaid</span><span>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {activeWeek !== null && weeklyAmounts[activeWeek] && (
                <div style={{ margin: '0 12px 14px', background: '#f9f9f9', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '8px' }}>{weeklyAmounts[activeWeek].label} detail</div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {([
                      ['Total due',   inrLocal(weeklyAmounts[activeWeek].unpaid)],
                      ['Overdue',     weeklyAmounts[activeWeek].overdue > 0 ? inrLocal(weeklyAmounts[activeWeek].overdue) : '—'],
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
          </div>
        )
      })()}


      {/* Digital bill copy */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '20px 24px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Digital bill copy status</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '3px' }}>
            CAs opted for digital bill copy · <code style={{ fontSize: '11px', background: '#f5f6fa', border: '1px solid #f3f4f6', borderRadius: '4px', padding: '1px 5px', fontFamily: 'monospace' }}>bill_copy_enabled</code> flag driven · current month
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 14px' }}>
          <div style={{ height: '1px', background: '#f3f4f6', flex: 1 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Delivery funnel</span>
          <div style={{ height: '1px', background: '#f3f4f6', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: '20px' }}>
          {([
            { label: 'Opted in',  sublabel: 'bill_copy_enabled = true', count: dbcFunnel.optedIn,  pct: undefined,                                                          tone: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', accent: '#4F46E5' } },
            { label: 'Received',  sublabel: 'Bills fetched from biller', count: dbcFunnel.received, pct: Math.round(dbcFunnel.received / Math.max(dbcFunnel.optedIn,1)*100), tone: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' } },
            { label: 'Pending',   sublabel: 'Fetch in progress',         count: dbcFunnel.pending,  pct: Math.round(dbcFunnel.pending  / Math.max(dbcFunnel.optedIn,1)*100), tone: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
            { label: 'Failed',    sublabel: 'Fetch error · needs fix',   count: dbcFunnel.failed,   pct: Math.round(dbcFunnel.failed   / Math.max(dbcFunnel.optedIn,1)*100), tone: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
          ] as const).map((step, i, arr) => {
            const r = 18, stroke = 4, size = 44
            const circ = 2 * Math.PI * r
            const dash = step.pct !== undefined ? (step.pct / 100) * circ : 0
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                <div style={{ flex: 1, background: step.tone.bg, border: `1px solid ${step.tone.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: step.tone.text, lineHeight: 1 }}>{step.count}</div>
                    {step.pct !== undefined && (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={step.tone.accent + '33'} strokeWidth={stroke}/>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={step.tone.accent} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
                        </svg>
                        <div style={{ position: 'absolute', fontSize: '10px', fontWeight: 600, color: step.tone.text }}>{step.pct}%</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: step.tone.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{step.label}</div>
                  <div style={{ fontSize: '12px', color: step.tone.text, opacity: 0.6 }}>{step.sublabel}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', flexShrink: 0, color: '#D1D5DB', fontSize: '16px' }}>→</div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 14px' }}>
          <div style={{ height: '1px', background: '#f3f4f6', flex: 1 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Attention needed</span>
          <div style={{ height: '1px', background: '#f3f4f6', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {([
            { tone: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', accent: '#EF4444' }, title: 'Failed bill copies',  value: String(dbcFunnel.failed),   valueLabel: dbcFunnel.failedPct + '% failure rate',  detail: 'Check biller API connectivity. Repeated failures may block payment.',          action: 'View failed CAs'  },
            { tone: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', accent: '#F59E0B' }, title: 'Pending > 48 hrs',   value: String(Math.round(dbcFunnel.pending * 0.44)), valueLabel: 'of ' + dbcFunnel.pending + ' pending', detail: 'Bills waiting over 48 hours — need manual intervention to unblock.',  action: 'Review stalled'   },
            { tone: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', accent: '#22C55E' }, title: 'Opt-in coverage',    value: (TOTAL_CAS > 0 ? Math.round(dbcFunnel.optedIn / TOTAL_CAS * 100) : 0) + '%', valueLabel: undefined, detail: dbcFunnel.optedIn + ' of ' + TOTAL_CAS + ' CAs opted in. ' + (TOTAL_CAS - dbcFunnel.optedIn) + ' yet to opt.', action: 'View not opted' },
            { tone: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' }, title: 'Multi-bill billers', value: String(multiBillCount), valueLabel: 'billers', detail: multiBillCAs + ' CAs received more than 1 bill this month. Review for duplicates.', action: 'Check duplicates' },
          ] as const).map((card, ci) => (
            <div key={ci}
              style={{ flex: 1, background: '#fff', border: `1px solid ${card.tone.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${card.tone.accent}18` }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.tone.accent, flexShrink: 0 }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: card.tone.text, lineHeight: 1 }}>{card.value}</div>
                {card.valueLabel && <div style={{ fontSize: '12px', color: card.tone.text, opacity: 0.65, fontWeight: 500 }}>{card.valueLabel}</div>}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5, flex: 1 }}>{card.detail}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: card.tone.accent, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                {card.action} <span style={{ fontSize: '14px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Bill copy status by biller</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Biller','State','Opted','Received','Pending','Failed','Success rate','Status'].map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dbcTableData.map(r => {
                const rate = r.opted > 0 ? Math.round(r.received / r.opted * 100) : 0
                const failRate = r.opted > 0 ? r.failed / r.opted : 0
                const barColor = rate >= 80 ? '#1D9E75' : rate >= 70 ? '#EF9F27' : '#E24B4A'
                const badge = failRate > 0.10 ? { bg: '#FCEBEB', color: '#A32D2D', label: 'High failure' } : failRate > 0.06 ? { bg: '#FAEEDA', color: '#633806', label: 'Check API' } : { bg: '#EAF3DE', color: '#27500A', label: 'Healthy' }
                return (
                  <tr key={r.biller}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{r.biller}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>{r.state}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>{r.opted}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#3B6D11' }}>{r.received}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#854F0B' }}>{r.pending}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#A32D2D' }}>{r.failed}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: barColor }}>{rate}%</span>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f0f0f0', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${rate}%`, height: '100%', borderRadius: '3px', background: barColor }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill status table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', marginBottom: '12px', marginTop: '24px' }}>
        <div style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '0.5px solid rgba(0,0,0,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#192744' }}>
                {statusView === 'state' ? 'Bill status — by state' : 'Bill status — by biller'}
              </div>
              <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>
                {statusView === 'state' ? 'Active CA states only · click to expand billers' : 'All registered billers'}
              </div>
            </div>
            <div style={{ display: 'flex', background: '#f5f5f4', borderRadius: '10px', padding: '3px', gap: '2px' }}>
              {(['state','biller'] as const).map(v => (
                <button key={v} onClick={() => setStatusView(v)} style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                  border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                  background: statusView === v ? '#fff' : 'transparent',
                  color: statusView === v ? '#192744' : '#858ea2',
                }}>By {v}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 9 }}>
              <tr>
                {['Name', 'Total', 'Generated', 'Received', 'Processed', 'Paid', 'Drop', 'Status'].map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(statusView === 'state' ? stateData : billerData).map((row: any, idx: number) => {
                const name = 'state' in row ? row.state : row.biller
                const status = row.dropPct > 25 ? 'High drop' : row.dropPct > 15 ? 'Watch' : 'Healthy'
                return (
                  <tr key={name}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{name}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>{row.total}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{row.generated}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#3B6D11' }}>{row.received}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#854F0B' }}>{row.processed}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#192744' }}>{row.paid}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#A32D2D' }}>{row.dropPct}%</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                        background: status === 'High drop' ? '#FCEBEB' : status === 'Watch' ? '#FAEEDA' : '#EAF3DE',
                        color: status === 'High drop' ? '#A32D2D' : status === 'Watch' ? '#633806' : '#27500A',
                      }}>{status}</span>
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
