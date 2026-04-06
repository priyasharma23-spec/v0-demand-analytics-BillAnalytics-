'use client'

import { useState } from 'react'
import { KpiCard } from './KpiCard'

interface BillersSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

export default function BillersSection({ appState }: BillersSectionProps) {
  const [funnelView, setFunnelView] = useState<'all'|'state'|'biller'>('all')
  const [statusView, setStatusView] = useState<'state'|'biller'>('state')

  const stateData = [
    { state:'Maharashtra',   billers:8, total:280, generated:280, received:262, processed:248, paid:241, dropPct:14 },
    { state:'Delhi',         billers:6, total:210, generated:210, received:195, processed:186, paid:178, dropPct:15 },
    { state:'Karnataka',     billers:7, total:195, generated:195, received:184, processed:175, paid:169, dropPct:13 },
    { state:'Tamil Nadu',    billers:5, total:168, generated:168, received:158, processed:151, paid:147, dropPct:13 },
    { state:'Gujarat',       billers:6, total:155, generated:155, received:147, processed:140, paid:136, dropPct:12 },
    { state:'Rajasthan',     billers:5, total:142, generated:142, received:132, processed:126, paid:122, dropPct:14 },
    { state:'Uttar Pradesh', billers:6, total:134, generated:134, received:124, processed:118, paid:114, dropPct:15 },
    { state:'West Bengal',   billers:5, total:122, generated:122, received:113, processed:108, paid:105, dropPct:14 },
  ]

  const billerData = [
    { biller:'MSEDCL',        state:'Maharashtra',   total:95, generated:95, received:89, processed:84, paid:82,  dropPct:14 },
    { biller:'BEST',          state:'Maharashtra',   total:88, generated:88, received:83, processed:79, paid:76,  dropPct:14 },
    { biller:'BESCOM',        state:'Karnataka',     total:82, generated:82, received:77, processed:73, paid:71,  dropPct:13 },
    { biller:'TPDDL',         state:'Delhi',         total:78, generated:78, received:73, processed:70, paid:67,  dropPct:14 },
    { biller:'TNEB',          state:'Tamil Nadu',    total:74, generated:74, received:70, processed:67, paid:65,  dropPct:12 },
    { biller:'BSES Rajdhani', state:'Delhi',         total:72, generated:72, received:67, processed:64, paid:62,  dropPct:14 },
    { biller:'DGVCL',         state:'Gujarat',       total:68, generated:68, received:65, processed:62, paid:60,  dropPct:12 },
    { biller:'JVVNL',         state:'Rajasthan',     total:65, generated:65, received:60, processed:57, paid:55,  dropPct:15 },
    { biller:'UPPCL',         state:'Uttar Pradesh', total:62, generated:62, received:57, processed:54, paid:52,  dropPct:16 },
    { biller:'WBSEDCL',       state:'West Bengal',   total:58, generated:58, received:54, processed:51, paid:49,  dropPct:16 },
  ]

  const dbcTableData = [
    { biller:'MSEDCL',        state:'Maharashtra',   opted:95, received:76, pending:12, failed:7  },
    { biller:'BESCOM',        state:'Karnataka',     opted:82, received:68, pending:9,  failed:5  },
    { biller:'TPDDL',         state:'Delhi',         opted:78, received:60, pending:11, failed:7  },
    { biller:'TNEB',          state:'Tamil Nadu',    opted:74, received:59, pending:10, failed:5  },
    { biller:'BEST',          state:'Maharashtra',   opted:68, received:52, pending:8,  failed:8  },
    { biller:'DGVCL',         state:'Gujarat',       opted:53, received:39, pending:7,  failed:7  },
    { biller:'JVVNL',         state:'Rajasthan',     opted:48, received:35, pending:6,  failed:7  },
    { biller:'UPPCL',         state:'Uttar Pradesh', opted:44, received:31, pending:7,  failed:6  },
    { biller:'WBSEDCL',       state:'West Bengal',   opted:40, received:28, pending:6,  failed:6  },
    { biller:'BSES Rajdhani', state:'Delhi',         opted:36, received:24, pending:4,  failed:8  },
  ]

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>
      {/* Section 1 — Summary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Total billers',    value: '48',    sub: 'across 8 states',  subColor: '#858ea2' },
          { label: 'Bills generated',  value: '1,284', sub: 'this month',       subColor: '#3B6D11' },
          { label: 'Bills paid',       value: '1,106', sub: '86% conversion',   subColor: '#3B6D11' },
          { label: 'Pending / failed', value: '178',   sub: '14% drop-off',     subColor: '#A32D2D' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>{m.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: '#192744' }}>{m.value}</div>
            <div style={{ fontSize: '11px', marginTop: '3px', color: m.subColor }}>{m.sub}</div>
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {[
            { stage: 'Active CAs', count: 700, drop: null, color: '#C47A00', bg: '#FFF9E6' },
            { stage: 'Generated', count: 530, drop: '−170', color: '#1755C8', bg: '#EAF2FF' },
            { stage: 'Paid', count: 420, drop: '−110', color: '#1A7A45', bg: '#E6F9EF' },
          ].map(item => (
            <div key={item.stage} style={{ background: item.bg, border: `1px solid ${item.color}20`, borderRadius: '10px', padding: '14px 16px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: item.color, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{item.stage}</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.count}</div>
              {item.drop && (
                <div style={{ fontSize: '12px', color: '#E24B4A', fontWeight: 600, marginTop: '4px' }}>{item.drop}</div>
              )}
            </div>
          ))}
        </div>

        {/* Bar rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Active CAs', pct: 100, count: 700, color: '#1755C8', loss: null },
            { label: 'Bills generated', pct: 75.7, count: 530, color: '#1755C8', loss: 170 },
            { label: 'Bills paid', pct: 60, count: 420, color: '#1A7A45', loss: 110 },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: '#858ea2', fontWeight: 500, width: '100px', flexShrink: 0 }}>{row.label}</div>
              <div style={{ flex: 1, height: '28px', background: '#e8e8e8', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px' }}>
                  <div style={{ height: '22px', padding: '0 8px', borderRadius: '11px', fontSize: '11px', fontWeight: 600, color: '#fff', background: row.color, display: 'flex', alignItems: 'center' }}>
                    {row.count}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#192744', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{row.pct}%</div>
              {row.loss && (
                <div style={{ fontSize: '12px', color: '#E24B4A', fontWeight: 600, minWidth: '42px', textAlign: 'right' }}>−{row.loss}</div>
              )}
            </div>
          ))}
        </div>

        {/* Exception pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'Not generated', val: 170, color: '#E24B4A', bg: '#FEF0F0' },
              { label: 'Unpaid', val: 110, color: '#C47A00', bg: '#FFF8ED' },
              { label: 'Approval hold', val: 48, color: '#C47A00', bg: '#FFF8ED' },
            ].map(e => (
              <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: e.bg, borderRadius: '20px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: e.color }}>{e.val}</span>
                <span style={{ color: e.color, fontWeight: 500 }}>{e.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A7A45' }}>60% conversion</div>
        </div>

      </div>

      {/* Section 3 — Bill status table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>

        {/* Header + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
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

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
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
            { num: 450, label: 'Opted in',  sub: 'bill_copy_enabled = true', bg: '#E6F1FB', numColor: '#0C447C', labelColor: '#0C447C', subColor: '#185FA5' },
            { num: 354, label: 'Received',  sub: '78.7% of opted',           bg: '#EAF3DE', numColor: '#27500A', labelColor: '#27500A', subColor: '#3B6D11' },
            { num: 62,  label: 'Pending',   sub: '13.8% awaiting',           bg: '#FAEEDA', numColor: '#633806', labelColor: '#633806', subColor: '#854F0B' },
            { num: 34,  label: 'Failed',    sub: '7.6% failed fetch',         bg: '#FCEBEB', numColor: '#791F1F', labelColor: '#791F1F', subColor: '#A32D2D' },
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
          <KpiCard variant="danger" label="Failed bill copies"   value="34"   desc="7.6% fetch failure rate — check biller API connectivity for these CAs" />
          <KpiCard variant="warn"   label="Pending >48 hrs"      value="28"   desc="28 of 62 pending CAs have been waiting over 48 hours — needs manual intervention" />
          <KpiCard variant="good"   label="Opt-in coverage"      value="78%"  desc="450 of 580 total CAs have bill_copy_enabled — 130 CAs yet to opt in" />
          <KpiCard variant="info"   label="Successful delivery"  value="354"  desc="78.7% of opted-in CAs received digital bill copy successfully this month" />
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
