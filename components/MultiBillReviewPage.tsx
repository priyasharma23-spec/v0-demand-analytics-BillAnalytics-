'use client'

import { useState } from 'react'
import { CAS, BRANCHES, STATES } from '@/lib/calculations'

interface MultiBillReviewPageProps {
  onBack: () => void
}

const MULTI_BILL_BILLERS = ['MSEDCL', 'BEST', 'DGVCL', 'TPDDL']

// Generate dummy multi-bill records per CA
function getMultiBillRecords() {
  const records: {
    ca: string; biller: string; state: string; branch: string;
    billCount: number; bills: { billNo: string; amount: number; period: string; type: string; status: 'Duplicate' | 'Supplementary' | 'Revised' | 'Original' }[]
  }[] = []

  STATES.forEach(state => {
    const billers = ['MSEDCL', 'BEST', 'DGVCL', 'TPDDL'].filter(b => {
      const entry = {
        'Maharashtra': ['MSEDCL', 'BEST'],
        'Gujarat':     ['DGVCL'],
        'Delhi':       ['TPDDL'],
      } as Record<string, string[]>
      return (entry[state] ?? []).includes(b)
    })
    if (billers.length === 0) return

    const branches = BRANCHES[state] ?? []
    branches.slice(0, 2).forEach((branch, bi) => {
      const cas = (CAS[branch] ?? []).slice(0, 3)
      cas.forEach((ca, ci) => {
        const biller = billers[ci % billers.length]
        const seed   = (bi * 7 + ci * 13) % 100
        if (seed > 45) return // ~55% of eligible CAs have multi-bills
        const baseAmt = 180000 + seed * 4200
        const type1: 'Original' = 'Original'
        const type2: 'Duplicate' | 'Supplementary' | 'Revised' =
          seed < 15 ? 'Duplicate' : seed < 30 ? 'Supplementary' : 'Revised'
        records.push({
          ca, biller, state, branch,
          billCount: 2,
          bills: [
            { billNo: `${biller.slice(0,3).toUpperCase()}${ca.slice(-4)}01`, amount: baseAmt,         period: 'Mar 2025', type: type1,  status: type1 },
            { billNo: `${biller.slice(0,3).toUpperCase()}${ca.slice(-4)}02`, amount: baseAmt + (seed % 2 === 0 ? 0 : seed * 120), period: 'Mar 2025', type: type2, status: type2 },
          ]
        })
      })
    })
  })
  return records
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Original:     { bg: '#EAF3DE', color: '#27500A' },
  Supplementary:{ bg: '#E6F1FB', color: '#0C447C' },
  Revised:      { bg: '#FAEEDA', color: '#633806' },
  Duplicate:    { bg: '#FCEBEB', color: '#A32D2D' },
}

