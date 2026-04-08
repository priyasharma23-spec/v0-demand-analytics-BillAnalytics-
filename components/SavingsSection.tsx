'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
import { SummaryCard } from './SummaryCard'
import { KpiCard } from './KpiCard'
import { getFilteredBills, CAS, getCABills, inr, inrK } from '@/lib/calculations'

interface SavingsSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

export default function SavingsSection({ appState }: SavingsSectionProps) {
  const cleanVsPenaltyRef   = useRef<HTMLCanvasElement>(null)
  const savingsTrendRef     = useRef<HTMLCanvasElement>(null)
  const cleanVsPenaltyChart = useRef<Chart | null>(null)
  const savingsTrendChart   = useRef<Chart | null>(null)

  const [summary, setSummary] = useState({
    totalBill: 0, avoidable: 0, cleanBill: 0,
    cleanPct: 0, avoidablePct: 0,
    contractSaving: 0, pfSaving: 0, totalSaving: 0,
    earnedPfIncentive: 0, potentialPfIncentive: 0,
    promptPaymentPotential: 0, totalIncentivePotential: 0,
    digitalPaymentBenefit: 0, earlyPaymentDiscount: 0,
    totalEarnedIncentives: 0, digitalPotential: 0,
    totalBillGenerated: 0, paidViaPlatform: 0, paidViaPlatformPct: 0,
    earnedEarlyBenefit: 0, earlyBenefitBills: 0,
    missedDigitalDiscount: 0, missedDigitalAmount: 0, totalPeriods: 0,
  })
  const [cleanData, setCleanData]             = useState<any[]>([])
  const [savingsTrendData, setSavingsTrendData] = useState<any[]>([])
  const [cleanChartView, setCleanChartView]   = useState<'amount' | 'count'>('amount')

  useEffect(() => {
    const data = getFilteredBills(
      'monthly',
      appState?.stateF  ?? 'all',
      appState?.branchF ?? 'all',
      appState?.caF     ?? 'all'
    )

    const totalBill      = data.reduce((s, d) => s + d.totalBill,    0)
    const avoidable      = data.reduce((s, d) => s + d.totalLeakage, 0)
    const cleanBill      = totalBill - avoidable
    const cleanPct       = Math.round(cleanBill  / Math.max(totalBill, 1) * 100)
    const avoidablePct   = Math.round(avoidable  / Math.max(totalBill, 1) * 100)
    const pfSaving       = data.reduce((s, d) => s + d.pfPenalty + (d.lvSurcharge ?? 0), 0)
    const mdiArr         = data.map(d => d.mdi)
    const sorted         = [...mdiArr].sort((a, b) => a - b)
    const p90            = sorted[Math.floor(sorted.length * 0.9)] ?? 0
    const recommended    = Math.round(p90 * 1.15 / 10) * 10
    const avgContracted  = Math.round(data.reduce((s, d) => s + d.contracted, 0) / Math.max(data.length, 1))
    const avgDemandRate  = data.reduce((s, d) => s + d.fixedCharge / Math.max(d.contracted, 1), 0) / Math.max(data.length, 1)
    const annualExcess   = data.reduce((s, d) => s + d.excessCharge, 0)
    const extraFixed     = Math.max(0, recommended - avgContracted) * avgDemandRate * 12
    const contractSaving = Math.max(0, Math.round(annualExcess - extraFixed))
    const totalSaving    = contractSaving + pfSaving

    const totalEnergyCharge       = data.reduce((s, d) => s + d.energyCharge, 0)
    const earnedPfIncentive       = data.reduce((s, d) => s + d.pfIncentive, 0)
    const digitalPaymentBenefit   = data.reduce((s, d) => s + (d.digitalPaymentBenefit ?? 0), 0)
    const earlyPaymentDiscount    = data.reduce((s, d) => s + (d.earlyPaymentDiscount ?? 0), 0)
    const totalEarnedIncentives   = earnedPfIncentive + digitalPaymentBenefit + earlyPaymentDiscount
    const potentialPfIncentive    = Math.round(totalEnergyCharge * ((0.97 - 0.95) / 0.95) * 0.5)
    const totalBillBeforeLPS      = data.reduce((s, d) => s + d.totalBill - d.latePayment, 0)
    const promptPaymentPotential  = Math.round(totalBillBeforeLPS * 0.015)
    const digitalPotential        = Math.round(totalEnergyCharge * 0.0075)
    const totalIncentivePotential = potentialPfIncentive + promptPaymentPotential + digitalPotential
    const totalBillGenerated      = totalBill
    const paidViaPlatform         = data.reduce((s, d) => s + ((d.earlyPaymentDiscount ?? 0) > 0 || (d.digitalPaymentBenefit ?? 0) > 0 ? d.totalBill : 0), 0)
    const paidViaPlatformPct      = Math.round(paidViaPlatform / Math.max(totalBillGenerated, 1) * 100)
    const earnedEarlyBenefit      = earlyPaymentDiscount
    const earlyBenefitBills       = data.filter(d => (d.earlyPaymentDiscount ?? 0) > 0).length
    const missedDigitalAmount     = data.filter(d => d.latePayment === 0 && (d.digitalPaymentBenefit ?? 0) === 0).reduce((s, d) => s + d.totalBill, 0)
    const missedDigitalDiscount   = Math.round(missedDigitalAmount * 0.0075)

    setSummary({
      totalBill, avoidable, cleanBill, cleanPct, avoidablePct,
      contractSaving, pfSaving, totalSaving,
      earnedPfIncentive, potentialPfIncentive, promptPaymentPotential, totalIncentivePotential,
      digitalPaymentBenefit, earlyPaymentDiscount, totalEarnedIncentives, digitalPotential,
      totalBillGenerated, paidViaPlatform, paidViaPlatformPct,
      earnedEarlyBenefit, earlyBenefitBills,
      missedDigitalDiscount, missedDigitalAmount, totalPeriods: data.length,
    })

    const allCAs = Object.values(CAS).flat()
    setCleanData(data.map((d, mi) => {
      const monthBills   = allCAs.map(ca => getCABills(ca, 'monthly')[mi]).filter(Boolean)
      const cleanCount   = monthBills.filter(b => (b?.totalLeakage ?? 0) === 0).length
      const penaltyCount = monthBills.filter(b => (b?.totalLeakage ?? 0) > 0).length
      return { label: d.label, clean: d.totalBill - d.totalLeakage, penalty: d.totalLeakage, cleanCount, penaltyCount }
    }))

    setSavingsTrendData(data.map(d => ({
      label:          d.label,
      totalSaved:     (d.digitalPaymentBenefit ?? 0) + (d.earlyPaymentDiscount ?? 0) + d.pfIncentive,
      pfIncentive:    d.pfIncentive,
      digitalBenefit: d.digitalPaymentBenefit ?? 0,
      earlyDiscount:  d.earlyPaymentDiscount ?? 0,
    })))
  }, [appState?.stateF, appState?.branchF, appState?.caF])

  // Clean vs penalty chart
  useEffect(() => {
    if (cleanData.length === 0) return
    const isAmount = cleanChartView === 'amount'
    const timer = setTimeout(() => {
      if (!cleanVsPenaltyRef.current) return
      const ctx = cleanVsPenaltyRef.current.getContext('2d')
      if (!ctx) return
      if (cleanVsPenaltyChart.current) cleanVsPenaltyChart.current.destroy()
      cleanVsPenaltyChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: cleanData.map(d => d.label),
          datasets: [
            {
              label: isAmount ? 'Clean bill' : 'Clean bills',
              data: cleanData.map(d => isAmount ? d.clean : d.cleanCount),
              backgroundColor: 'rgba(29,158,117,0.75)',
              borderRadius: 0,
              borderSkipped: false,
              barPercentage: 0.75,
              categoryPercentage: 0.85,
            },
            {
              label: isAmount ? 'Penalties' : 'Penalised bills',
              data: cleanData.map(d => isAmount ? d.penalty : d.penaltyCount),
              backgroundColor: '#E24B4A',
              borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } as any,
              borderSkipped: false,
              barPercentage: 0.75,
              categoryPercentage: 0.85,
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
                label: item => isAmount
                  ? `  ${item.dataset.label}: ${inrK(item.raw as number)}`
                  : `  ${item.dataset.label}: ${item.raw} bills`,
                footer: items => isAmount
                  ? `Total: ${inrK(items.reduce((s, i) => s + (i.raw as number), 0))}`
                  : `Total: ${items.reduce((s, i) => s + (i.raw as number), 0)} bills`,
              }
            }
          },
          scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
            y: {
              stacked: true,
              border: { display: false },
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                color: '#858ea2',
                font: { size: 11 },
                callback: isAmount
                  ? (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L'
                  : (v: any) => Number.isInteger(Number(v)) ? v + ' bills' : '',
              }
            },
          },
        },
      })
    }, 0)
    return () => {
      clearTimeout(timer)
      if (cleanVsPenaltyChart.current) cleanVsPenaltyChart.current.destroy()
    }
  }, [cleanData, cleanChartView])

  // Monthly savings trend
  useEffect(() => {
    if (!savingsTrendRef.current || savingsTrendData.length === 0) return
    const ctx = savingsTrendRef.current.getContext('2d')
    if (!ctx) return
    if (savingsTrendChart.current) savingsTrendChart.current.destroy()
    savingsTrendChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: savingsTrendData.map(d => d.label),
        datasets: [{
          label: 'Total incentives earned',
          data: savingsTrendData.map(d => d.totalSaved),
          borderColor: '#1D9E75',
          borderWidth: 2.5,
          pointBackgroundColor: '#1D9E75',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
          backgroundColor: (context: any) => {
            const { ctx: c, chartArea } = context.chart
            if (!chartArea) return 'rgba(29,158,117,0.08)'
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            g.addColorStop(0, 'rgba(29,158,117,0.18)')
            g.addColorStop(1, 'rgba(29,158,117,0.01)')
            return g
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#192744',
            titleFont: { size: 13, weight: 'bold' as const },
            bodyColor: '#3B6D11',
            bodyFont: { size: 13 },
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              title: items => items[0].label,
              label: item => `Savings: ${inr(item.raw as number)}`,
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
          y: {
            border: { display: false },
            grid: { color: 'rgba(0,0,0,0.05)' },
            min: 0,
            ticks: {
              color: '#858ea2',
              font: { size: 11 },
              callback: (v: any) => {
                const n = Number(v)
                if (n >= 100000) return '₹' + (n/100000).toFixed(1) + 'L'
                if (n >= 1000)   return '₹' + (n/1000).toFixed(0) + 'K'
                return '₹' + n
              },
            },
          },
        },
      },
    })
    return () => { if (savingsTrendChart.current) savingsTrendChart.current.destroy() }
  }, [savingsTrendData])

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        <SummaryCard label="Total bill generated"    value={inr(summary.totalBillGenerated)}    sub={`across ${summary.totalPeriods ?? 12} billing periods`}           subColor="#858ea2" borderColor="#2500D7" />
        <SummaryCard label="Paid via platform"        value={inr(summary.paidViaPlatform)}        sub={`${summary.paidViaPlatformPct}% of total bill`}                   subColor="#185FA5" borderColor="#185FA5" />
        <SummaryCard label="Early payment benefit"    value={inr(summary.earnedEarlyBenefit)}     sub={`earned across ${summary.earlyBenefitBills} billing periods`}      subColor="#3B6D11" borderColor="#1A7A45" />
        <SummaryCard label="Missed digital discount"  value={inr(summary.missedDigitalDiscount)}  sub="bills paid outside platform · 0.75% discount foregone"            subColor="#A32D2D" borderColor="#E24B4A" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '12px', marginBottom: '12px' }}>

        {/* Clean vs penalty with toggle */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
            <div>
              <div style={{ fontSize:'14px', fontWeight:600, color:'#192744', marginBottom:'3px' }}>Realised savings vs avoidable losses</div>
              <div style={{ fontSize:'12px', color:'#858ea2' }}>
                {cleanChartView === 'amount' ? 'Clean bill ₹ vs penalty ₹ · monthly' : 'Count of clean bills vs penalised bills · monthly'}
              </div>
            </div>
            <div style={{ display:'flex', background:'#f5f5f4', borderRadius:'8px', padding:'3px', gap:'2px', flexShrink:0 }}>
              {(['amount', 'count'] as const).map(v => (
                <button key={v} onClick={() => setCleanChartView(v)} style={{
                  padding:'4px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:500,
                  border:'none', cursor:'pointer',
                  background: cleanChartView === v ? '#fff' : 'transparent',
                  color: cleanChartView === v ? '#192744' : '#858ea2',
                  boxShadow: cleanChartView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {v === 'amount' ? '₹ Amount' : '# Count'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'14px', marginBottom:'10px', fontSize:'12px', color:'#6b6b67' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'rgba(29,158,117,0.75)', display:'inline-block' }} />
              {cleanChartView === 'amount' ? 'Clean bill' : 'Clean bills'}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'#E24B4A', display:'inline-block' }} />
              {cleanChartView === 'amount' ? 'Penalties' : 'Penalised bills'}
            </span>
          </div>
          <div style={{ position:'relative', width:'100%', height:'240px' }}>
            <canvas ref={cleanVsPenaltyRef}></canvas>
          </div>
        </div>

        {/* Monthly savings trend */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize:'14px', fontWeight:600, color:'#192744', marginBottom:'3px' }}>Monthly savings trend</div>
          <div style={{ fontSize:'12px', color:'#858ea2', marginBottom:'10px' }}>Total incentives earned per month · PF rebate + digital payment + early payment</div>
          <div style={{ display:'flex', gap:'14px', marginBottom:'10px', fontSize:'12px', color:'#6b6b67' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'18px', height:'2px', background:'#1D9E75', display:'inline-block', borderRadius:'1px' }} />
              PF incentive + digital + early payment · monthly
            </span>
          </div>
          <div style={{ position:'relative', width:'100%', height:'240px' }}>
            <canvas ref={savingsTrendRef}></canvas>
          </div>
        </div>

      </div>

      {/* KPI insight cards */}
      <div style={{ fontSize:'11px', fontWeight:500, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>Insights</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:'10px', marginBottom:'12px' }}>
        <KpiCard variant="good" label="Contract revision saving" value={inr(summary.contractSaving)}   desc="Raise contracted demand to P90 MDI + 15% buffer · eliminates most excess charges" />
        <KpiCard variant="good" label="PF improvement saving"    value={inr(summary.pfSaving)}          desc="Eliminate PF penalties by maintaining power factor ≥ 0.90 via capacitor banks" />
        <KpiCard variant="info" label="Total recoverable"        value={inr(summary.totalSaving)}       desc={`${Math.round(summary.totalSaving / Math.max(summary.totalBill,1)*100)}% of total bill can be avoided with recommended actions`} />
        <KpiCard variant={summary.cleanPct >= 90 ? 'good' : 'warn'} label="Clean bill ratio" value={`${summary.cleanPct}%`} desc="Share of bill that is legitimate base charges — higher is better" />
      </div>

      {/* Incentives & Credits card */}
      <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.10)', borderRadius:'12px', padding:'16px 18px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
          <div>
            <div style={{ fontSize:'14px', fontWeight:600, color:'#192744', marginBottom:'2px' }}>Incentives & credits</div>
            <div style={{ fontSize:'12px', color:'#858ea2' }}>Earned vs potential · PF rebate + digital payment + early payment discount</div>
          </div>
          <div style={{ display:'flex', gap:'16px', alignItems:'flex-end', flexShrink:0 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'#858ea2', marginBottom:'2px' }}>Currently earning</div>
              <div style={{ fontSize:'18px', fontWeight:700, color:'#3B6D11' }}>{inr(summary.totalEarnedIncentives)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'#858ea2', marginBottom:'2px' }}>Total potential</div>
              <div style={{ fontSize:'18px', fontWeight:700, color:'#185FA5' }}>{inr(summary.totalIncentivePotential)}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:'10px', marginBottom:'14px' }}>
          <div style={{ background: summary.digitalPaymentBenefit > 0 ? '#EAF3DE' : '#f9f9f9', border: `0.5px solid ${summary.digitalPaymentBenefit > 0 ? '#C0DD97' : 'rgba(0,0,0,0.08)'}`, borderRadius:'8px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'5px' }}>Digital payment benefit</div>
            <div style={{ fontSize:'20px', fontWeight:600, color: summary.digitalPaymentBenefit > 0 ? '#3B6D11' : '#858ea2' }}>{inr(summary.digitalPaymentBenefit)}</div>
            <div style={{ fontSize:'11px', color:'#858ea2', marginTop:'3px' }}>Earned this period</div>
          </div>
          <div style={{ background: summary.earlyPaymentDiscount > 0 ? '#EAF3DE' : '#f9f9f9', border: `0.5px solid ${summary.earlyPaymentDiscount > 0 ? '#C0DD97' : 'rgba(0,0,0,0.08)'}`, borderRadius:'8px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'5px' }}>Early payment discount</div>
            <div style={{ fontSize:'20px', fontWeight:600, color: summary.earlyPaymentDiscount > 0 ? '#3B6D11' : '#858ea2' }}>{inr(summary.earlyPaymentDiscount)}</div>
            <div style={{ fontSize:'11px', color:'#858ea2', marginTop:'3px' }}>Earned this period</div>
          </div>
          <div style={{ background: summary.earnedPfIncentive > 0 ? '#EAF3DE' : '#f9f9f9', border: `0.5px solid ${summary.earnedPfIncentive > 0 ? '#C0DD97' : 'rgba(0,0,0,0.08)'}`, borderRadius:'8px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'5px' }}>PF incentive</div>
            <div style={{ fontSize:'20px', fontWeight:600, color: summary.earnedPfIncentive > 0 ? '#3B6D11' : '#858ea2' }}>{inr(summary.earnedPfIncentive)}</div>
            <div style={{ fontSize:'11px', color:'#858ea2', marginTop:'3px' }}>Earned this period</div>
          </div>
          <div style={{ background: summary.totalIncentivePotential - summary.totalEarnedIncentives > 0 ? '#E6F1FB' : '#f9f9f9', border: `0.5px solid ${summary.totalIncentivePotential - summary.totalEarnedIncentives > 0 ? '#B5D4F4' : 'rgba(0,0,0,0.08)'}`, borderRadius:'8px', padding:'12px 14px' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#858ea2', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'5px' }}>Potential upside</div>
            <div style={{ fontSize:'20px', fontWeight:600, color: summary.totalIncentivePotential - summary.totalEarnedIncentives > 0 ? '#185FA5' : '#858ea2' }}>{inr(Math.max(0, summary.totalIncentivePotential - summary.totalEarnedIncentives))}</div>
            <div style={{ fontSize:'11px', color:'#858ea2', marginTop:'3px' }}>If all targets met</div>
          </div>
        </div>
      </div>

    </div>
  )
}
