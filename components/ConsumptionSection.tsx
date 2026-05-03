'use client'

import { useState, useRef, useEffect } from 'react'
import {
  STATES, CAS, getCABills, MONTHLY_LABELS, getFilteredBills,
  getConsumptionDistribution, getStateConsumptionSummary, getConsumptionVsBill,
  DISTRIBUTION_BUCKETS, inr as inrCalculations
} from '@/lib/calculations'
import { SummaryCard } from './SummaryCard'
import { KpiCard } from './KpiCard'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'

interface ConsumptionSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

// Consumption data (simulated from API)
const TOTAL_CAS = Object.values(CAS).flat().length // 187

// Summary metrics
const consumptionSummary = {
  total_kwh: 1240000,
  total_energy_charges: 9920000,
  avg_rate_per_unit: 8.00,
  load_factor_pct: 72,
}

// Helper function to format numbers
const inr = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value}`
}

const formatKwh = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

// Summary metrics cards
const summaryMetrics = [
  {
    label: 'Total consumption',
    value: `${formatKwh(consumptionSummary.total_kwh)} kWh`,
    sub: 'across period',
    subColor: '#185FA5',
  },
  {
    label: 'Total energy charges',
    value: inr(consumptionSummary.total_energy_charges),
    sub: '62% of total bill',
    subColor: '#185FA5',
  },
  {
    label: 'Effective rate',
    value: `₹${consumptionSummary.avg_rate_per_unit}/kWh`,
    sub: 'energy charges ÷ kWh',
    subColor: '#185FA5',
  },
  {
    label: 'Load factor',
    value: `${consumptionSummary.load_factor_pct}%`,
    sub: 'avg ÷ peak consumption',
    subColor: '#185FA5',
  },
]

// Trend data (dual-axis: kWh + energy charges)
const trendData = [
  { period: '2024-04', period_label: 'Apr 24', total_kwh: 98000, energy_charges: 784000, rate_per_unit: 8.00 },
  { period: '2024-05', period_label: 'May 24', total_kwh: 102000, energy_charges: 816000, rate_per_unit: 8.00 },
  { period: '2024-06', period_label: 'Jun 24', total_kwh: 108000, energy_charges: 864000, rate_per_unit: 8.00 },
  { period: '2024-07', period_label: 'Jul 24', total_kwh: 112000, energy_charges: 896000, rate_per_unit: 8.00 },
  { period: '2024-08', period_label: 'Aug 24', total_kwh: 118000, energy_charges: 944000, rate_per_unit: 8.00 },
  { period: '2024-09', period_label: 'Sep 24', total_kwh: 115000, energy_charges: 920000, rate_per_unit: 8.00 },
  { period: '2024-10', period_label: 'Oct 24', total_kwh: 110000, energy_charges: 880000, rate_per_unit: 8.00 },
  { period: '2024-11', period_label: 'Nov 24', total_kwh: 105000, energy_charges: 840000, rate_per_unit: 8.00 },
  { period: '2024-12', period_label: 'Dec 24', total_kwh: 98000, energy_charges: 784000, rate_per_unit: 8.00 },
]

// Bill component split — derived from getFilteredBills in component

// KPI calculations
const monthlyConsumptions = trendData.map(d => d.total_kwh)
const avgMonthlyKwh = monthlyConsumptions.length > 0 ? monthlyConsumptions.reduce((a, b) => a + b) / monthlyConsumptions.length : 0
const peakMonthlyKwh = monthlyConsumptions.length > 0 ? Math.max(...monthlyConsumptions) : 0
const minMonthlyKwh = monthlyConsumptions.length > 0 ? Math.min(...monthlyConsumptions) : 0
const consumptionVariance = avgMonthlyKwh > 0 ? Math.round(((peakMonthlyKwh - minMonthlyKwh) / avgMonthlyKwh) * 100) : 0

export default function ConsumptionSection({ appState }: ConsumptionSectionProps) {
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly'>('monthly')
  
  // Distribution chart state
  const [billComponentData, setBillComponentData] = useState<any[]>([])
  const [distribution, setDistribution] = useState<any[]>([])
  const [totalFaulty, setTotalFaulty] = useState(0)
  const [stateConsumption, setStateConsumption] = useState<any[]>([])
  const [consBillData, setConsBillData] = useState<any[]>([])
  const distChartRef = useRef<HTMLCanvasElement>(null)
  const distChartInstance = useRef<Chart | null>(null)
  const compChartRef = useRef<HTMLCanvasElement>(null)
  const compChartInstance = useRef<Chart | null>(null)

  // New chart refs
  const consumptionVsBillRef = useRef<HTMLCanvasElement>(null)
  const consumptionVsBillInstance = useRef<Chart | null>(null)
  const topStatesRef = useRef<HTMLCanvasElement>(null)
  const topStatesInstance = useRef<Chart | null>(null)

  // Compute data from functions
  useEffect(() => {
    const distData    = getConsumptionDistribution()
    const stateData   = getStateConsumptionSummary()
    const consBill    = getConsumptionVsBill(
      appState?.stateF ?? 'all',
      appState?.branchF ?? 'all',
      appState?.caF ?? 'all'
    )

    console.log('[v0] Consumption data loaded:', {
      distDataLen: distData.length,
      distDataSample: distData[0],
      stateDataLen: stateData.length,
      consBillLen: consBill.length,
      consBillSample: consBill[0],
    })

    // If getConsumptionVsBill returns empty, fallback to trendData
    const finalConsBill = consBill.length > 0 ? consBill : trendData.map(d => ({
      month: d.period_label,
      totalKwh: d.total_kwh,
      totalBill: d.energy_charges * 1.25, // Estimate total bill
      ratePerUnit: d.rate_per_unit,
    }))

    // Derive bill component data from getFilteredBills
    const filteredData = getFilteredBills('monthly', appState?.stateF ?? 'all', appState?.branchF ?? 'all', appState?.caF ?? 'all')
    const compData = filteredData.length > 0 ? filteredData.map(d => ({
      period_label: d.label,
      fixed_charges:   d.fixedCharge,
      energy_charges:  d.energyCharge,
      penalty_charges: d.totalLeakage,
      arrears:         Math.abs(d.arrears ?? 0),
      taxes:           Math.round(d.totalBill * 0.05),
      total_bill:      d.totalBill,
    })) : []
    setBillComponentData(compData)

    setDistribution(distData)
    setStateConsumption(stateData.length > 0 ? stateData : []) // Use empty fallback if no data
    setConsBillData(finalConsBill)

    // Compute total faulty meters (bucket 0 is faulty)
    const faulty = distData.reduce((sum: number, m: any) => sum + m.buckets[0], 0)
    setTotalFaulty(faulty)
  }, [appState.stateF, appState.branchF, appState.caF])

  // Render consumption vs bill chart
  useEffect(() => {
    if (!consumptionVsBillRef.current || consBillData.length === 0) return
    const ctx = consumptionVsBillRef.current.getContext('2d')
    if (!ctx) return
    if (consumptionVsBillInstance.current) consumptionVsBillInstance.current.destroy()

    consumptionVsBillInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: consBillData.map(d => d.month),
        datasets: [
          {
            label: 'Unit consumption (kWh)',
            data: consBillData.map(d => d.totalKwh),
            type: 'line',
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.08)',
            borderWidth: 2,
            pointBackgroundColor: '#1D9E75',
            pointRadius: 3,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Total bill amount (₹)',
            data: consBillData.map(d => d.totalBill),
            type: 'line',
            borderColor: '#2500D7',
            backgroundColor: 'rgba(37,0,215,0.05)',
            borderWidth: 2,
            pointBackgroundColor: '#2500D7',
            pointRadius: 3,
            tension: 0.35,
            fill: false,
            yAxisID: 'y2',
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { color: '#888', font: { size: 11 }, callback: (v: any) => (Number(v)/1000).toFixed(0) + 'K kWh' },
            title: { display: true, text: 'kWh consumed', color: '#858ea2', font: { size: 11 } },
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#888', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L' },
            title: { display: true, text: 'Total bill (₹)', color: '#858ea2', font: { size: 11 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#888', font: { size: 11 } },
          },
        }
      }
    })

    return () => { if (consumptionVsBillInstance.current) consumptionVsBillInstance.current.destroy() }
  }, [consBillData])

  // Render top states chart
  useEffect(() => {
    if (!topStatesRef.current || !stateConsumption || stateConsumption.length === 0) {
      console.log('[v0] Skipping top states chart - no data', { ref: !!topStatesRef.current, dataLen: stateConsumption?.length })
      return
    }
    const ctx = topStatesRef.current.getContext('2d')
    if (!ctx) return
    if (topStatesInstance.current) topStatesInstance.current.destroy()

    topStatesInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stateConsumption.map(s => s.state),
        datasets: [
          {
            label: 'Total consumption (kWh)',
            data: stateConsumption.map(s => s.totalKwh),
            backgroundColor: stateConsumption.map((_, i) =>
              i === 0 ? '#1755C8' : i <= 2 ? '#378ADD' : '#B5D4F4'
            ),
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { color: '#888', font: { size: 11 }, callback: (v: any) => (Number(v)/1000).toFixed(0) + 'K' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#192744', font: { size: 12, weight: 500 } },
          },
        }
      }
    })

    return () => { if (topStatesInstance.current) topStatesInstance.current.destroy() }
  }, [stateConsumption])
  useEffect(() => {
    if (!distribution || distribution.length === 0 || !distChartRef.current) return
    console.log('[v0] Rendering dist chart, distribution:', {
      len: distribution.length,
      sample: distribution[0],
      ref: distChartRef.current,
    })
    const ctx = distChartRef.current.getContext('2d')
    if (!ctx) {
      console.log('[v0] No 2d context')
      return
    }
    if (distChartInstance.current) distChartInstance.current.destroy()

    distChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: MONTHLY_LABELS,
        datasets: DISTRIBUTION_BUCKETS.map((bucket, bi) => ({
          label: bucket.rangeLabel,
          data: distribution.map(m => m.buckets[bi]),
          backgroundColor: bucket.color,
          borderRadius: bi === DISTRIBUTION_BUCKETS.length - 1
            ? { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }
            : 0,
          borderSkipped: false,
          barPercentage: 0.75,
          categoryPercentage: 0.85,
        }))
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
            bodyColor: 'rgba(255,255,255,0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: items => `${items[0].label}`,
              label: item => {
                const bucket = DISTRIBUTION_BUCKETS[item.datasetIndex]
                return `  ${bucket.rangeLabel}: ${item.raw} bills`
              },
              footer: items => {
                const total = items.reduce((s, i) => s + (i.raw as number), 0)
                return `Total: ${total} bills`
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#858ea2', font: { size: 11 }, padding: 6 },
          },
          y: {
            stacked: true,
            border: { display: false },
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: '#858ea2',
              font: { size: 11 },
              padding: 8,
              callback: (v) => Number(v) % 40 === 0 ? v : '',
            },
            title: {
              display: true,
              text: 'Number of bills',
              color: '#858ea2',
              font: { size: 11 },
            }
          }
        }
      }
    })

    return () => { if (distChartInstance.current) distChartInstance.current.destroy() }
  }, [distribution])

  // Render bill component breakdown chart
  useEffect(() => {
    if (!compChartRef.current) return
    const ctx = compChartRef.current.getContext('2d')
    if (!ctx) return
    if (compChartInstance.current) compChartInstance.current.destroy()

    const labels = billComponentData.map(d => d.period_label)


    compChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fixed charges',
            data: billComponentData.map(d => d.fixed_charges),
            backgroundColor: '#85B7EB',
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
          {
            label: 'Energy charges',
            data: billComponentData.map(d => d.energy_charges),
            backgroundColor: '#1D9E75',
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
          {
            label: 'Penalties',
            data: billComponentData.map(d => d.penalty_charges),
            backgroundColor: '#E24B4A',
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
          {
            label: 'Arrears',
            data: billComponentData.map(d => d.arrears),
            backgroundColor: '#EF9F27',
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
          {
            label: 'Taxes',
            data: billComponentData.map(d => d.taxes),
            backgroundColor: '#888780',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
        ]
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
              label: item => {
                const v = item.raw as number
                return `  ${item.dataset.label}: ${v >= 100000 ? '₹' + (v/100000).toFixed(1) + 'L' : '₹' + (v/1000).toFixed(0) + 'K'}`
              },
              footer: items => {
                const total = items.reduce((s, i) => s + (i.raw as number), 0)
                return `Total: ₹${(total/100000).toFixed(1)}L`
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#858ea2', font: { size: 11 }, padding: 6 },
          },
          y: {
            stacked: true,
            border: { display: false },
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: '#858ea2',
              font: { size: 11 },
              padding: 8,
              callback: (v: any) => '₹' + (Number(v)/100000).toFixed(1) + 'L',
            },
            title: {
              display: true,
              text: 'Bill amount (₹)',
              color: '#858ea2',
              font: { size: 11 },
            }
          }
        }
      }
    })

    return () => { if (compChartInstance.current) compChartInstance.current.destroy() }
  }, [billComponentData])

  return (
    <div style={{ background: '#f5f6fa', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Page header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#192744', letterSpacing: '-0.01em' }}>Consumption</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Energy consumption analysis · Apr 2024 – Mar 2025 · All states</div>
        </div>
        <div style={{ fontSize: '12px', color: '#858ea2' }}>Updated daily · May 2025</div>
      </div>

      {/* Section 1 — Summary metric cards */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', display: 'flex', overflow: 'hidden' }}>
        {summaryMetrics.map((m, i) => (
          <div key={m.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '1px', background: '#f0f1f5' }} />}
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#192744', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: m.subColor }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 2: Total consumption trend */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Total consumption trend</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Monthly kWh ('000) · All states · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9aa0b0' }}>
                <span style={{ width: '8px', height: '2px', background: '#1c5af4', display: 'inline-block' }} />
                FY 2024-25
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9aa0b0' }}>
                <span style={{ width: '8px', height: '2px', borderTop: '1px dashed #c8cbd6', display: 'inline-block' }} />
                FY 2023-24
              </span>
            </div>
            <div style={{ padding: '3px 10px', borderRadius: '4px', background: '#f0faf6', color: '#36b37e', fontSize: '11px', fontWeight: 600 }}>+5.6% YoY</div>
          </div>
        </div>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <canvas ref={consumptionVsBillRef}></canvas>
          </div>
        </div>
      </div>

      {/* Section 3: Two-column layout - Consumption by state + Bill composition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Consumption by state */}
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Consumption by state</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Annual kWh ('000) · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ padding: '14px 20px 16px' }}>
            <div style={{ position: 'relative', width: '100%', height: '280px' }}>
              <canvas ref={topStatesRef}></canvas>
            </div>
          </div>
        </div>

        {/* Bill composition */}
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Bill composition</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Aggregated · All states · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ padding: '14px 20px 16px', display: 'flex', gap: '16px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
              <canvas ref={compChartRef}></canvas>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
              {[
                { label: 'Energy charges', value: '₹24522L', pct: '58%', color: '#1c5af4' },
                { label: 'Demand charges', value: '₹7610L', pct: '18%', color: '#8b5cf6' },
                { label: 'Fixed charges', value: '₹5072L', pct: '12%', color: '#06b6d4' },
                { label: 'Taxes & duties', value: '₹3382L', pct: '8%', color: '#f59e0b' },
                { label: 'PF penalty', value: '₹1691L', pct: '4%', color: '#e53935' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#858ea2' }}>{item.label}</span>
                  <span style={{ color: '#192744', fontWeight: 600, minWidth: '45px' }}>{item.value}</span>
                  <span style={{ color: '#9aa0b0', minWidth: '28px', textAlign: 'right' }}>{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: State breakdown cards */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>State breakdown</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Apr 2024 – Mar 2025 · All states</div>
          </div>
          <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
            {['kWh', 'kVA', 'Green'].map(tab => (
              <button key={tab} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, background: tab === 'kWh' ? '#1c5af4' : 'transparent', color: tab === 'kWh' ? '#fff' : '#858ea2', transition: 'all .12s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {stateConsumption.slice(0, 8).map((s, i) => {
            const stateColors = ['#1755c8', '#378add', '#5a9fdb', '#85b7eb', '#1755c8', '#378add', '#5a9fdb', '#85b7eb'];
            const color = stateColors[i];
            return (
              <div key={s.state} style={{
                background: '#f5f6fa',
                border: '1px solid #f0f1f5',
                borderRadius: '8px',
                padding: '13px 14px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border-color .15s, background-color .15s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = color + '66';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = color + '08';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#f0f1f5';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f6fa';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744', flex: 1 }}>{s.state}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9aa0b0' }}>16%</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', letterSpacing: '-0.02em', lineHeight: 1 }}>21.8M</div>
                <div style={{ fontSize: '10px', color: '#9aa0b0' }}>kWh · ₹6,277L</div>
                <div style={{ height: '4px', background: '#f0f1f5', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: color, width: '55%', opacity: 0.8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#858ea2', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid #f0f1f5' }}>
                  <span>24 CAs · 8 br</span>
                  <span style={{ marginLeft: 'auto', color: '#36b37e', fontWeight: 600 }}>LF 74%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Bill reading distribution */}



      {/* Section 1: Total consumption trend */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Total consumption trend</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Monthly kWh ('000) · All states · Apr 2024 – Mar 2025</div>
        </div>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '12px', color: '#9aa0b0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1c5af4', display: 'inline-block' }} />
              FY 2024-25
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '2px', borderRadius: '1px', background: '#d0d5e0', display: 'inline-block' }} />
              FY 2023-24
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#36b37e', fontWeight: 500 }}>
              +5.6% YoY
            </span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <canvas ref={consumptionVsBillRef}></canvas>
          </div>
        </div>
      </div>

      {/* Section 2: Two-column layout - Consumption by state + Bill composition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Consumption by state */}
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Consumption by state</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Annual kWh ('000) · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ padding: '14px 20px 16px' }}>
            <div style={{ position: 'relative', width: '100%', height: '280px' }}>
              <canvas ref={topStatesRef}></canvas>
            </div>
          </div>
        </div>

        {/* Bill composition */}
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Bill composition</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Aggregated · All states · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ padding: '14px 20px 16px' }}>
            <div style={{ display:'flex', gap:'14px', marginBottom:'10px', flexWrap:'wrap', fontSize:'12px', color:'#9aa0b0' }}>
              {[
                { color:'#1c5af4', label:'Energy charges' },
                { color:'#6c7fc7', label:'Demand charges' },
                { color:'#a5b4e0', label:'Fixed charges' },
                { color:'#f59e0b', label:'Taxes & duties' },
                { color:'#e53935', label:'PF penalty' },
              ].map(item => (
                <span key={item.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:item.color, display:'inline-block' }} />
                  {item.label}
                </span>
              ))}
            </div>
            <div style={{ position:'relative', width:'100%', height:'240px' }}>
              <canvas ref={compChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: State breakdown cards */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>State breakdown</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Apr 2024 – Mar 2025 · All states</div>
        </div>
        {/* Tab toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
            {['kWh', 'KVA', 'Green'].map(tab => (
              <button key={tab} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '4px 12px', fontSize: '11px', background: tab === 'kWh' ? '#1c5af4' : 'transparent', color: tab === 'kWh' ? '#fff' : '#858ea2', fontWeight: tab === 'kWh' ? 600 : 400, transition: 'all .12s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        {/* State cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {stateConsumption.slice(0, 8).map((s, i) => (
            <div key={s.state} style={{
              background: '#f5f6fa',
              border: '1px solid #f0f1f5',
              borderRadius: '8px',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'border-color .15s, box-shadow .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ['#1755c8', '#378add', '#5a9fdb', '#85b7eb'][Math.min(i, 3)], flexShrink: 0 }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#192744' }}>{s.state}</div>
                <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#9aa0b0' }}>{Math.round(s.totalKwh / 1000000 * 100)}%</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', lineHeight: 1 }}>{(s.totalKwh / 1000000).toFixed(1)}M</div>
              <div style={{ fontSize: '11px', color: '#9aa0b0' }}>kWh · ₹{(s.avgRate * 100).toFixed(0)}L</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#858ea2', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f0f1f5' }}>
                <span>{s.totalKwh > 0 ? Math.round(s.totalKwh / 187 / 1000) : 0}K CAs · 8 hr</span>
                <span style={{ marginLeft: 'auto', color: '#36b37e', fontWeight: 600 }}>LF 74%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Bill reading distribution</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>
              Count of bills by unit consumption range · opening to closing reading · monthly
            </div>
          </div>

          {/* Faulty meter badge */}
          {totalFaulty > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: '12px', flexShrink: 0,
            }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#E24B4A', flexShrink:0 }} />
              <span style={{ fontWeight:600, color:'#A32D2D' }}>{totalFaulty}</span>
              <span style={{ color:'#791F1F' }}>possible faulty meters</span>
              <span style={{ color:'#858ea2', fontSize:'11px' }}>(opening = closing reading)</span>
            </div>
          )}
        </div>

        {/* Custom legend */}
        <div style={{ display:'flex', gap:'14px', marginBottom:'16px', flexWrap:'wrap', fontSize:'12px', color:'#9aa0b0' }}>
          {DISTRIBUTION_BUCKETS.map(r => (
            <span key={r.rangeLabel} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{
                width:'10px', height:'10px', borderRadius:'50%',
                background: r.color, flexShrink:0, display:'inline-block',
              }} />
              {r.rangeLabel}
            </span>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ position:'relative', width:'100%', height:'280px' }}>
          <canvas ref={distChartRef}></canvas>
        </div>

        {/* Faulty meter months breakdown */}
        {totalFaulty > 0 && (
          <div style={{ marginTop:'12px', padding:'10px 12px', background:'#fef2f2', borderRadius:'8px', border:'1px solid #fecaca' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#791F1F', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Possible faulty meter — bills with zero unit consumption
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {MONTHLY_LABELS.map((month, mi) => {
                const faultyCount = distribution[mi]?.buckets[0] ?? 0
                return faultyCount > 0 && (
                  <div key={month} style={{
                    display:'flex', alignItems:'center', gap:'4px',
                    padding:'3px 8px', borderRadius:'4px',
                    background:'#fef2f2', fontSize:'11px',
                  }}>
                    <span style={{ fontWeight:500, color:'#A32D2D' }}>{month}</span>
                    <span style={{ color:'#791F1F' }}>{faultyCount} bills</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
        <KpiCard
          variant="info"
          label="Avg monthly consumption"
          value={`${formatKwh(Math.round(avgMonthlyKwh))} kWh`}
          desc="Mean across all periods in view"
        />
        <KpiCard
          variant={consumptionSummary.load_factor_pct >= 70 ? 'good' : 'warn'}
          label="Load factor"
          value={`${consumptionSummary.load_factor_pct}%`}
          desc={consumptionSummary.load_factor_pct >= 70 ? 'Efficient utilisation' : 'Scope to flatten demand curve'}
        />
        <KpiCard
          variant={consumptionVariance <= 30 ? 'good' : 'warn'}
          label="Consumption variability"
          value={`${consumptionVariance}%`}
          desc={consumptionVariance <= 30 ? 'Stable consumption' : 'High seasonal swing'}
        />
        <KpiCard
          variant={consumptionSummary.avg_rate_per_unit <= 8 ? 'good' : 'warn'}
          label="Cost per unit"
          value={`₹${consumptionSummary.avg_rate_per_unit}/kWh`}
          desc="Blended effective tariff rate"
        />
      </div>
    </div>
  )
}