export default function MultiBillReviewPage({ onBack }: MultiBillReviewPageProps) {
  const records = getMultiBillRecords()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'All' | 'Duplicate' | 'Supplementary' | 'Revised'>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const duplicateCount     = records.filter(r => r.bills.some(b => b.status === 'Duplicate')).length
  const supplementaryCount = records.filter(r => r.bills.some(b => b.status === 'Supplementary')).length
  const revisedCount       = records.filter(r => r.bills.some(b => b.status === 'Revised')).length

  const filtered = records.filter(r => {
    const matchSearch = !search || r.ca.toLowerCase().includes(search.toLowerCase()) ||
      r.biller.toLowerCase().includes(search.toLowerCase()) ||
      r.state.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || r.bills.some(b => b.status === filterStatus)
    return matchSearch && matchStatus
  })

  return (
    <div style={{ background: '#f0f5fa', minHeight: '100vh', padding: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '8px',
          border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff',
          fontSize: '13px', fontWeight: 500, color: '#192744', cursor: 'pointer',
        }}>
          ← Back to Billers
        </button>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#192744' }}>Multi-bill CA review</div>
          <div style={{ fontSize: '12px', color: '#858ea2' }}>CAs with more than one bill in the same period · review for duplicates</div>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total CAs affected', value: records.length, bg: '#f5f5f4', color: '#192744', border: 'rgba(0,0,0,0.10)' },
          { label: 'Possible duplicates', value: duplicateCount, bg: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1' },
          { label: 'Supplementary bills', value: supplementaryCount, bg: '#E6F1FB', color: '#0C447C', border: '#B5D4F4' },
          { label: 'Revised bills', value: revisedCount, bg: '#FAEEDA', color: '#633806', border: '#FAC775' },
        ].map(item => (
          <div key={item.label} style={{ padding: '8px 14px', borderRadius: '8px', background: item.bg, border: `0.5px solid ${item.border}` }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: item.color, opacity: 0.8 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <input
            placeholder="Search CA, biller or state…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: '36px', border: '0.5px solid rgba(0,0,0,0.20)', borderRadius: '8px', padding: '0 12px', fontSize: '13px', background: '#fff', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', background: '#f5f5f4', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {(['All', 'Duplicate', 'Supplementary', 'Revised'] as const).map(v => (
            <button key={v} onClick={() => setFilterStatus(v)} style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: filterStatus === v ? '#fff' : 'transparent',
              color: filterStatus === v ? '#192744' : '#858ea2',
            }}>
              {v}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginLeft: 'auto' }}>{filtered.length} CAs</div>
      </div>

      {/* CA list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(r => {
          const hasDuplicate = r.bills.some(b => b.status === 'Duplicate')
          const isExpanded   = expanded === r.ca
          return (
            <div key={r.ca} style={{
              background: '#fff', border: `0.5px solid ${hasDuplicate ? '#F7C1C1' : 'rgba(0,0,0,0.10)'}`,
              borderRadius: '10px', overflow: 'hidden',
            }}>
              {/* Row header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : r.ca)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafafa'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {hasDuplicate && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#192744' }}>{r.ca}</span>
                    <span style={{ fontSize: '11px', color: '#858ea2' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#185FA5' }}>{r.biller}</span>
                    <span style={{ fontSize: '11px', color: '#858ea2' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#858ea2' }}>{r.state}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '2px' }}>{r.branch} · {r.billCount} bills in Mar 2025</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {r.bills.map(b => (
                    <span key={b.billNo} style={{
                      fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                      background: STATUS_COLOR[b.status].bg,
                      color: STATUS_COLOR[b.status].color,
                    }}>
                      {b.status}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#858ea2', marginLeft: '8px' }}>{isExpanded ? '▲' : '▼'}</div>
              </div>

              {/* Expanded bill details */}
              {isExpanded && (
                <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '12px 16px', background: '#fafafa' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        {['Bill number', 'Period', 'Type', 'Amount', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.bills.map(b => (
                        <tr key={b.billNo}>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontFamily: 'monospace', color: '#192744' }}>{b.billNo}</td>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#858ea2' }}>{b.period}</td>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: STATUS_COLOR[b.status].bg, color: STATUS_COLOR[b.status].color }}>{b.type}</span>
                          </td>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 500, color: '#192744' }}>₹{(b.amount/100000).toFixed(2)}L</td>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: STATUS_COLOR[b.status].bg, color: STATUS_COLOR[b.status].color }}>{b.status}</span>
                          </td>
                          <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                            {b.status === 'Duplicate' ? (
                              <button style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '5px', border: '0.5px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                                Flag duplicate
                              </button>
                            ) : b.status === 'Supplementary' ? (
                              <button style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '5px', border: '0.5px solid #B5D4F4', background: '#E6F1FB', color: '#0C447C', cursor: 'pointer' }}>
                                Review & approve
                              </button>
                            ) : (
                              <button style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '5px', border: '0.5px solid rgba(0,0,0,0.12)', background: '#f5f5f4', color: '#6b6b67', cursor: 'pointer' }}>
                                Mark reviewed
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {hasDuplicate && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#FCEBEB', borderRadius: '6px', border: '0.5px solid #F7C1C1', fontSize: '12px', color: '#A32D2D' }}>
                      ⚠ Possible duplicate detected — both bills have the same period and similar amounts. Review before payment to avoid double payment.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
