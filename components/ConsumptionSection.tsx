'use client'

import { useState, useRef, useEffect } from 'react'
import {
  STATES, CAS, getCABills, MONTHLY_LABELS,
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

const CONSUMPTION_RANGES = [
  { label: '0 (Faulty/Same)',  min: 0,    max: 0,    color: '#F09595', textColor: '#791F1F' },
  { label: '1–1,000 kWh',     min: 1,    max: 1000,  color: '#B5D4F4', textColor: '#0C447C' },
  { label: '1K–5K kWh',       min: 1000, max: 5000,  color: '#EF9F27', textColor: '#633806' },
  { label: '5K–20K kWh',      min: 5000, max: 20000, color: '#1D9E75', textColor: '#085041' },
  { label: '20K–50K kWh',     min: 20000,max: 50000, color: '#378ADD', textColor: '#0C447C' },
  { label: '50K+ kWh',        min: 50000,max: Infinity, color: '#E24B4A', textColor: '#791F1F' },
]

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
const avgMonthlyKwh = monthlyConsumptions.length > 0 ? monthlyConsumptions.reduce((a, b) => a + b) / monthlyConsumptions.length : 0
const peakMonthlyKwh = monthlyConsumptions.length > 0 ? Math.max(...monthlyConsumptions) : 0
const minMonthlyKwh = monthlyConsumptions.length > 0 ? Math.min(...monthlyConsumptions) : 0
const consumptionVariance = avgMonthlyKwh > 0 ? Math.round(((peakMonthlyKwh - minMonthlyKwh) / avgMonthlyKwh) * 100) : 0

export default function ConsumptionSection({ appState }: ConsumptionSectionProps) {
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly'>('monthly')
  
  // Distribution chart state
  const [distribution, setDistribution] = useState<any[]>([])
  const [stateConsumption, setStateConsumption] = useState<any[]>([])
  const [consBillData, setConsBillData] = useState<any[]>([])
  const distChartRef = useRef<HTMLCanvasElement>(null)
  const distChartInstance = useRef<Chart | null>(null)

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

    setDistribution(distData)
    setStateConsumption(stateData)
    setConsBillData(consBill)
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
            ticks: { color: '#888', font: { size: 11 }, callback: v => (v/1000).toFixed(0) + 'K kWh' },
            title: { display: true, text: 'kWh consumed', color: '#858ea2', font: { size: 11 } },
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#888', font: { size: 11 }, callback: v => '₹' + (v/100000).toFixed(1) + 'L' },
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
    if (!topStatesRef.current || stateConsumption.length === 0) return
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
            ticks: { color: '#888', font: { size: 11 }, callback: v => (v/1000).toFixed(0) + 'K' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#192744', font: { size: 12, weight: '500' } },
          },
        }
      }
    })

    return () => { if (topStatesInstance.current) topStatesInstance.current.destroy() }
  }, [stateConsumption])
  useEffect(() => {
    if (!distribution || distribution.length === 0 || !distChartRef.current) return
    const ctx = distChartRef.current.getContext('2d')
    if (!ctx) return
    if (distChartInstance.current) distChartInstance.current.destroy()

    distChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: MONTHLY_LABELS,
        datasets: DISTRIBUTION_BUCKETS.map((bucket, bi) => ({
          label:           bucket.rangeLabel,
          data:            distribution.map(m => m.buckets[bi]),
          backgroundColor: bucket.color,
          borderRadius:    bi === DISTRIBUTION_BUCKETS.length - 1 ? 4 : 0,
          borderSkipped:   false,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => `${items[0].label} — ${DISTRIBUTION_BUCKETS[items[0].datasetIndex].rangeLabel}`,
              label: item => ` ${item.raw} bills`,
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#888', font: { size: 11 } },
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(0,0,0,0.06)', borderDash: [4, 4] },
            ticks: {
              color: '#888',
              font: { size: 11 },
              stepSize: 10,
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

      {/* New Chart 1: Unit consumption vs bill amount */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Unit consumption vs bill amount</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>kWh consumed (left axis) vs total bill ₹ (right axis) · monthly</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '12px', color: '#6b6b67' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1D9E75', display: 'inline-block' }} />
            Unit consumption (kWh)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#2500D7', display: 'inline-block' }} />
            Total bill amount (₹)
          </span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '240px' }}>
          <canvas ref={consumptionVsBillRef}></canvas>
        </div>
      </div>

      {/* New Chart 2: Top consuming states */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Top consuming states</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Total kWh consumed per state · ranked highest to lowest · current period</div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '280px' }}>
          <canvas ref={topStatesRef}></canvas>
        </div>
        {/* Summary table */}
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '6px' }}>
          {stateConsumption.map((s, i) => (
            <div key={s.state} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', borderRadius: '6px',
              background: i === 0 ? '#E6F1FB' : '#f9f9f9',
              border: i === 0 ? '0.5px solid #B5D4F4' : '0.5px solid rgba(0,0,0,0.07)',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', width: '14px', flexShrink: 0 }}>{i+1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#192744', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.state}</div>
                <div style={{ fontSize: '11px', color: '#858ea2' }}>{(s.totalKwh/1000).toFixed(0)}K kWh</div>
              </div>
              <div style={{ fontSize: '11px', color: '#3B6D11', fontWeight: 500, flexShrink: 0 }}>₹{s.avgRate}/u</div>
            </div>
          ))}
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

      {/* Section 4 — Bill reading distribution */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px', marginBottom: '12px' }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Bill reading distribution</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>
              Count of bills by unit consumption range · opening to closing reading · monthly
            </div>
          </div>

          {/* Faulty meter badge */}
          {distData && distData.totalFaulty > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: '#FCEBEB', border: '0.5px solid #F7C1C1',
              fontSize: '12px', flexShrink: 0,
            }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#E24B4A', flexShrink:0 }} />
              <span style={{ fontWeight:600, color:'#A32D2D' }}>{distData.totalFaulty}</span>
              <span style={{ color:'#791F1F' }}>possible faulty meters</span>
              <span style={{ color:'#858ea2', fontSize:'11px' }}>(opening = closing reading)</span>
            </div>
          )}
        </div>

        {/* Custom legend */}
        <div style={{ display:'flex', gap:'14px', marginBottom:'16px', flexWrap:'wrap', fontSize:'12px', color:'#6b6b67' }}>
          {CONSUMPTION_RANGES.map(r => (
            <span key={r.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{
                width:'10px', height:'10px', borderRadius:'50%',
                background: r.color, flexShrink:0, display:'inline-block',
              }} />
              {r.label}
            </span>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ position:'relative', width:'100%', height:'280px' }}>
          <canvas ref={distChartRef}></canvas>
        </div>

        {/* Faulty meter months breakdown */}
        {distData && distData.totalFaulty > 0 && (
          <div style={{ marginTop:'12px', padding:'10px 12px', background:'#FFF8F8', borderRadius:'8px', border:'0.5px solid #F7C1C1' }}>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#791F1F', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Possible faulty meter — bills with zero unit consumption
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {MONTHLY_LABELS.map((month, mi) => (
                distData.faultyPerMonth[mi] > 0 && (
                  <div key={month} style={{
                    display:'flex', alignItems:'center', gap:'4px',
                    padding:'3px 8px', borderRadius:'4px',
                    background:'#FCEBEB', fontSize:'11px',
                  }}>
                    <span style={{ fontWeight:500, color:'#A32D2D' }}>{month}</span>
                    <span style={{ color:'#791F1F' }}>{distData.faultyPerMonth[mi]} bills</span>
                  </div>
                )
              ))}
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
