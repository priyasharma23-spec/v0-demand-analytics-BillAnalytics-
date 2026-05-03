'use client'

import { useState, useRef, useEffect } from 'react'
import { Chart } from 'chart.js'
import '@/lib/chartSetup'

interface ConsumptionSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

// Summary metrics (keeping intact as requested)
const summaryMetrics = [
  {
    label: 'Total consumption',
    value: '1.24M kWh',
    sub: 'across period',
    subColor: '#185FA5',
  },
  {
    label: 'Total energy charges',
    value: '₹99.2L',
    sub: '62% of total bill',
    subColor: '#185FA5',
  },
  {
    label: 'Effective rate',
    value: '₹8/kWh',
    sub: 'energy charges ÷ kWh',
    subColor: '#185FA5',
  },
  {
    label: 'Load factor',
    value: '72%',
    sub: 'avg ÷ peak consumption',
    subColor: '#185FA5',
  },
]

// Dummy data for consumption trend
const trendChartData = [
  { month: 'Apr', fy2425: 8000, fy2324: 7600 },
  { month: 'May', fy2425: 8500, fy2324: 7900 },
  { month: 'Jun', fy2425: 9000, fy2324: 8200 },
  { month: 'Jul', fy2425: 9500, fy2324: 8600 },
  { month: 'Aug', fy2425: 10000, fy2324: 8900 },
  { month: 'Sep', fy2425: 10100, fy2324: 8950 },
  { month: 'Oct', fy2425: 9800, fy2324: 8700 },
  { month: 'Nov', fy2425: 9200, fy2324: 8400 },
  { month: 'Dec', fy2425: 8800, fy2324: 8100 },
  { month: 'Jan', fy2425: 8900, fy2324: 8300 },
  { month: 'Feb', fy2425: 9100, fy2324: 8500 },
  { month: 'Mar', fy2425: 8600, fy2324: 8200 },
]

// Dummy data for consumption by state
const stateData = [
  { state: 'Maharashtra', kwh: 21800000, percentage: 16, color: '#1755C8' },
  { state: 'Delhi', kwh: 18900000, percentage: 14, color: '#8B7BC8' },
  { state: 'Tamil Nadu', kwh: 17600000, percentage: 13, color: '#5DADE2' },
  { state: 'Karnataka', kwh: 17000000, percentage: 13, color: '#8B7BC8' },
  { state: 'Gujarat', kwh: 16200000, percentage: 12, color: '#F5B041' },
  { state: 'Uttar Pradesh', kwh: 15400000, percentage: 11, color: '#52BE80' },
  { state: 'West Bengal', kwh: 14600000, percentage: 11, color: '#E74C3C' },
  { state: 'Rajasthan', kwh: 13900000, percentage: 10, color: '#E8B04B' },
]

// Dummy data for state breakdown cards
const stateBreakdownData = [
  { state: 'Maharashtra', percentage: 16, kwh: '21.8M', cost: '₹6,277L', cas: 24, br: 8, lf: 74, color: '#1755C8' },
  { state: 'Delhi', percentage: 14, kwh: '18.9M', cost: '₹5,798L', cas: 21, br: 8, lf: 72, color: '#8B7BC8' },
  { state: 'Tamil Nadu', percentage: 13, kwh: '17.6M', cost: '₹5,562L', cas: 21, br: 8, lf: 71, color: '#5DADE2' },
  { state: 'Karnataka', percentage: 13, kwh: '17.0M', cost: '₹5,412L', cas: 21, br: 8, lf: 69, color: '#8B7BC8' },
  { state: 'Gujarat', percentage: 12, kwh: '16.2M', cost: '₹5,173L', cas: 20, br: 8, lf: 73, color: '#F5B041' },
  { state: 'Uttar Pradesh', percentage: 11, kwh: '15.4M', cost: '₹4,895L', cas: 20, br: 8, lf: 68, color: '#52BE80' },
  { state: 'West Bengal', percentage: 11, kwh: '14.6M', cost: '₹4,662L', cas: 17, br: 7, lf: 67, color: '#E74C3C' },
  { state: 'Rajasthan', percentage: 10, kwh: '13.9M', cost: '₹4,500L', cas: 16, br: 7, lf: 66, color: '#E8B04B' },
]

