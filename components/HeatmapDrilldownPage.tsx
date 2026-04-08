'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { BRANCHES, CAS, getStateBills, getBranchBills, getCABills } from '@/lib/calculations';
import { MetricCard } from './MetricCard';
import { KpiCard } from './KpiCard';

interface HeatmapDrilldownProps {
  state: string;
  month: string;
  monthIndex: number;
  onBack: () => void;
  onViewAllSections: () => void;
  onBranchClick: (branch: string) => void;
  appState: { view: string; stateF: string; branchF: string; caF: string; billCategory: string; section: string };
}

function inr(v: number): string {
  return '₹' + (v / 100000).toFixed(1) + 'L';
}

function inrK(v: number): string {
  return '₹' + (v / 1000).toFixed(0) + 'K';
}

function severityLabel(pct: number): string {
  if (pct >= 30) return 'Critical';
  if (pct >= 23) return 'High';
  if (pct >= 16) return 'Elevated';
  if (pct >= 10) return 'Moderate';
  return 'In range';
}

export default function HeatmapDrilldownPage({
  state,
  month,
  monthIndex,
  onBack,
  onViewAllSections,
  onBranchClick,
  appState,
}: HeatmapDrilldownProps) {
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  const [sortBy, setSortBy] = useState<'leakage' | 'bill'>('leakage');

  // Derived values
  const monthData = getStateBills(state, 'monthly')[monthIndex];
  const leakPct = Math.round((monthData.totalLeakage / monthData.totalBill) * 100);

  const overContractedCAs = (BRANCHES[state] ?? [])
    .flatMap((br) => CAS[br] ?? [])
    .filter((ca) => {
      const d = getCABills(ca, 'monthly')[monthIndex];
      return d && d.mdi > d.contracted;
    }).length;

  const pfBelowThreshold = (BRANCHES[state] ?? []).filter((br) => {
    const d = getBranchBills(br, 'monthly')[monthIndex];
    return d && d.pf < 0.9;
  }).length;

  const latePaymentCAs = (BRANCHES[state] ?? [])
    .flatMap((br) => CAS[br] ?? [])
    .filter((ca) => {
      const d = getCABills(ca, 'monthly')[monthIndex];
      return d && d.latePayment > 0;
    }).length;

  // Build branch rows
  const branchRows = (BRANCHES[state] ?? [])
    .map((branch) => {
      const bills = getBranchBills(branch, 'monthly');
      const d = bills[monthIndex];
      const branchLeakPct = Math.round((d.totalLeakage / d.totalBill) * 100);
      const status = branchLeakPct >= 25 ? 'over' : branchLeakPct >= 15 ? 'warn' : 'ok';
      return { branch, d, branchLeakPct, status };
    })
    .sort((a, b) =>
      sortBy === 'leakage'
        ? b.d.totalLeakage - a.d.totalLeakage
        : b.d.totalBill - a.d.totalBill
    );

  useEffect(() => {
    initCharts();
    return () => {
      if (donutChartInstance.current) donutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, []);

  const initCharts = () => {
    // Leakage by type donut
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      if (ctx) {
        if (donutChartInstance.current) donutChartInstance.current.destroy();
        donutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Excess demand', 'PF penalty', 'Late payment', 'TOD violation', 'LV surcharge'],
            datasets: [
              {
                data: [
                  monthData.excessCharge,
                  monthData.pfPenalty,
                  monthData.latePayment,
                  monthData.todViolation,
                  monthData.lvSurcharge,
                ],
                backgroundColor: ['#E24B4A', '#EF9F27', '#888780', '#7F77DD', '#D85A30'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 10, padding: 8 } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ' ₹' + ((ctx.parsed as number) / 100000).toFixed(1) + 'L',
                },
              },
            },
          },
        });
      }
    }

    // Month-on-month trend bar
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        if (barChartInstance.current) barChartInstance.current.destroy();
        const allMonths = getStateBills(state, 'monthly');
        barChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: allMonths.map((d) => d.label),
            datasets: [
              {
                data: allMonths.map((d) => d.totalLeakage),
                backgroundColor: allMonths.map((_, i) => (i === monthIndex ? '#E24B4A' : '#FFCEC8')),
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                ticks: {
                  callback: (v) => '₹' + ((v as number) / 100000).toFixed(1) + 'L',
                },
              },
            },
          },
        });
      }
    }
  };

  const kpis = [
    {
      variant: leakPct >= 25 ? ('danger' as const) : ('warn' as const),
      label: 'Leakage ratio',
      value: `${leakPct}%`,
      desc:
        leakPct >= 25
          ? `Critical — verify if this is the highest month for ${state} in FY2024-25`
          : `Elevated — review penalty drivers for ${state} in ${month}`,
    },
    {
      variant: 'warn' as const,
      label: 'Peak demand spike',
      value: `+${Math.round(((monthData.mdi / monthData.contracted - 1) * 100))}%`,
      desc: `MDI exceeded contracted demand — summer peak likely driving excess charges`,
    },
    {
      variant: monthData.pfPenalty > 0 ? ('warn' as const) : ('good' as const),
      label: 'PF below threshold',
      value: monthData.pfPenalty > 0 ? `${pfBelowThreshold} branches` : 'None',
      desc:
        monthData.pfPenalty > 0
          ? `PF dropped below 0.90 in ${month} — coincides with high load season`
          : `All branches maintained PF above 0.90 in ${month}`,
    },
    {
      variant: 'info' as const,
      label: 'Recoverable amount',
      value: inr(Math.round(monthData.totalLeakage * 0.8)),
      desc: `Contract revision + PF correction could recover ~80% of leakage in similar months`,
    },
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Section 1: Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            borderTop: '0.5px solid rgba(0,0,0,0.15)',
            borderRight: '0.5px solid rgba(0,0,0,0.15)',
            borderBottom: '0.5px solid rgba(0,0,0,0.15)',
            borderLeft: '0.5px solid rgba(0,0,0,0.15)',
            background: '#fff',
            fontSize: '13px',
            color: '#6b6b67',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          ← Back to overview
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#858ea2', fontFamily: '"Inter", sans-serif' }}>
          <span style={{ color: '#2500D7', cursor: 'pointer', textDecoration: 'underline' }} onClick={onBack}>
            Overview
          </span>
          <span>›</span>
          <span style={{ color: '#2500D7', cursor: 'pointer', textDecoration: 'underline' }} onClick={onViewAllSections}>
            Leakages
          </span>
          <span>›</span>
          <span style={{ color: '#192744', fontWeight: 500 }}>
            {state} · {month}
          </span>
        </div>
      </div>

      {/* Section 2: Context card */}
      <div
        style={{
          background: '#fff',
          borderTop: '0.5px solid rgba(0,0,0,0.15)',
          borderRight: '0.5px solid rgba(0,0,0,0.15)',
          borderBottom: '0.5px solid rgba(0,0,0,0.15)',
          borderLeft: '0.5px solid rgba(0,0,0,0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#EBEAFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2500D7',
              flexShrink: 0,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {state.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: '#192744', marginBottom: '2px', fontFamily: '"Inter", sans-serif' }}>
              {state} — {month}
            </div>
            <div style={{ fontSize: '12px', color: '#858ea2', fontFamily: '"Inter", sans-serif' }}>
              {BRANCHES[state]?.length ?? 0} branches · {BRANCHES[state]?.flatMap((b) => CAS[b] ?? []).length ?? 0} CAs · Electricity · Bill payment
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  background: '#FCEBEB',
                  color: '#A32D2D',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {leakPct}% leakage — {severityLabel(leakPct)}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  background: '#FAEEDA',
                  color: '#633806',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Peak demand month
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  background: '#E6F1FB',
                  color: '#0C447C',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {overContractedCAs} CAs over contracted
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              background: '#EBEAFF',
              color: '#2500D7',
              borderTop: '0.5px solid #C4C2FF',
              borderRight: '0.5px solid #C4C2FF',
              borderBottom: '0.5px solid #C4C2FF',
              borderLeft: '0.5px solid #C4C2FF',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            + Pin this view
          </button>
          <button
            onClick={onViewAllSections}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              background: '#2500D7',
              color: '#fff',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              borderLeft: 'none',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            View all sections →
          </button>
        </div>
      </div>

      {/* Section 3: Five metric cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <MetricCard label="Total bill" value={inr(monthData.totalBill)} sub={month} subColor="#858ea2" />
        <MetricCard label="Total leakage" value={inr(monthData.totalLeakage)} sub={`${leakPct}% of bill`} subColor="#A32D2D" />
        <MetricCard label="Excess demand" value={inr(monthData.excessCharge)} sub={`${overContractedCAs} CAs affected`} subColor="#A32D2D" />
        <MetricCard label="PF penalty" value={inr(monthData.pfPenalty)} sub={`${pfBelowThreshold} branches below 0.90`} subColor="#854F0B" />
        <MetricCard label="Late payment" value={inr(monthData.latePayment)} sub={`${latePaymentCAs} CAs affected`} subColor="#854F0B" />
      </div>

      {/* Section 4: Two-column charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.15)', borderRight: '0.5px solid rgba(0,0,0,0.15)', borderBottom: '0.5px solid rgba(0,0,0,0.15)', borderLeft: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744', marginBottom: '12px', fontFamily: '"Inter", sans-serif' }}>Leakage by type</div>
          <div style={{ height: '180px' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>

        <div style={{ background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.15)', borderRight: '0.5px solid rgba(0,0,0,0.15)', borderBottom: '0.5px solid rgba(0,0,0,0.15)', borderLeft: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#192744', marginBottom: '12px', fontFamily: '"Inter", sans-serif' }}>Month-on-month trend</div>
          <div style={{ height: '180px' }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Section 5: KPI insight cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '12px',
        }}
      >
        {kpis.map((kpi, i) => (
          <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />
        ))}
      </div>

      {/* Section 6: Branch breakdown table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#192744', fontFamily: '"Inter", sans-serif' }}>
              Branch breakdown — {state} · {month}
            </div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px', fontFamily: '"Inter", sans-serif' }}>Click a branch to drill into its CAs</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSortBy(sortBy === 'leakage' ? 'bill' : 'leakage')}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '12px',
                borderTop: '0.5px solid rgba(0,0,0,0.15)',
                borderRight: '0.5px solid rgba(0,0,0,0.15)',
                borderBottom: '0.5px solid rgba(0,0,0,0.15)',
                borderLeft: '0.5px solid rgba(0,0,0,0.15)',
                background: 'transparent',
                color: '#6b6b67',
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Sort by {sortBy === 'leakage' ? 'bill' : 'leakage'}
            </button>
            <button
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '12px',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
                background: '#EBEAFF',
                color: '#2500D7',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.15)', borderRight: '0.5px solid rgba(0,0,0,0.15)', borderBottom: '0.5px solid rgba(0,0,0,0.15)', borderLeft: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 140px 140px 120px 140px 120px 120px 100px',
              gap: 0,
              padding: '12px 16px',
              background: '#f5f5f4',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b6b67',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            <div>Branch</div>
            <div>Total bill</div>
            <div>Leakage ₹</div>
            <div>Leakage %</div>
            <div>Excess demand</div>
            <div>PF penalty</div>
            <div>Late payment</div>
            <div>Status</div>
          </div>

          {/* Table rows */}
          {branchRows.map((row, idx) => {
            const statusColors = {
              over: { bg: '#FCEBEB', color: '#A32D2D', label: 'Critical' },
              warn: { bg: '#FAEEDA', color: '#633806', label: 'Elevated' },
              ok: { bg: '#EAF3DE', color: '#3B6D11', label: 'OK' },
            };
            const statusStyle = statusColors[row.status as keyof typeof statusColors as keyof typeof statusColors];

            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 140px 140px 120px 140px 120px 120px 100px',
                  gap: 0,
                  padding: '12px 16px',
                  borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                  fontSize: '13px',
                  fontFamily: '"Inter", sans-serif',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{ color: '#2500D7', fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => onBranchClick(row.branch)}
                >
                  {row.branch}
                </div>
                <div style={{ color: '#192744' }}>{inr(row.d.totalBill)}</div>
                <div style={{ color: '#A32D2D', fontWeight: 500 }}>{inr(row.d.totalLeakage)}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: row.branchLeakPct >= 25 ? '#E24B4A' : row.branchLeakPct >= 15 ? '#EF9F27' : '#1D9E75',
                  }}
                >
                  <span>{row.branchLeakPct}%</span>
                  <div
                    style={{
                      width: '40px',
                      height: '6px',
                      borderRadius: '2px',
                      background: row.branchLeakPct >= 25 ? '#E24B4A' : row.branchLeakPct >= 15 ? '#EF9F27' : '#1D9E75',
                      opacity: (row.branchLeakPct / 100) * 0.6 + 0.4,
                    }}
                  />
                </div>
                <div style={{ color: '#192744' }}>{inr(row.d.excessCharge)}</div>
                <div style={{ color: '#192744' }}>{inr(row.d.pfPenalty)}</div>
                <div style={{ color: '#192744' }}>{inr(row.d.latePayment)}</div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {statusStyle.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
