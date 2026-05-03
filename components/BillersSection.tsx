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
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Billers Advance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { accent: '#DC2626', title: 'FAILED BILL COPIES', value: '10', valueSub: '8% failure rate', detail: 'Check biller API. Repeated failures block payment.', action: 'Fix now' },
            { accent: '#F59E0B', title: 'PENDING > 48 HRS', value: '7', valueSub: 'of 16 pending', detail: 'Bills stalled over 48 hrs — manual intervention needed.', action: 'Review' },
            { accent: '#22C55E', title: 'OPT-IN COVERAGE', value: '75%', valueSub: '120 of 160 CAs', detail: '40 CAs yet to opt in. Consider nudging.', action: 'View' },
            { accent: '#2563EB', title: 'MULTI-BILL BILLERS', value: '4', valueSub: 'billers', detail: '8 CAs received 2+ bills. Review for duplicates.', action: 'Check' },
          ].map((card, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: `1px solid #f0f1f5`,
                borderTop: `2.5px solid ${card.accent}`,
                borderRadius: 6,
                boxShadow: '0 1px 3px rgba(25,39,68,.04)',
                padding: '18px 20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                cursor: 'default',
                minHeight: 0,
              }}
            >
              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: card.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: card.accent, textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1 }}>
                  {card.title}
                </span>
              </div>

              {/* Value */}
              <div style={{ fontSize: 28, fontWeight: 700, color: card.accent, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>
                {card.value}
              </div>

              {/* Context + Detail — detail is the hero */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#858ea2', marginBottom: 3 }}>
                  {card.valueSub}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#192744', letterSpacing: '-0.01em' }}>
                  {card.detail}
                </div>
              </div>

              {/* CTA link */}
              <button
                style={{
                  alignSelf: 'flex-start',
                  fontSize: 12,
                  fontWeight: 500,
                  color: card.accent,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginTop: 'auto',
                }}
              >
                {card.action} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bill copy status — card grid */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Bill Copy Status — by {statusView.charAt(0).toUpperCase() + statusView.slice(1)}</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Opt-in CAs · delivery status and coverage</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Summary stats */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {[
                { val: tableData.reduce((s: number, r: any) => s + (r.opted || 0), 0), label: 'expected', color: '#192744' },
                { val: tableData.reduce((s: number, r: any) => s + (r.received || 0), 0), label: 'received', color: '#36b37e' },
                { val: tableData.reduce((s: number, r: any) => s + (r.pending || 0), 0), label: 'pending', color: '#f59e0b' },
                { val: tableData.reduce((s: number, r: any) => s + (r.failed || 0), 0), label: 'failed', color: '#e53935' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '10px', color: '#858ea2', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ width: '1px', height: '32px', background: '#f0f1f5' }} />
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
              {(['biller', 'state', 'branch'] as const).map(tab => (
                <button key={tab} onClick={() => setStatusView(tab)} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '3px 12px', fontSize: '11px', background: statusView === tab ? '#1c5af4' : 'transparent', color: statusView === tab ? '#fff' : '#858ea2', fontWeight: statusView === tab ? 600 : 400, transition: 'all .12s' }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {tableData.map((row: any, idx: number) => {
            const name       = row.biller || row.state || row.branch || ''
            const stateName  = row.state || ''
            const opted      = row.opted    || 0
            const received   = row.received || 0
            const pending    = row.pending  || 0
            const failed     = row.failed   || 0
            const pct        = opted > 0 ? Math.round(received / opted * 100) : 0
            const color      = pct >= 85 ? '#36b37e' : pct >= 70 ? '#f59e0b' : '#e53935'
            const rcvdW      = opted > 0 ? (received / opted) * 100 : 0
            const pendW      = opted > 0 ? (pending  / opted) * 100 : 0
            const failW      = opted > 0 ? (failed   / opted) * 100 : 0
            const r = 32, circ = 2 * Math.PI * r, filled = (pct / 100) * circ
            return (
              <div key={idx} style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '8px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'border-color .15s, box-shadow .15s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color + '55'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(25,39,68,.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f0f1f5'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(25,39,68,.04)'; }}
              >
                <div style={{ padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {/* Ring chart */}
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeOpacity="0.15" strokeWidth="7"/>
                    <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${filled} ${circ}`} transform="rotate(-90 40 40)"/>
                    <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill={color} fontFamily="Inter,sans-serif">{pct}%</text>
                  </svg>
                  {/* Name + state */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#192744', lineHeight: 1.2 }}>{name}</div>
                    {stateName && statusView === 'biller' && <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '3px' }}>{stateName}</div>}
                  </div>
                  {/* Expected */}
                  <div style={{ fontSize: '11px', color: '#858ea2' }}>
                    <span style={{ fontWeight: 600, color: '#192744' }}>{opted}</span> Expected
                  </div>
                  {/* rcvd · pend · fail */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {[{ val: received, label: 'rcvd', color: '#36b37e' }, { val: pending, label: 'pend', color: '#f59e0b' }, { val: failed, label: 'fail', color: '#e53935' }].map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.val}</span>
                        <span style={{ fontSize: '9px', color: '#858ea2', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bottom status bar */}
                <div style={{ height: '6px', display: 'flex' }}>
                  <div style={{ width: rcvdW + '%', background: '#36b37e', opacity: 0.8 }} />
                  <div style={{ width: pendW + '%', background: '#f59e0b', opacity: 0.8 }} />
                  <div style={{ width: failW + '%', background: '#e53935', opacity: 0.8 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', paddingTop: '12px' }}>
          {[{ color: '#36b37e', label: 'Received' }, { color: '#f59e0b', label: 'Pending' }, { color: '#e53935', label: 'Failed' }].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '4px', borderRadius: '99px', background: l.color, opacity: 0.8 }} />
              <span style={{ fontSize: '11px', color: '#858ea2' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}