// Bill composition data
const billCompositionData = [
  { label: 'Energy charges', value: '₹24522L', percentage: 58, color: '#1C5AF4' },
  { label: 'Demand charges', value: '₹7610L', percentage: 18, color: '#8B5CF6' },
  { label: 'Fixed charges', value: '₹5073L', percentage: 12, color: '#06B6D4' },
  { label: 'Taxes & duties', value: '₹3382L', percentage: 8, color: '#F59E0B' },
  { label: 'PF penalty', value: '₹1691L', percentage: 4, color: '#E53935' },
]

// KPI data
const kpiData = [
  { label: 'Avg monthly consumption', value: '107K kWh', description: 'Based on available data' },
  { label: 'Load factor', value: '72%', description: 'Efficiency indicator' },
  { label: 'Consumption variability', value: '19%', description: 'Month-to-month variance' },
  { label: 'Cost per kWh', value: '₹8/kWh', description: 'Average effective rate' },
]

export default function ConsumptionSection({ appState }: ConsumptionSectionProps) {
  const consumptionChartRef = useRef<HTMLCanvasElement>(null)
  const consumptionChartInstance = useRef<Chart | null>(null)
  const stateChartRef = useRef<HTMLCanvasElement>(null)
  const stateChartInstance = useRef<Chart | null>(null)
  const billChartRef = useRef<HTMLCanvasElement>(null)
  const billChartInstance = useRef<Chart | null>(null)

  // Render consumption trend chart
  useEffect(() => {
    if (!consumptionChartRef.current) return
    const ctx = consumptionChartRef.current.getContext('2d')
    if (!ctx) return
    if (consumptionChartInstance.current) consumptionChartInstance.current.destroy()

    consumptionChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendChartData.map(d => d.month),
        datasets: [
          {
            label: 'FY 2024-25',
            data: trendChartData.map(d => d.fy2425),
            borderColor: '#1C5AF4',
            backgroundColor: 'rgba(28, 90, 244, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#1C5AF4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'FY 2023-24',
            data: trendChartData.map(d => d.fy2324),
            borderColor: '#D0D5E0',
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#D0D5E0',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: { size: 12, weight: 600 },
            bodyFont: { size: 11 },
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#9AA0B0', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#9AA0B0', font: { size: 11 }, callback: (v: any) => `${Number(v)/1000}K` }
          }
        }
      }
    })

    return () => {
      if (consumptionChartInstance.current) consumptionChartInstance.current.destroy()
    }
  }, [])

  // Render consumption by state chart
  useEffect(() => {
    if (!stateChartRef.current) return
    const ctx = stateChartRef.current.getContext('2d')
    if (!ctx) return
    if (stateChartInstance.current) stateChartInstance.current.destroy()

    stateChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stateData.map(d => d.state),
        datasets: [{
          label: 'Annual kWh',
          data: stateData.map(d => d.kwh),
          backgroundColor: stateData.map(d => d.color),
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#9AA0B0', font: { size: 10 }, callback: (v) => `${Number(v)/1000000}M` }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#192744', font: { size: 12, weight: 500 } }
          }
        }
      }
    })

    return () => {
      if (stateChartInstance.current) stateChartInstance.current.destroy()
    }
  }, [])

  // Render bill composition chart
  useEffect(() => {
    if (!billChartRef.current) return
    const ctx = billChartRef.current.getContext('2d')
    if (!ctx) return
    if (billChartInstance.current) billChartInstance.current.destroy()

    billChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: billCompositionData.map(d => d.label),
        datasets: [{
          data: billCompositionData.map(d => d.percentage),
          backgroundColor: billCompositionData.map(d => d.color),
          borderColor: '#fff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${billCompositionData[context.dataIndex].percentage}%`
            }
          }
        }
      }
    })

    return () => {
      if (billChartInstance.current) billChartInstance.current.destroy()
    }
  }, [])

  return (
    <div style={{ background: '#F5F6FA', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary cards */}
      <div style={{ background: '#fff', border: '1px solid #F0F1F5', borderRadius: '6px', display: 'flex', overflow: 'hidden' }}>
        {summaryMetrics.map((m, i) => (
          <div key={m.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '1px', background: '#F0F1F5' }} />}
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9AA0B0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#192744', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: m.subColor }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Total consumption trend */}
      <div style={{ background: '#fff', border: '1px solid #F0F1F5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Total consumption trend</div>
            <div style={{ fontSize: '12px', color: '#9AA0B0', marginTop: '4px' }}>Monthly kWh ('000) · All states · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9AA0B0' }}>
                <span style={{ width: '8px', height: '2px', background: '#1C5AF4' }} />
                FY 2024-25
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9AA0B0' }}>
                <span style={{ width: '8px', height: '2px', borderTop: '2px dashed #D0D5E0' }} />
                FY 2023-24
              </span>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '4px', background: '#F0FAF6', color: '#36B37E', fontSize: '11px', fontWeight: 600 }}>+5.6% YoY</div>
          </div>
        </div>
        <div style={{ position: 'relative', height: '240px' }}>
          <canvas ref={consumptionChartRef}></canvas>
        </div>
      </div>

      {/* Consumption by state + Bill composition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Consumption by state */}
        <div style={{ background: '#fff', border: '1px solid #F0F1F5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Consumption by state</div>
            <div style={{ fontSize: '12px', color: '#9AA0B0', marginTop: '4px' }}>Annual kWh ('000) · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ position: 'relative', height: '280px' }}>
            <canvas ref={stateChartRef}></canvas>
          </div>
        </div>

        {/* Bill composition */}
        <div style={{ background: '#fff', border: '1px solid #F0F1F5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Bill composition</div>
            <div style={{ fontSize: '12px', color: '#9AA0B0', marginTop: '4px' }}>Aggregated · All states · Apr 2024 – Mar 2025</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
              <canvas ref={billChartRef}></canvas>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#9AA0B0' }}>total bill</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#192744' }}>₹42,279L</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {billCompositionData.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                  <span style={{ flex: 1, color: '#192744' }}>{item.label}</span>
                  <span style={{ color: '#192744', fontWeight: 600, minWidth: '55px' }}>{item.value}</span>
                  <span style={{ color: '#9AA0B0', minWidth: '30px', textAlign: 'right' }}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* State breakdown */}
      <div style={{ background: '#fff', border: '1px solid #F0F1F5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>State breakdown</div>
            <div style={{ fontSize: '12px', color: '#9AA0B0', marginTop: '4px' }}>Apr 2024 – Mar 2025 · All states</div>
          </div>
          <div style={{ display: 'flex', background: '#F5F6FA', border: '1px solid #F0F1F5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
            {['kWh', 'kVA', 'Green'].map(tab => (
              <button key={tab} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, background: tab === 'kWh' ? '#1C5AF4' : 'transparent', color: tab === 'kWh' ? '#fff' : '#858EA2', transition: 'all 0.12s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {stateBreakdownData.map((state, i) => (
            <div key={state.state} style={{ background: '#F5F6FA', border: '1px solid #F0F1F5', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: state.color }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#192744', flex: 1 }}>{state.state}</span>
                <span style={{ fontSize: '11px', color: '#9AA0B0' }}>{state.percentage}%</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#192744', lineHeight: 1 }}>{state.kwh}</div>
              <div style={{ fontSize: '11px', color: '#9AA0B0' }}>kWh · {state.cost}</div>
              <div style={{ height: '4px', background: '#E0E0E0', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ height: '100%', background: state.color, width: `${state.percentage * 6}%` }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#858EA2', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #F0F1F5' }}>
                <span>{state.cas} CAs · {state.br} br</span>
                <span style={{ marginLeft: 'auto', color: '#36B37E', fontWeight: 600 }}>LF {state.lf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {kpiData.map(kpi => (
          <div key={kpi.label} style={{ background: '#F5F6FA', border: '1px solid #F0F1F5', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9AA0B0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#192744', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: '#858EA2' }}>{kpi.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
