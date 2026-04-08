'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
import { SummaryCard } from './SummaryCard'
import { KpiCard } from './KpiCard'
import { getFilteredBills, inr, inrK } from '@/lib/calculations'

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
  })
  const [cleanData,       setCleanData]       = useState<any[]>([])
  const [savingsTrendData, setSavingsTrendData] = useState<any[]>([])

  useEffect(() => {
    const data = getFilteredBills(
      'monthly',
      appState?.stateF  ?? 'all',
      appState?.branchF ?? 'all',
      appState?.caF     ?? 'all'
    )

    const totalBill    = data.reduce((s, d) => s + d.totalBill,    0)
    const avoidable    = data.reduce((s, d) => s + d.totalLeakage, 0)
    const cleanBill    = totalBill - avoidable
    const cleanPct     = Math.round(cleanBill  / Math.max(totalBill, 1) * 100)
    const avoidablePct = Math.round(avoidable  / Math.max(totalBill, 1) * 100)
    const pfSaving     = data.reduce((s, d) => s + d.pfPenalty + (d.lvSurcharge ?? 0), 0)

    const mdiArr     = data.map(d => d.mdi)
    const sorted     = [...mdiArr].sort((a, b) => a - b)
    const p90        = sorted[Math.floor(sorted.length * 0.9)] ?? 0
    const recommended    = Math.round(p90 * 1.15 / 10) * 10
    const avgContracted  = Math.round(data.reduce((s, d) => s + d.contracted, 0) / Math.max(data.length, 1))
    const avgDemandRate  = data.reduce((s, d) => s + d.fixedCharge / Math.max(d.contracted, 1), 0) / Math.max(data.length, 1)
    const annualExcess   = data.reduce((s, d) => s + d.excessCharge, 0)
    const extraFixed     = Math.max(0, recommended - avgContracted) * avgDemandRate * 12
    const contractSaving = Math.max(0, Math.round(annualExcess - extraFixed))
    const totalSaving    = contractSaving + pfSaving

    const totalEnergyCharge      = data.reduce((s, d) => s + d.energyCharge, 0)
    const earnedPfIncentive      = data.reduce((s, d) => s + d.pfIncentive, 0)
    const digitalPaymentBenefit  = data.reduce((s, d) => s + (d.digitalPaymentBenefit ?? 0), 0)
    const earlyPaymentDiscount   = data.reduce((s, d) => s + (d.earlyPaymentDiscount ?? 0), 0)
    const totalEarnedIncentives  = earnedPfIncentive + digitalPaymentBenefit + earlyPaymentDiscount
    const potentialPfIncentive   = Math.round(totalEnergyCharge * ((0.97 - 0.95) / 0.95) * 0.5)
    const totalBillBeforeLPS     = data.reduce((s, d) => s + d.totalBill - d.latePayment, 0)
    const promptPaymentPotential = Math.round(totalBillBeforeLPS * 0.015)
    const digitalPotential       = Math.round(totalEnergyCharge * 0.0075)
    const totalIncentivePotential = potentialPfIncentive + promptPaymentPotential + digitalPotential

    setSummary({
      totalBill, avoidable, cleanBill, cleanPct, avoidablePct,
      contractSaving, pfSaving, totalSaving,
      earnedPfIncentive, potentialPfIncentive, promptPaymentPotential, totalIncentivePotential,
      digitalPaymentBenefit, earlyPaymentDiscount, totalEarnedIncentives, digitalPotential,
    })

    setCleanData(data.map(d => ({
      label:   d.label,
      clean:   d.totalBill - d.totalLeakage,
      penalty: d.totalLeakage,
    })))

    setSavingsTrendData(data.map(d => ({
      label:         d.label,
      totalSaved:    (d.digitalPaymentBenefit ?? 0) + (d.earlyPaymentDiscount ?? 0) + d.pfIncentive,
      pfIncentive:   d.pfIncentive,
      digitalBenefit: d.digitalPaymentBenefit ?? 0,
      earlyDiscount:  d.earlyPaymentDiscount ?? 0,
    })))

  }, [appState?.stateF, appState?.branchF, appState?.caF])

  // Clean vs penalty chart
  useEffect(() => {
    if (!cleanVsPenaltyRef.current || cleanData.length === 0) return
    const ctx = cleanVsPenaltyRef.current.getContext('2d')
    if (!ctx) return
    if (cleanVsPenaltyChart.current) cleanVsPenaltyChart.current.destroy()
    cleanVsPenaltyChart.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cleanData.map(d => d.label),
        datasets: [
          {
            label: 'Clean bill',
            data: cleanData.map(d => d.clean),
            backgroundColor: 'rgba(29,158,117,0.75)',
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
          {
            label: 'Penalties',
            data: cleanData.map(d => d.penalty),
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
              label: item => `  ${item.dataset.label}: ${inrK(item.raw as number)}`,
              footer: items => `Total: ${inrK(items.reduce((s, i) => s + (i.raw as number), 0))}`,
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
          y: { stacked: true, border: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' } },
        },
      },
    })
    return () => { if (cleanVsPenaltyChart.current) cleanVsPenaltyChart.current.destroy() }
  }, [cleanData])

  // Monthly savings trend — smooth area chart
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
            const chart = context.chart
            const { ctx: c, chartArea } = chart
            if (!chartArea) return 'rgba(29,158,117,0.08)'
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, 'rgba(29,158,117,0.18)')
            gradient.addColorStop(1, 'rgba(29,158,117,0.01)')
            return gradient
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
            titleFont: { size: 13, weight: 'bold' },
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
        <SummaryCard label="Total bill (period)"      value={inr(summary.totalBill)}      sub="all charges incl. penalties"                                                          subColor="#858ea2" borderColor="#2500D7" />
        <SummaryCard label="Avoidable charges"        value={inr(summary.avoidable)}      sub={`${summary.avoidablePct}% of total bill`}                                             subColor="#A32D2D" borderColor="#2500D7" />
        <SummaryCard label="Contract revision saving" value={inr(summary.contractSaving)} sub="net of higher fixed charge at revised level"                                          subColor="#3B6D11" borderColor="#2500D7" />
        <SummaryCard label="Total potential saving"   value={inr(summary.totalSaving)}    sub={`${Math.round(summary.totalSaving / Math.max(summary.totalBill,1)*100)}% recoverable`} subColor="#3B6D11" borderColor="#2500D7" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '12px', marginBottom: '12px' }}>

        {/* Clean vs penalty */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Realised savings vs avoidable losses</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Clean bill (green) vs penalty charges (red) · monthly</div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', fontSize: '12px', color: '#6b6b67' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'rgba(29,158,117,0.75)', display:'inline-block' }} />Clean bill
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:'#E24B4A', display:'inline-block' }} />Penalties
            </span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <canvas ref={cleanVsPenaltyRef}></canvas>
          </div>
        </div>

        {/* Monthly savings trend */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Monthly savings trend</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Total incentives earned per month · PF rebate + digital payment + early payment</div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', fontSize: '12px', color: '#6b6b67' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ width:'18px', height:'2px', background:'#1D9E75', display:'inline-block', borderRadius:'1px' }} />
              PF incentive + digital + early payment · monthly
            </span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <canvas ref={savingsTrendRef}></canvas>
          </div>
        </div>

      </div>

      {/* KPI insight cards */}
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Insights</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
        <KpiCard variant="good" label="Contract revision saving" value={inr(summary.contractSaving)}
          desc="Raise contracted demand to P90 MDI + 15% buffer · eliminates most excess charges" />
        <KpiCard variant="good" label="PF improvement saving" value={inr(summary.pfSaving)}
          desc="Eliminate PF penalties by maintaining power factor ≥ 0.90 via capacitor banks" />
        <KpiCard variant="info" label="Total recoverable" value={inr(summary.totalSaving)}
          desc={`${Math.round(summary.totalSaving / Math.max(summary.totalBill,1)*100)}% of total bill can be avoided with recommended actions`} />
        <KpiCard variant={summary.cleanPct >= 90 ? 'good' : 'warn'} label="Clean bill ratio" value={`${summary.cleanPct}%`}
          desc="Share of bill that is legitimate base charges — higher is better" />
      </div>

      {/* Incentives & Credits card */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Incentives & credits</div>
            <div style={{ fontSize: '12px', color: '#858ea2' }}>Earned vs potential · PF rebate + digital payment + early payment discount</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '2px' }}>Currently earning</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B6D11' }}>{inr(summary.totalEarnedIncentives)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#858ea2', marginBottom: '2px' }}>Total potential</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#185FA5' }}>{inr(summary.totalIncentivePotential)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: summary.digitalPaymentBenefit > 0 ? '#EAF3DE' : '#f9f9f9', border: `0.5px solid ${summary.digitalPaymentBenefit > 0 ? '#C0DD97' : 'rgba(0,0,0,0.08)'}`, borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>Digital payment benefit</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: summary.digitalPaymentBenefit > 0 ? '#3B6D11' : '#858ea2' }}>{inr(summary.digitalPaymentBenefit)}</div>
            <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '3px' }}>Earned · credited as adjustment in next bill by participating billers</div>
          </div>
          <div style={{ background: summary.earlyPaymentDiscount > 0 ? '#EAF3DE' : '#f9f9f9', border: `0.5px solid ${summary.earlyPaymentDiscount > 0 ? '#C0DD97' : 'rgba(0,0,0,0.08)'}`, borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>Early payment discount</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: summary.earlyPaymentDiscount > 0 ? '#3B6D11' : '#858ea2' }}>{inr(summary.earlyPaymentDiscount)}</div>
            <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '3px' }}>Earned · 1–1.5% for payment before due date</div>
          </div>
          <div style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>PF incentive potential</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#185FA5' }}>{inr(summary.potentialPfIncentive)}</div>
            <div style={{ fontSize: '11px', color: '#185FA5', marginTop: '3px' }}>If all CAs maintained PF ≥ 0.97 · 0.5% rebate on energy charges</div>
          </div>
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#633806', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>Digital payment potential</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#854F0B' }}>{inr(summary.digitalPotential)}</div>
            <div style={{ fontSize: '11px', color: '#633806', marginTop: '3px' }}>0.75% avg discount if all bills paid digitally · varies by biller</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#858ea2', marginBottom: '5px' }}>
            <span>Incentives captured</span>
            <span style={{ fontWeight: 500, color: '#192744' }}>
              {inr(summary.totalEarnedIncentives)} of {inr(summary.totalIncentivePotential)} potential · {inr(summary.totalIncentivePotential - summary.totalEarnedIncentives)} uncaptured
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px', background: '#1D9E75',
              width: `${Math.min(100, Math.round(summary.totalEarnedIncentives / Math.max(summary.totalIncentivePotential, 1) * 100))}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '4px' }}>
            {Math.round(summary.totalEarnedIncentives / Math.max(summary.totalIncentivePotential, 1) * 100)}% of total incentive potential being captured
          </div>
        </div>
      </div>

    </div>
  )
}
