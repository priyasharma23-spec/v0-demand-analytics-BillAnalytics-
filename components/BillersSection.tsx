'use client'

import { useState } from 'react'
import { CAS, BRANCHES, STATES } from '@/lib/calculations'
import { KpiCard } from './KpiCard'
import { SummaryCard } from '@/components/SummaryCard'

interface BillersSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
  onMultiBillReview?: () => void
}

// Compute CA counts from calculations.ts data
const TOTAL_CAS = Object.values(CAS).flat().length  // 187

const CAS_PER_STATE: Record<string, number> = {}
STATES.forEach(state => {
  CAS_PER_STATE[state] = (BRANCHES[state] ?? [])
    .reduce((sum, br) => sum + (CAS[br]?.length ?? 0), 0)
})

const BRANCHES_PER_STATE: Record<string, number> = {}
STATES.forEach(state => {
  BRANCHES_PER_STATE[state] = BRANCHES[state]?.length ?? 0
})

// Bill generation funnel derived from TOTAL_CAS
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

// Biller-to-state mapping
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

// Derive stateData from actual CA counts
const stateData = STATES.map(state => {
  const total = CAS_PER_STATE[state]
  const generated = Math.round(total * 0.757)
  const received  = Math.round(total * 0.70)
  const processed = Math.round(total * 0.63)
  const paid      = Math.round(total * 0.60)
  const dropPct   = total > 0 ? Math.round((total - paid) / total * 100) : 0
  return {
    state,
    billers: (STATE_BILLERS_LIST[state] ?? []).length,
    total,
    generated,
    received,
    processed,
    paid,
    dropPct,
  }
})

// Derive billerData from state totals split among billers
const billerData = STATES.flatMap(state => {
  const billers = STATE_BILLERS_LIST[state] ?? []
  const stateTotal = CAS_PER_STATE[state]
  return billers.map((biller, idx) => {
    const splitFactor = billers.length === 2
      ? (idx === 0 ? 0.55 : 0.45)
      : 1.0
    const total      = Math.round(stateTotal * splitFactor)
    const generated  = Math.round(total * 0.757)
    const received   = Math.round(total * 0.70)
    const processed  = Math.round(total * 0.63)
    const paid       = Math.round(total * 0.60)
    const dropPct    = total > 0 ? Math.round((total - paid) / total * 100) : 0
    return { biller, state, total, generated, received, processed, paid, dropPct }
  })
})

// Digital bill copy data
const dbcTableData = billerData.map(b => {
  const opted    = Math.round(b.total * 0.75)
  const received = Math.round(opted * 0.787)
  const pending  = Math.round(opted * 0.138)
  const failed   = opted - received - pending
  return { biller: b.biller, state: b.state, opted, received, pending, failed }
})

// Aggregate metrics for KPI cards
const totalBillers = Object.values(STATE_BILLERS_LIST).flat().length

// Billers generating more than 1 bill per month per CA
// In BBPS, some billers (e.g. MSEDCL, BEST) issue supplementary/revised bills
// Simulated: ~15% of billers have multi-bill CAs, avg 1.3 bills per CA
const MULTI_BILL_BILLERS = ['MSEDCL', 'BEST', 'DGVCL', 'TPDDL']
const multiBillCount = MULTI_BILL_BILLERS.length
const multiBillCAs   = MULTI_BILL_BILLERS.reduce((s, b) => {
  const stateEntry = Object.entries(STATE_BILLERS_LIST).find(([, billers]) => billers.includes(b))
  if (!stateEntry) return s
  const stateCAs = CAS_PER_STATE[stateEntry[0]] ?? 0
  const billerShare = 1 / (STATE_BILLERS_LIST[stateEntry[0]]?.length ?? 1)
  return s + Math.round(stateCAs * billerShare * 0.18) // ~18% of CAs get supplementary bill
}, 0)
const multiBillExtraBills = Math.round(multiBillCAs * 0.3) // avg 1.3 bills = 0.3 extra per CA
const totalOpted   = dbcTableData.reduce((s, r) => s + r.opted, 0)
const totalReceived = dbcTableData.reduce((s, r) => s + r.received, 0)
const billCopySuccessPct = totalOpted > 0 ? Math.round(totalReceived / totalOpted * 100) : 0
const totalFailed  = dbcTableData.reduce((s, r) => s + r.failed, 0)
const totalPending = dbcTableData.reduce((s, r) => s + r.pending, 0)

// Derived summary metrics
const totalUnpaid   = stateData.reduce((s, r) => s + (r.generated - r.paid), 0)
const nearingDue    = Math.round(totalUnpaid * 0.25)
const overdue       = Math.round(totalUnpaid * 0.30)

const summaryMetrics = [
  {
    label:    'Active billers',
    value:    `${totalBillers}`,
    sub:      `across ${STATES.length} states`,
    subColor: '#185FA5',
  },
  {
    label:    'Avg conversion rate',
    value:    `${FUNNEL.conversionPct}%`,
    sub:      'bills generated → paid',
    subColor: '#185FA5',
  },
  {
    label:    'Nearing due',
    value:    `${nearingDue}`,
    sub:      'next 3 days',
    subColor: '#185FA5',
  },
  {
    label:    'Overdue',
    value:    `${overdue}`,
    sub:      'not yet paid',
    subColor: '#185FA5',
  },
]

// Digital bill copy funnel
const dbcFunnel = {
  optedIn:  totalOpted,
  received: totalReceived,
  pending:  totalPending,
  failed:   totalFailed,
    receivedPct: totalOpted > 0 ? Math.round(totalReceived / totalOpted * 100) : 0,
    pendingPct:  totalOpted > 0 ? Math.round(totalPending / totalOpted * 100) : 0,
    failedPct:   totalOpted > 0 ? Math.round(totalFailed / totalOpted * 100) : 0,
}

