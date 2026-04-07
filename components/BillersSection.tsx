'use client'

import { useState } from 'react'
import { CAS, BRANCHES, STATES } from '@/lib/calculations'
import { KpiCard } from './KpiCard'

interface BillersSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
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
  const dropPct   = Math.round((total - paid) / total * 100)
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
    const dropPct    = Math.round((total - paid) / total * 100)
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
const totalOpted   = dbcTableData.reduce((s, r) => s + r.opted, 0)
const totalReceived = dbcTableData.reduce((s, r) => s + r.received, 0)
const billCopySuccessPct = Math.round(totalReceived / totalOpted * 100)
const totalFailed  = dbcTableData.reduce((s, r) => s + r.failed, 0)
const totalPending = dbcTableData.reduce((s, r) => s + r.pending, 0)

// Derived summary metrics
const summaryMetrics = [
  { label: 'Active billers',      value: `${totalBillers}`,           sub: `across ${STATES.length} states`,           subColor: '#858ea2' },
  { label: 'Avg conversion rate', value: `${FUNNEL.conversionPct}%`,  sub: 'bills generated → paid',                   subColor: '#3B6D11' },
  { label: 'Bill copy success',   value: `${billCopySuccessPct}%`,    sub: `${totalReceived} of ${totalOpted} opted-in CAs`, subColor: '#3B6D11' },
  { label: 'CAs needing action',  value: `${totalFailed}`,            sub: 'bill copy failed · payment blocked',        subColor: '#A32D2D' },
]

// Digital bill copy funnel
const dbcFunnel = {
  optedIn:  totalOpted,
  received: totalReceived,
  pending:  totalPending,
  failed:   totalFailed,
  receivedPct: Math.round(totalReceived / totalOpted * 100),
  pendingPct:  Math.round(totalPending / totalOpted * 100),
  failedPct:   Math.round(totalFailed / totalOpted * 100),
}

export default function BillersSection({ appState }: BillersSectionProps) {
  const [funnelView, setFunnelView] = useState<'all'|'state'|'biller'>('all')
  const [statusView, setStatusView] = useState<'state'|'biller'>('state')

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>
      {/* Section 1 — Summary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        {summaryMetrics.map(m => (
          <div key={m.label} style={{ background: '#fff', borderTop: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', borderLeft: '4px solid #2500d7', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '11px', color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 500, color: '#192744', marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: m.subColor }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 2 — Bill generation funnel card */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>

        {/* Header */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Bill generation flow</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Active CAs → Generated → Paid progression</div>
        </div>

        {/* Stage cards - horizontal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', padding: '12px 16px', background: '#f9f9f9', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#C47A00' }}>{FUNNEL.activeCAs}</span>
            <span style={{ fontSize: '13px', color: '#858ea2' }}>active CAs</span>
          </div>
          <span style={{ color: '#d0d0d0', fontSize: '18px' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1755C8' }}>{FUNNEL.generated}</span>
            <span style={{ fontSize: '13px', color: '#858ea2' }}>generated</span>
            <span style={{ fontSize: '12px', color: '#E24B4A', fontWeight: 500 }}>−{FUNNEL.generatedDrop}</span>
          </div>
          <span style={{ color: '#d0d0d0', fontSize: '18px' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A7A45' }}>{FUNNEL.paid}</span>
            <span style={{ fontSize: '13px', color: '#858ea2' }}>paid</span>
            <span style={{ fontSize: '12px', color: '#E24B4A', fontWeight: 500 }}>−{FUNNEL.paidDrop}</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#858ea2' }}>
            Overall conversion <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A7A45', marginLeft: '4px' }}>{FUNNEL.conversionPct}%</span>
          </div>
        </div>

        {/* Bar rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
          {[
            { label: 'Active CAs', count: FUNNEL.activeCAs, pct: 100, fillColor: '#C47A00', chipColor: '#A05E00', drop: null },
            { label: 'Bills generated', count: FUNNEL.generated, pct: FUNNEL.generatedPct, fillColor: '#1755C8', chipColor: '#0d3d8a', drop: { val: FUNNEL.generatedDrop, pct: `${FUNNEL.generatedPct}%` } },
            { label: 'Bills paid', count: FUNNEL.paid, pct: FUNNEL.paidPct, fillColor: '#1A7A45', chipColor: '#145c34', drop: { val: FUNNEL.paidDrop, pct: `${FUNNEL.paidPct}%` } },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#858ea2', fontWeight: 500, width: '110px', flexShrink: 0 }}>{row.label}</div>
              <div style={{ flex: 1, height: '36px', background: '#e8e8e8', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.fillColor, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                  <div style={{ height: '26px', padding: '0 12px', borderRadius: '13px', fontSize: '13px', fontWeight: 600, color: '#fff', background: row.chipColor, display: 'flex', alignItems: 'center' }}>
                    {row.count}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744', minWidth: '36px', textAlign: 'right' }}>{row.pct}%</div>
              {row.drop && (
                <div style={{ fontSize: '12px', color: '#E24B4A', fontWeight: 500, minWidth: '48px', textAlign: 'right' }}>−{row.drop.val}</div>
              )}
            </div>
          ))}
        </div>

        {/* Exception pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'Not generated', val: FUNNEL.notGenerated, color: '#E24B4A', bg: '#FEF0F0' },
              { label: 'Unpaid', val: FUNNEL.unpaid, color: '#C47A00', bg: '#FFF8ED' },
              { label: 'Approval hold', val: FUNNEL.approvalHold, color: '#C47A00', bg: '#FFF8ED' },
            ].map(e => (
              <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: e.bg, borderRadius: '20px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: e.color }}>{e.val}</span>
                <span style={{ color: e.color, fontWeight: 500 }}>{e.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A7A45' }}>{FUNNEL.conversionPct}% conversion</div>
        </div>

      </div>

      {/* Section 3 — Bill status table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>

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
                const convPct = Math.round(r.paid / r.total * 100)
                const barColor = convPct >= 85 ? '#1D9E75' : convPct >= 80 ? '#EF9F27' : '#E24B4A'
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
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>{r.generated}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                      {r.received} <span style={{ fontSize: '11px', color: '#858ea2' }}>({Math.round(r.received/r.total*100)}%)</span>
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#3B6D11' }}>{r.paid}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                      {r.processed} <span style={{ fontSize: '11px', color: '#858ea2' }}>({Math.round(r.processed/r.total*100)}%)</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
          <KpiCard variant="danger" label="Failed bill copies"   value={`${dbcFunnel.failed}`}   desc={`${dbcFunnel.failedPct}% fetch failure rate — check biller API connectivity for these CAs`} />
          <KpiCard variant="warn"   label="Pending >48 hrs"      value={`${Math.round(dbcFunnel.pending * 0.45)}`}   desc={`${Math.round(dbcFunnel.pending * 0.45)} of ${dbcFunnel.pending} pending CAs have been waiting over 48 hours — needs manual intervention`} />
          <KpiCard variant="good"   label="Opt-in coverage"      value={`${Math.round(totalOpted / TOTAL_CAS * 100)}%`}  desc={`${totalOpted} of ${TOTAL_CAS} CAs opted in — ${TOTAL_CAS - totalOpted} CAs yet to opt in`} />
          <KpiCard variant="info"   label="Successful delivery"  value={`${dbcFunnel.received}`}  desc={`${billCopySuccessPct}% of opted-in CAs received digital bill copy successfully this month`} />
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
                const rate = Math.round(r.received / r.opted * 100)
                const failRate = r.failed / r.opted
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
