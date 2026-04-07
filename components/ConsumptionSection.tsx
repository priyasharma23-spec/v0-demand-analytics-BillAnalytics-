'use client'

import { useState, useRef, useEffect } from 'react'
import { STATES, CAS, getCABills } from '@/lib/calculations'
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

// Bill component split
const billComponentData = [
  { period: '2024-04', period_label: 'Apr 24', fixed_charges: 202500, energy_charges: 784000, penalty_charges: 63000, arrears: 12000, taxes: 18000, total_bill: 1079500 },
  { period: '2024-05', period_label: 'May 24', fixed_charges: 202500, energy_charges: 816000, penalty_charges: 65000, arrears: 12000, taxes: 19000, total_bill: 1114500 },
  { period: '2024-06', period_label: 'Jun 24', fixed_charges: 202500, energy_charges: 864000, penalty_charges: 69000, arrears: 12000, taxes: 20000, total_bill: 1167500 },
  { period: '2024-07', period_label: 'Jul 24', fixed_charges: 202500, energy_charges: 896000, penalty_charges: 72000, arrears: 12000, taxes: 21000, total_bill: 1203500 },
  { period: '2024-08', period_label: 'Aug 24', fixed_charges: 202500, energy_charges: 944000, penalty_charges: 75000, arrears: 12000, taxes: 22000, total_bill: 1255500 },
  { period: '2024-09', period_label: 'Sep 24', fixed_charges: 202500, energy_charges: 920000, penalty_charges: 74000, arrears: 12000, taxes: 22000, total_bill: 1230500 },
  { period: '2024-10', period_label: 'Oct 24', fixed_charges: 202500, energy_charges: 880000, penalty_charges: 70000, arrears: 12000, taxes: 21000, total_bill: 1185500 },
  { period: '2024-11', period_label: 'Nov 24', fixed_charges: 202500, energy_charges: 840000, penalty_charges: 67000, arrears: 12000, taxes: 20000, total_bill: 1141500 },
  { period: '2024-12', period_label: 'Dec 24', fixed_charges: 202500, energy_charges: 784000, penalty_charges: 63000, arrears: 12000, taxes: 18000, total_bill: 1079500 },
]

// KPI calculations
const monthlyConsumptions = trendData.map(d => d.total_kwh)
const avgMonthlyKwh = monthlyConsumptions.reduce((a, b) => a + b) / monthlyConsumptions.length
const peakMonthlyKwh = Math.max(...monthlyConsumptions)
const minMonthlyKwh = Math.min(...monthlyConsumptions)
const consumptionVariance = Math.round(((peakMonthlyKwh - minMonthlyKwh) / avgMonthlyKwh) * 100)