export default function BillersSection({ appState, onMultiBillReview }: BillersSectionProps) {
  const [funnelView, setFunnelView] = useState<'all'|'state'|'biller'>('all')
  const [statusView, setStatusView] = useState<'state'|'biller'>('state')

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>
      {/* Section 1 — Summary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        {summaryMetrics.map((m) => (
          <SummaryCard
            key={m.label}
            label={m.label}
            value={m.value}
            sub={m.sub}
            subColor={m.subColor}
            borderColor="#2500D7"
          />
        ))}
      </div>

      {/* Section 3 — Bill status table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', marginBottom: '12px', marginTop: '24px' }}>

        {/* Header + toggle */}
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

        {/* Table wrapper - horizontal scroll only */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 9 }}>
              <tr>
                {(statusView === 'state'
                  ? ['State','Billers','Active CAs','Bill available','Paid','Unpaid','Conversion']
                  : ['Biller','State','Active CAs','Bill available','Paid','Unpaid','Conversion']
                ).map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(statusView === 'state' ? stateData : billerData).map((r: any) => {
                const convPct = r.total > 0 ? Math.round(r.paid / r.total * 100) : 0
                const barColor = convPct >= 85 ? '#1D9E75' : convPct >= 75 ? '#EF9F27' : '#E24B4A'
                return (
                  <tr key={statusView === 'state' ? r.state : r.biller}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#2500D7' }}>
                      {statusView === 'state' ? r.state : r.biller}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>
                      {statusView === 'state' ? r.billers : r.state}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>{r.total}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                      {r.generated}
                      <span style={{ fontSize: '11px', color: '#858ea2', marginLeft: '4px' }}>({r.total > 0 ? Math.round(r.generated/r.total*100) : 0}%)</span>
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#3B6D11' }}>{r.paid}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                      {r.generated - r.paid}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: barColor }}>{convPct}%</span>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f0f0f0', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${convPct}%`, height: '100%', borderRadius: '3px', background: barColor }} />
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

      {/* Section 4 — Digital bill copy */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px' }}>

        <div style={{ fontSize: '14px', fontWeight: 500, color: '#192744', marginBottom: '3px' }}>Digital bill copy status</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '16px' }}>CAs opted for digital bill copy · bill_copy_enabled flag driven · current month</div>

        {/* Four-stage funnel */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'stretch', marginBottom: '16px' }}>
          {[
            { num: dbcFunnel.optedIn, label: 'Opted in',  sub: 'bill_copy_enabled = true', bg: '#E6F1FB', numColor: '#0C447C', labelColor: '#0C447C', subColor: '#185FA5' },
            { num: dbcFunnel.received, label: 'Received',  sub: `${dbcFunnel.receivedPct}% of opted`,           bg: '#EAF3DE', numColor: '#27500A', labelColor: '#27500A', subColor: '#3B6D11' },
            { num: dbcFunnel.pending,  label: 'Pending',   sub: `${dbcFunnel.pendingPct}% awaiting`,           bg: '#FAEEDA', numColor: '#633806', labelColor: '#633806', subColor: '#854F0B' },
            { num: dbcFunnel.failed,   label: 'Failed',    sub: `${dbcFunnel.failedPct}% failed fetch`,         bg: '#FCEBEB', numColor: '#791F1F', labelColor: '#791F1F', subColor: '#A32D2D' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1, background: s.bg, borderRadius: '8px', padding: '14px 12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 500, color: s.numColor }}>{s.num}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: s.labelColor, marginTop: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: s.subColor, marginTop: '4px' }}>{s.sub}</div>
              </div>
              {i < 3 && <div style={{ fontSize: '18px', color: '#c4c4c4', display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>›</div>}
            </div>
          ))}
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
          <KpiCard variant="danger" label="Failed bill copies"   value={`${dbcFunnel.failed}`}   desc={`${dbcFunnel.failedPct}% fetch failure rate — check biller API connectivity for these CAs`} />
          <KpiCard variant="warn"   label="Pending >48 hrs"      value={`${Math.round(dbcFunnel.pending * 0.45)}`}   desc={`${Math.round(dbcFunnel.pending * 0.45)} of ${dbcFunnel.pending} pending CAs have been waiting over 48 hours — needs manual intervention`} />
          <KpiCard variant="good"   label="Opt-in coverage"      value={`${TOTAL_CAS > 0 ? Math.round(totalOpted / TOTAL_CAS * 100) : 0}%`}  desc={`${totalOpted} of ${TOTAL_CAS} CAs opted in — ${TOTAL_CAS - totalOpted} CAs yet to opt in`} />
          <KpiCard variant="info"   label="Successful delivery"  value={`${dbcFunnel.received}`}  desc={`${billCopySuccessPct}% of opted-in CAs received digital bill copy successfully this month`} />
          <div onClick={onMultiBillReview} style={{ cursor: 'pointer' }}>
            <KpiCard variant="warn"   label="Multi-bill billers"   value={`${multiBillCount} billers`} desc={`${multiBillCAs} CAs received >1 bill this month · click to review for duplicates`} />
          </div>
        </div>

        {/* Bill copy by biller table */}
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
                const badge = failRate > 0.10
                  ? { bg: '#FCEBEB', color: '#A32D2D', label: 'High failure' }
                  : failRate > 0.06
                  ? { bg: '#FAEEDA', color: '#633806', label: 'Check API' }
                  : { bg: '#EAF3DE', color: '#27500A', label: 'Healthy' }
                return (
                  <tr key={r.biller}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
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
    </div>
  )
}
