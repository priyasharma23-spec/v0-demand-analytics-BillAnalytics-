'use client'

import { useState } from 'react'
import { CAS, BRANCHES, STATES, inr } from '@/lib/calculations'

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

// Bill copy data
const dbcTableData = STATES.flatMap(state => {
  const billers = STATE_BILLERS_LIST[state] ?? []
  const stateTotal = CAS_PER_STATE[state]
  return billers.map((biller, idx) => {
    const splitFactor = billers.length === 2 ? (idx === 0 ? 0.55 : 0.45) : 1.0
    const total = Math.round(stateTotal * splitFactor)
    const opted = Math.round(total * 0.75)
    const received = Math.round(opted * 0.787)
    const pending = Math.round(opted * 0.138)
    const failed = opted - received - pending
    return { biller, state, opted, received, pending, failed }
  })
})

const totalOpted    = dbcTableData.reduce((s, r) => s + r.opted, 0)
const totalReceived = dbcTableData.reduce((s, r) => s + r.received, 0)
const totalPending  = dbcTableData.reduce((s, r) => s + r.pending, 0)
const totalFailed   = dbcTableData.reduce((s, r) => s + r.failed, 0)

const dbcFunnel = {
  optedIn:     totalOpted,
  received:    totalReceived,
  pending:     totalPending,
  failed:      totalFailed,
  receivedPct: totalOpted > 0 ? Math.round(totalReceived / totalOpted * 100) : 0,
  pendingPct:  totalOpted > 0 ? Math.round(totalPending  / totalOpted * 100) : 0,
  failedPct:   totalOpted > 0 ? Math.round(totalFailed   / totalOpted * 100) : 0,
}

// Summary metrics
const MULTI_BILL_BILLERS = ['MSEDCL', 'BEST', 'DGVCL', 'TPDDL']
const multiBillCount = MULTI_BILL_BILLERS.length
const multiBillCAs = Math.round(TOTAL_CAS * 0.08)

const summaryMetrics = [
  { label: 'Bill copy opted in',     value: String(dbcFunnel.optedIn), valueSub: `of ${TOTAL_CAS} CAs`,     accent: '#4F46E5', border: '#C7D2FE' },
  { label: 'Successfully received',  value: String(dbcFunnel.received), valueSub: 'bills delivered',      accent: '#3B82F6', border: '#BFDBFE' },
  { label: 'Pending delivery',       value: String(dbcFunnel.pending), valueSub: 'awaiting fetch',        accent: '#F59E0B', border: '#FDE68A' },
  { label: 'Failed bill copies',     value: String(dbcFunnel.failed), valueSub: 'need manual review',    accent: '#EF4444', border: '#FECACA' },
]

// State aggregated data for table
const stateAggregated = STATES.map(state => {
  const stateRows = dbcTableData.filter(r => r.state === state)
  return {
    state,
    opted:    stateRows.reduce((s, r) => s + r.opted, 0),
    received: stateRows.reduce((s, r) => s + r.received, 0),
    pending:  stateRows.reduce((s, r) => s + r.pending, 0),
    failed:   stateRows.reduce((s, r) => s + r.failed, 0),
  }
}).filter(s => s.opted > 0)

