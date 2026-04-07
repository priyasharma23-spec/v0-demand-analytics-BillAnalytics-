'use client'

import React, { useEffect, useRef, useState } from 'react'
import '@/lib/chartSetup'
import { Chart } from 'chart.js'
import { SummaryCard } from './SummaryCard'
import { KpiCard } from './KpiCard'

interface SavingsSectionProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

export default function SavingsSection({ appState }: SavingsSectionProps) {
  const cleanVsPenaltyChartRef = useRef<HTMLCanvasElement>(null)
  const revisionProjectionChartRef = useRef<HTMLCanvasElement>(null)
  const [charts, setCharts] = useState<Chart[]>([])

  // Simulated data from API endpoints
  const summaryData = {
    total_bill: 2000000,
    avoidable_charges: 380000,
    clean_bill_amount: 1620000,
    clean_bill_ratio_pct: 81,
    avoidable_pct: 19.0,
  }

  const cleanVsPenaltyData = [
    { period_label: 'Jan 24', clean_bill: 1450000, penalties: 285000 },
    { period_label: 'Feb 24', clean_bill: 1480000, penalties: 265000 },
    { period_label: 'Mar 24', clean_bill: 1520000, penalties: 310000 },
    { period_label: 'Apr 24', clean_bill: 1650000, penalties: 180000 },
    { period_label: 'May 24', clean_bill: 1700000, penalties: 140000 },
    { period_label: 'Jun 24', clean_bill: 1580000, penalties: 290000 },
    { period_label: 'Jul 24', clean_bill: 1450000, penalties: 325000 },
    { period_label: 'Aug 24', clean_bill: 1380000, penalties: 380000 },
  ]

  const revisionProjectionData = [
    { period_label: 'Jan 24', current_excess: 8640, projected_excess: 1200 },
    { period_label: 'Feb 24', current_excess: 7200, projected_excess: 800 },
    { period_label: 'Mar 24', current_excess: 10800, projected_excess: 2400 },
    { period_label: 'Apr 24', current_excess: 5400, projected_excess: 0 },
    { period_label: 'May 24', current_excess: 3600, projected_excess: 0 },
    { period_label: 'Jun 24', current_excess: 9720, projected_excess: 1800 },
    { period_label: 'Jul 24', current_excess: 11340, projected_excess: 3000 },
    { period_label: 'Aug 24', current_excess: 14400, projected_excess: 4200 },
  ]

  const insightsData = {
    contract_revision_saving: 210000,
    pf_saving: 90000,
    total_potential_saving: 300000,
    clean_bill_ratio_pct: 81,
  }

  // Calculate contract revision saving from summary
  const contractRevisionSaving = insightsData.contract_revision_saving
  const totalPotentialSaving = insightsData.total_potential_saving

  const summaryMetrics = [
    {
      label: 'Total bill (period)',
      value: `₹${(summaryData.total_bill / 100000).toFixed(1)}L`,
      sub: 'all charges incl. penalties',
      subColor: '#185FA5',
    },
    {
      label: 'Avoidable charges',
      value: `₹${(summaryData.avoidable_charges / 100000).toFixed(1)}L`,
      sub: `${summaryData.avoidable_pct}% of total bill`,
      subColor: '#185FA5',
    },
    {
      label: 'Contract revision saving',
      value: `₹${(contractRevisionSaving / 100000).toFixed(1)}L`,
      sub: 'net of higher fixed charge',
      subColor: '#185FA5',
    },
    {
      label: 'Total potential saving',
      value: `₹${(totalPotentialSaving / 100000).toFixed(1)}L`,
      sub: `${Math.round((totalPotentialSaving / summaryData.total_bill) * 100)}% of bill recoverable`,
      subColor: '#185FA5',
    },
  ]

  // Initialize charts
  useEffect(() => {
    const newCharts: Chart[] = []

    // Clean vs Penalty Chart
    if (cleanVsPenaltyChartRef.current) {
      const ctx = cleanVsPenaltyChartRef.current.getContext('2d')
      if (ctx) {
        const cleanVsPenaltyChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: cleanVsPenaltyData.map((d) => d.period_label),
            datasets: [
              {
                label: 'Clean bill',
                data: cleanVsPenaltyData.map((d) => d.clean_bill / 100000),
                backgroundColor: 'rgba(29,158,117,0.6)',
                borderColor: 'rgba(29,158,117,1)',
                borderWidth: 0,
              },
              {
                label: 'Penalties',
                data: cleanVsPenaltyData.map((d) => d.penalties / 100000),
                backgroundColor: '#E24B4A',
                borderColor: '#E24B4A',
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            scales: {
              x: {
                stacked: true,
                ticks: { font: { size: 11 }, color: '#858ea2' },
                grid: { drawBorder: false, color: 'rgba(0,0,0,0.05)' },
              },
              y: {
                stacked: true,
                ticks: { font: { size: 11 }, color: '#858ea2' },
                grid: { drawBorder: false, color: 'rgba(0,0,0,0.05)' },
              },
            },
            plugins: {
              legend: {
                labels: { font: { size: 12 }, usePointStyle: true, color: '#192744' },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = (context.parsed.y as number).toFixed(1)
                    return `${context.dataset.label}: ₹${value}L`
                  },
                },
              },
            },
          },
        })
        newCharts.push(cleanVsPenaltyChart)
      }
    }

    // Contract Revision Projection Chart
    if (revisionProjectionChartRef.current) {
      const ctx = revisionProjectionChartRef.current.getContext('2d')
      if (ctx) {
        const revisionChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: revisionProjectionData.map((d) => d.period_label),
            datasets: [
              {
                label: 'Current excess charges',
                data: revisionProjectionData.map((d) => d.current_excess / 1000),
                backgroundColor: 'rgba(226,75,74,0.5)',
                borderColor: 'rgba(226,75,74,1)',
                borderWidth: 0,
              },
              {
                label: 'Projected post-revision',
                data: revisionProjectionData.map((d) => d.projected_excess / 1000),
                backgroundColor: 'rgba(29,158,117,0.6)',
                borderColor: 'rgba(29,158,117,1)',
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            scales: {
              x: {
                ticks: { font: { size: 11 }, color: '#858ea2' },
                grid: { drawBorder: false, color: 'rgba(0,0,0,0.05)' },
              },
              y: {
                ticks: { font: { size: 11 }, color: '#858ea2' },
                grid: { drawBorder: false, color: 'rgba(0,0,0,0.05)' },
              },
            },
            plugins: {
              legend: {
                labels: { font: { size: 12 }, usePointStyle: true, color: '#192744' },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = (context.parsed.y as number).toFixed(1)
                    return `${context.dataset.label}: ₹${value}K`
                  },
                },
              },
            },
          },
        })
        newCharts.push(revisionChart)
      }
    }

    setCharts(newCharts)

    return () => {
      newCharts.forEach((chart) => chart.destroy())
    }
  }, [])

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>
      {/* Summary cards */}
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

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '12px', marginBottom: '12px' }}>
        {/* Clean vs Penalty Chart */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Realised savings vs avoidable losses</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Months where penalties were zero = realised savings opportunity</div>
          </div>
          <canvas ref={cleanVsPenaltyChartRef} style={{ maxHeight: '280px' }} />
        </div>

        {/* Contract Revision Projection Chart */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744' }}>Potential annual savings — contract revision</div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>Projected savings if contracted demand is revised to recommended level (P90 MDI + 15%)</div>
          </div>
          <canvas ref={revisionProjectionChartRef} style={{ maxHeight: '280px' }} />
        </div>
      </div>

      {/* KPI Insight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
        <KpiCard
          variant="good"
          label="Contract revision saving"
          value={`₹${(contractRevisionSaving / 100000).toFixed(1)}L`}
          desc="Raise contracted demand to recommended kVA · eliminates most excess charges"
        />
        <KpiCard
          variant="good"
          label="PF improvement saving"
          value={`₹${(insightsData.pf_saving / 100000).toFixed(1)}L`}
          desc="Eliminate PF penalties by maintaining PF ≥ 0.90 via capacitor banks"
        />
        <KpiCard
          variant="info"
          label="Total recoverable"
          value={`₹${(totalPotentialSaving / 100000).toFixed(1)}L`}
          desc={`${Math.round((totalPotentialSaving / summaryData.total_bill) * 100)}% of total bill can be avoided with recommended actions`}
        />
        <KpiCard
          variant={summaryData.clean_bill_ratio_pct >= 90 ? 'good' : 'warn'}
          label="Clean bill ratio"
          value={`${summaryData.clean_bill_ratio_pct}%`}
          desc="Share of bill that is legitimate base charges (higher = better)"
        />
      </div>
    </div>
  )
}