export default function ConsumptionSection({ appState }: ConsumptionSectionProps) {
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly'>('monthly')
  
  // Histogram state
  const [histogramData, setHistogramData] = useState<{
    bucketLabels: string[]
    bucketCounts: number[]
    peakLabel: string
    peakCount: number
    median: number
    totalReadings: number
  } | null>(null)
  const histogramRef = useRef<HTMLCanvasElement>(null)
  const histogramInstance = useRef<Chart | null>(null)

  // Compute histogram data from bill records
  useEffect(() => {
    const allCAReadings: number[] = []

    Object.values(CAS).flat().forEach(ca => {
      const bills = getCABills(ca, 'monthly')
      bills.forEach(bill => {
        if (bill && bill.kwh > 0) {
          const rounded = Math.round(bill.kwh / 100) * 100
          allCAReadings.push(rounded)
        }
      })
    })

    if (allCAReadings.length === 0) return

    const maxReading = Math.max(...allCAReadings)
    const bucketSize = 100
    const maxBucket = Math.ceil(maxReading / 1000) * 1000
    const bucketCount = maxBucket / bucketSize

    const bucketLabels: string[] = []
    const bucketCounts: number[] = []

    for (let i = 0; i < bucketCount; i++) {
      const low = i * bucketSize
      const high = low + bucketSize
      bucketLabels.push(low === 0 ? '0' : `${low / 1000 % 1 === 0 ? low / 1000 + 'K' : low}`)
      bucketCounts.push(allCAReadings.filter(v => v >= low && v < high).length)
    }

    const peakIdx = bucketCounts.indexOf(Math.max(...bucketCounts))
    const peakLabel = bucketLabels[peakIdx]
    const peakCount = bucketCounts[peakIdx]

    const sorted = [...allCAReadings].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    setHistogramData({ bucketLabels, bucketCounts, peakLabel, peakCount, median, totalReadings: allCAReadings.length })
  }, [])

  // Render histogram chart
  useEffect(() => {
    if (!histogramData || !histogramRef.current) return
    const ctx = histogramRef.current.getContext('2d')
    if (!ctx) return
    if (histogramInstance.current) histogramInstance.current.destroy()

    const { bucketLabels, bucketCounts, peakCount } = histogramData

    histogramInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bucketLabels,
        datasets: [{
          data: bucketCounts,
          backgroundColor: bucketCounts.map(c =>
            c >= peakCount * 0.90 ? '#1755C8' :
            c >= peakCount * 0.40 ? '#378ADD' : '#B5D4F4'
          ),
          borderRadius: 3,
          borderSkipped: false,
          barPercentage: 0.95,
          categoryPercentage: 1.0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex
                const low = idx * 100
                const high = low + 100
                return `${low.toLocaleString()} – ${high.toLocaleString()} kWh`
              },
              label: (item) => ` ${item.raw} bills in this range`,
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#888',
              font: { size: 10 },
              callback: (_val: any, i: number) => i % 10 === 0 ? bucketLabels[i] : '',
              maxRotation: 0,
              autoSkip: false,
            },
            title: {
              display: true,
              text: 'Unit consumption (kWh)',
              color: '#858ea2',
              font: { size: 11 },
            }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              stepSize: 1,
              callback: (v: any) => Number.isInteger(v) ? v : '',
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

    return () => { if (histogramInstance.current) histogramInstance.current.destroy() }
  }, [histogramData])

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

      {/* Section 2 — Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Chart 1: kWh + Energy charges trend */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>kWh consumed & energy charges</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Monthly trend</div>
          </div>
          <div style={{ height: '200px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#858ea2', fontSize: '12px' }}>
            [Dual-axis chart: kWh bars + energy charges line]
          </div>
        </div>

        {/* Chart 2: Cost per unit trend */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Effective rate per kWh</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Blended tariff trend</div>
          </div>
          <div style={{ height: '200px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#858ea2', fontSize: '12px' }}>
            [Line chart: ₹/kWh per period]
          </div>
        </div>
      </div>

      {/* Section 3 — Bill component split */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Bill component breakdown</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Fixed / energy / penalties / taxes per period</div>
        </div>
        <div style={{ height: '220px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#858ea2', fontSize: '12px' }}>
          [Stacked bar chart: Fixed / Energy / Penalties / Arrears / Taxes]
        </div>
      </div>

      {/* Section 4 — Meter reading distribution histogram */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Meter reading distribution</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Number of bills by unit consumption range · 100 kWh buckets · opening to closing reading</div>
          </div>

          {/* Summary pills */}
          {histogramData && (
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#E6F1FB', fontSize: '11px', fontWeight: 500, color: '#0C447C' }}>
                Peak: {histogramData.peakLabel} kWh · {histogramData.peakCount} bills
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#EAF3DE', fontSize: '11px', fontWeight: 500, color: '#27500A' }}>
                Median: {Math.round(histogramData.median / 100) * 100} kWh
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#f5f5f4', fontSize: '11px', fontWeight: 500, color: '#6b6b67' }}>
                {histogramData.totalReadings} total readings
              </div>
            </div>
          )}
        </div>

        {/* Colour legend */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', marginTop: '10px', fontSize: '11px', color: '#6b6b67', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1755C8', display: 'inline-block' }} />
            High frequency (top 10%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#378ADD', display: 'inline-block' }} />
            Mid frequency
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#B5D4F4', display: 'inline-block' }} />
            Low frequency
          </span>
        </div>

        {/* Chart canvas */}
        <div style={{ position: 'relative', width: '100%', height: '280px' }}>
          <canvas ref={histogramRef}></canvas>
        </div>

        {/* X axis note */}
        <div style={{ fontSize: '11px', color: '#9b9b96', marginTop: '8px', textAlign: 'center' }}>
          Each bar = 100 kWh range · values rounded to nearest 100 · based on Unit Consumption field (kWh)
        </div>
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