export default function BillersSection({ appState, onMultiBillReview }: BillersSectionProps) {
  const [statusView, setStatusView] = useState<'biller'|'state'|'branch'>('biller')

  const tableData = statusView === 'biller' ? dbcTableData : stateAggregated

  const funnelSteps = [
    { label: 'Bill Copy Active', sublabel: `${dbcFunnel.optedIn} CAs`, count: dbcFunnel.optedIn, pct: undefined, tone: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', accent: '#4F46E5' } },
    { label: 'Received', sublabel: 'Bills fetched from biller', count: dbcFunnel.received, pct: dbcFunnel.receivedPct, tone: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6' } },
    { label: 'Pending', sublabel: 'Fetch in progress', count: dbcFunnel.pending, pct: dbcFunnel.pendingPct, tone: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', accent: '#F59E0B' } },
    { label: 'Failed', sublabel: 'Fetch error · needs fix', count: dbcFunnel.failed, pct: dbcFunnel.failedPct, tone: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', accent: '#EF4444' } },
  ]

  return (
    <div style={{ background: '#F3F4F6', padding: '24px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {summaryMetrics.map(m => (
          <div key={m.label} style={{ background: '#fff', border: `1px solid ${m.border}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: m.accent, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: m.accent, opacity: 0.65, fontWeight: 500 }}>{m.valueSub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery funnel */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Delivery funnel</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {funnelSteps.map((step, idx) => {
            const r = 18, stroke = 4, size = 44
            const circ = 2 * Math.PI * r
            const dash = step.pct !== undefined ? (step.pct / 100) * circ : 0
            return (
              <div key={step.label} style={{ background: step.tone.bg, border: `1px solid ${step.tone.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: step.tone.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{step.label}</div>
                  <div style={{ fontSize: '11.5px', color: '#6B7280' }}>{step.sublabel}</div>
                </div>
                {idx > 0 && step.pct !== undefined && (
                  <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${step.pct}%`, background: step.tone.accent }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Attention needed cards */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Attention needed</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { accent: '#EF4444', title: 'Failed bill copies', value: String(dbcFunnel.failed), valueSub: `${dbcFunnel.failedPct}% failure rate`, detail: 'Check biller API connectivity. Repeated failures may block payment.', action: 'View failed CAs' },
            { accent: '#F59E0B', title: 'Pending > 48 hrs', value: String(Math.round(dbcFunnel.pending * 0.44)), valueSub: `of ${dbcFunnel.pending} pending`, detail: 'Bills waiting over 48 hours — need manual intervention to unblock.', action: 'Review stalled' },
            { accent: '#22C55E', title: 'Opt-in coverage', value: `${totalOpted > 0 ? Math.round(totalOpted / TOTAL_CAS * 100) : 0}%`, valueSub: undefined, detail: `${totalOpted} of ${TOTAL_CAS} CAs opted in. ${TOTAL_CAS - totalOpted} yet to opt.`, action: 'View not opted' },
            { accent: '#3B82F6', title: 'Multi-bill billers', value: String(multiBillCount), valueSub: 'billers', detail: `${multiBillCAs} CAs received more than 1 bill this month. Review for duplicates.`, action: 'Check duplicates' },
          ].map((card, idx) => (
            <div key={idx} style={{ background: '#fff', border: `1px solid #E5E7EB`, borderLeft: `3px solid ${card.accent}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.accent, flexShrink: 0 }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: card.accent, lineHeight: 1 }}>{card.value}</div>
                {card.valueSub && <div style={{ fontSize: '12px', color: card.accent, opacity: 0.65, fontWeight: 500 }}>{card.valueSub}</div>}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4, flex: 1 }}>{card.detail}</div>
              <button style={{ background: '#fff', border: `1px solid ${card.accent}`, borderRadius: '6px', color: card.accent, fontSize: '12px', fontWeight: 600, padding: '6px 12px', cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}>{card.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Bill copy status table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          {['Biller', 'State', 'Branch'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusView(tab.toLowerCase() as 'biller'|'state'|'branch')}
              style={{
                background: statusView === tab.toLowerCase() ? '#4F46E5' : '#fff',
                color: statusView === tab.toLowerCase() ? '#fff' : '#6B7280',
                border: `1px solid ${statusView === tab.toLowerCase() ? '#4F46E5' : '#E5E7EB'}`,
                borderRadius: '99px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                {statusView === 'biller' ? (
                  <>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '180px' }}>Biller</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px' }}>State</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Opted</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Received</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Pending</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Failed</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Delivery</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Coverage</th>
                  </>
                ) : (
                  <>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '180px' }}>State</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Opted</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Received</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Pending</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '70px' }}>Failed</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Delivery</th>
                    <th style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Coverage</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row: any, idx) => {
                const optedVal = row.opted || 0
                const receivedVal = row.received || 0
                const pendingVal = row.pending || 0
                const failedVal = row.failed || 0
                const coverage = optedVal > 0 ? Math.round(receivedVal / optedVal * 100) : 0
                const greenPct = optedVal > 0 ? Math.round(receivedVal / optedVal * 100) : 0
                const amberPct = optedVal > 0 ? Math.round(pendingVal / optedVal * 100) : 0
                const redPct = optedVal > 0 ? Math.round(failedVal / optedVal * 100) : 0
                const coverageBg = coverage >= 80 ? '#F0FDF4' : coverage >= 70 ? '#FFFBEB' : '#FEF2F2'
                const coverageColor = coverage >= 80 ? '#15803D' : coverage >= 70 ? '#B45309' : '#B91C1C'
                
                return (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#EEF2FF'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    {statusView === 'biller' ? (
                      <>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>{(row as any).biller}</td>
                        <td style={{ padding: '12px', color: '#6B7280' }}>{(row as any).state}</td>
                        <td style={{ padding: '12px', color: '#111827' }}>{optedVal}</td>
                        <td style={{ padding: '12px', color: '#15803D', fontWeight: 500 }}>{receivedVal}</td>
                        <td style={{ padding: '12px', color: '#B45309' }}>{pendingVal}</td>
                        <td style={{ padding: '12px', color: '#B91C1C', fontWeight: 500 }}>{failedVal}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', gap: '1px' }}>
                            {greenPct > 0 && <div style={{ flex: greenPct / 100, background: '#22C55E' }} />}
                            {amberPct > 0 && <div style={{ flex: amberPct / 100, background: '#F59E0B' }} />}
                            {redPct > 0 && <div style={{ flex: redPct / 100, background: '#EF4444' }} />}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: coverageBg, color: coverageColor, padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 500 }}>{coverage}%</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>{(row as any).state}</td>
                        <td style={{ padding: '12px', color: '#111827' }}>{optedVal}</td>
                        <td style={{ padding: '12px', color: '#15803D', fontWeight: 500 }}>{receivedVal}</td>
                        <td style={{ padding: '12px', color: '#B45309' }}>{pendingVal}</td>
                        <td style={{ padding: '12px', color: '#B91C1C', fontWeight: 500 }}>{failedVal}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', gap: '1px' }}>
                            {greenPct > 0 && <div style={{ flex: greenPct / 100, background: '#22C55E' }} />}
                            {amberPct > 0 && <div style={{ flex: amberPct / 100, background: '#F59E0B' }} />}
                            {redPct > 0 && <div style={{ flex: redPct / 100, background: '#EF4444' }} />}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: coverageBg, color: coverageColor, padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 500 }}>{coverage}%</span>
                        </td>
                      </>
                    )}
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


