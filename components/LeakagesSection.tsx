'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, inrK, STATES, getStateBills } from '@/lib/calculations';
import { SummaryCard } from './SummaryCard';
import { KpiCard } from './KpiCard';

type BreakdownRow = {
  name: string;
  contracted: number;
  mdi: number;
  over: number;
  totalLeak: number;
  util: number;
  level: 'state' | 'branch' | 'ca';
};

interface LeakagesSectionProps {
  appState?: { view: string; stateF: string; branchF: string; caF: string }
}

export default function LeakagesSection({ appState }: LeakagesSectionProps) {
  const stackChartRef = useRef<HTMLCanvasElement>(null);
  const pctChartRef   = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  const stackChartInstance = useRef<Chart | null>(null);
  const pctChartInstance   = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  const [kpis, setKpis] = useState<any[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownCols, setBreakdownCols] = useState<string[]>([]);
  const [leakSummary, setLeakSummary] = useState({
    totalLeak: 0, totalExcess: 0, totalPF: 0, totalLP: 0,
    periodsWithLeak: 0, totalPeriods: 0, totalBill: 0,
  });

  useEffect(() => {
    renderLeakages();
    return () => {
      if (stackChartInstance.current) stackChartInstance.current.destroy();
      if (pctChartInstance.current)   pctChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
    };
  }, [appState?.stateF ?? 'all', appState?.branchF ?? 'all', appState?.caF ?? 'all']);

  const handleDrillDown = (_r: BreakdownRow) => {};

  const renderLeakages = () => {
    const data = getFilteredBills(
      'monthly',
      appState?.stateF ?? 'all',
      appState?.branchF ?? 'all',
      appState?.caF ?? 'all'
    );
    const labels = data.map((d) => d.label);

    const totalExcess = data.reduce((a, d) => a + d.excessCharge,  0);
    const totalPF     = data.reduce((a, d) => a + d.pfPenalty,     0);
    const totalTOD    = data.reduce((a, d) => a + d.todViolation,  0);
    const totalLV     = data.reduce((a, d) => a + d.lvSurcharge,   0);
    const totalLP     = data.reduce((a, d) => a + d.latePayment,   0);
    const totalLeak   = totalExcess + totalPF + totalTOD + totalLV + totalLP;
    const totalBill   = data.reduce((a, d) => a + d.totalBill,     0);

    const leakPct        = Math.round((totalLeak / Math.max(totalBill, 1)) * 100);
    const periodsWithLeak = data.filter((d) => d.totalLeakage > 0).length;

    setLeakSummary({ totalLeak, totalExcess, totalPF, totalLP, periodsWithLeak, totalPeriods: data.length, totalBill });

    const biggestDriver =
      totalExcess >= totalPF && totalExcess >= totalLP ? 'Excess demand'  :
      totalPF >= totalLP                               ? 'Power factor'   : 'Late payment';
    const biggestDesc =
      totalExcess >= totalPF && totalExcess >= totalLP ? `₹${inrK(totalExcess)} in excess demand charges`     :
      totalPF >= totalLP                               ? `₹${inrK(totalPF)} in PF penalty charges`           :
                                                         `₹${inrK(totalLP)} in late payment surcharges`;

    setKpis([
      {
        variant: leakPct > 20 ? 'danger' : leakPct > 10 ? 'warn' : 'good',
        label: 'Leakage ratio',
        value: `${leakPct}%`,
        desc: `${inrK(totalLeak)} in penalties out of ${inrK(totalBill)} total bill`,
      },
      { variant: 'warn', label: 'Biggest leakage driver', value: biggestDriver, desc: biggestDesc },
      {
        variant: 'info',
        label: 'Frequency',
        value: `${periodsWithLeak}/${data.length}`,
        desc: `${Math.round(periodsWithLeak / Math.max(data.length, 1) * 100)}% of periods had avoidable charges`,
      },
      {
        variant: 'info',
        label: 'Avg leakage per period',
        value: inr(totalLeak / Math.max(data.length, 1)),
        desc: 'Mean avoidable cost per billing cycle',
      },
    ]);

    setBreakdownCols(['State', 'Contracted', 'Avg MDI', 'Excess periods', 'Total leakage', 'Status']);
    setBreakdownRows(
      STATES.map(st => {
        const d = getStateBills(st, 'monthly');
        const avgMDI     = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length);
        const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length);
        const over       = d.filter(r => r.mdi > r.contracted).length;
        const totalLeak  = d.reduce((a, r) => a + r.totalLeakage, 0);
        const util       = Math.round(avgMDI / Math.max(contracted, 1) * 100);
        return { name: st, contracted, mdi: avgMDI, over, totalLeak, util, level: 'state' as const };
      }).sort((a, b) => b.totalLeak - a.totalLeak)
    );

    initLeakageCharts(labels, data, totalExcess, totalPF, totalTOD, totalLV, totalLP);
  };

  const initLeakageCharts = (
    labels: string[], data: any[],
    totalExcess: number, totalPF: number, totalTOD: number, totalLV: number, totalLP: number
  ) => {
    // Stacked bar — leakage by type
    if (stackChartRef.current) {
      const ctx = stackChartRef.current.getContext('2d');
      if (ctx) {
        if (stackChartInstance.current) stackChartInstance.current.destroy();
        stackChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Excess demand', data: data.map((d: any) => d.excessCharge),  backgroundColor: '#E24B4A', borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.85 },
              { label: 'PF penalty',    data: data.map((d: any) => d.pfPenalty),     backgroundColor: '#EF9F27', borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.85 },
              { label: 'TOD violation', data: data.map((d: any) => d.todViolation),  backgroundColor: '#7F77DD', borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.85 },
              { label: 'LV surcharge',  data: data.map((d: any) => d.lvSurcharge),   backgroundColor: '#D85A30', borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.85 },
              { label: 'Late payment',  data: data.map((d: any) => d.latePayment),   backgroundColor: '#888780', borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.85,
                borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } },
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
                  label: item => `  ${item.dataset.label}: ${inrK(item.raw as number)}`,
                  footer: items => `Total: ${inrK(items.reduce((s, i) => s + (i.raw as number), 0))}`,
                }
              }
            },
            scales: {
              x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
              y: { stacked: true, border: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => inrK(Number(v)) } },
            },
          },
        });
      }
    }

    // Leakage % of total bill bar
    if (pctChartRef.current) {
      const ctx = pctChartRef.current.getContext('2d');
      if (ctx) {
        if (pctChartInstance.current) pctChartInstance.current.destroy();
        pctChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: data.map((d: any) => Math.round(d.totalLeakage / Math.max(d.totalBill, 1) * 100)),
              backgroundColor: data.map((d: any) => {
                const p = Math.round(d.totalLeakage / Math.max(d.totalBill, 1) * 100);
                return p > 20 ? '#E24B4A' : p > 10 ? '#EF9F27' : '#1D9E75';
              }),
              borderRadius: 4,
              barPercentage: 0.7,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#192744',
                titleColor: '#fff',
                bodyColor: 'rgba(255,255,255,0.85)',
                padding: 10,
                cornerRadius: 8,
                callbacks: { label: item => `  Leakage: ${item.raw}% of bill` }
              }
            },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: '#858ea2', font: { size: 11 } } },
              y: {
                max: 35,
                border: { display: false },
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#858ea2', font: { size: 11 }, callback: (v: any) => v + '%' },
                afterDataLimits: (axis: any) => { axis.max = 35 },
              },
            },
          },
        });
      }
    }

    // Donut — leakage type share
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      if (ctx) {
        if (donutChartInstance.current) donutChartInstance.current.destroy();
        donutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Excess demand', 'PF penalty', 'TOD violation', 'LV surcharge', 'Late payment'],
            datasets: [{
              data: [totalExcess, totalPF, totalTOD, totalLV, totalLP],
              backgroundColor: ['#E24B4A', '#EF9F27', '#7F77DD', '#D85A30', '#888780'],
              borderWidth: 0,
              hoverOffset: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: { size: 12 },
                  boxWidth: 12,
                  padding: 12,
                  generateLabels: (chart: any) => {
                    const data = chart.data
                    const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
                    return data.labels.map((label: string, i: number) => ({
                      text: `${label}  ${Math.round(data.datasets[0].data[i] / Math.max(total,1) * 100)}%`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: 'transparent',
                      index: i,
                    }))
                  }
                }
              },
              tooltip: {
                backgroundColor: '#192744',
                titleColor: '#fff',
                bodyColor: 'rgba(255,255,255,0.85)',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (item: any) => {
                    const total = item.dataset.data.reduce((a: number, b: number) => a + b, 0)
                    const pct = Math.round(item.parsed / Math.max(total, 1) * 100)
                    return ` ${item.label}: ${inrK(item.parsed)} (${pct}%)`
                  }
                }
              }
            },
          },
        });
      }
    }
  };

  return (
    <div style={{ background: '#f0f5fa', padding: '20px' }}>

      {/* Summary metric cards */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex', marginBottom: '16px' }}>
        {[
          { label: 'Total leakages',      value: inr(leakSummary.totalLeak),   sub: `${Math.round(leakSummary.totalLeak   / Math.max(leakSummary.totalBill, 1) * 100)}% of total bill`,  subColor: '#B91C1C' },
          { label: 'Excess demand',        value: inr(leakSummary.totalExcess), sub: `${Math.round(leakSummary.totalExcess / Math.max(leakSummary.totalLeak, 1) * 100)}% of leakages`,    subColor: '#B91C1C' },
          { label: 'PF penalty',           value: inr(leakSummary.totalPF),     sub: `${Math.round(leakSummary.totalPF     / Math.max(leakSummary.totalLeak, 1) * 100)}% of leakages`,    subColor: '#B45309' },
          { label: 'Late payment charges', value: inr(leakSummary.totalLP),     sub: `${Math.round(leakSummary.totalLP     / Math.max(leakSummary.totalLeak, 1) * 100)}% of leakages`,    subColor: '#B45309' },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '1px', background: '#E5E7EB' }} />}
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Surfaced anomalies */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '20px 24px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Surfaced anomalies</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Ranked by avoidable cost · leakage-related signals</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            {
              anomalyKey: 'pf_below_threshold',
              title: 'Power factor below 0.90 in 28 branches for 6+ months',
              where: 'UP · RJ',
              amount: '₹2.1L',
              amountLabel: 'avoidable / yr',
              amountColor: '#854F0B',
              iconBg: '#FAEEDA',
              iconColor: '#854F0B',
              cta: 'View branches',
            },
            {
              anomalyKey: 'recurring_late_payment',
              title: 'Late payment surcharge recurring in 19 CAs — 3+ consecutive months',
              where: 'WB · GJ',
              amount: '₹1.3L',
              amountLabel: 'avoidable / yr',
              amountColor: '#A32D2D',
              iconBg: '#FCEBEB',
              iconColor: '#A32D2D',
              cta: 'View CAs',
            },
          ].map((a, idx) => {
            return (
              <div key={a.anomalyKey} style={{ background: '#fff', border: '1.5px solid #F3F4F6', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', transition: 'all .16s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1.5px solid #4F46E5'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.07)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1.5px solid #F3F4F6'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.iconColor, flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2.5L1.5 15.5h15L9 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
                      <path d="M9 7v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="9" cy="13" r="0.8" fill="currentColor" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: a.amountColor, letterSpacing: '-0.5px' }}>{a.amount}</div>
                    <div style={{ fontSize: '11px', color: '#858ea2' }}>{a.amountLabel}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', lineHeight: 1.4 }}>{a.title}</div>
                  {a.where && <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '6px' }}>{a.where}</div>}
                </div>
                <button style={{ alignSelf: 'flex-start', background: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {a.cta} →
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {/* Stacked leakage chart */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Total leakage charges by type</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>₹ · stacked by penalty category · monthly</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', fontSize: '12px', color: '#6b6b67' }}>
          {[
            { color: '#E24B4A', label: 'Excess demand' },
            { color: '#EF9F27', label: 'PF penalty' },
            { color: '#7F77DD', label: 'TOD violation' },
            { color: '#D85A30', label: 'LV surcharge' },
            { color: '#888780', label: 'Late payment' },
          ].map(item => (
            <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <canvas ref={stackChartRef}></canvas>
        </div>
      </div>

      {/* Pct + Donut row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Leakage as % of total bill</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Penalty ÷ total bill · colour = severity</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={pctChartRef}></canvas>
          </div>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>Leakage type breakdown</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Share of total penalties across the period</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* KPI insight cards */}
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Insights</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        {kpis.map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
      </div>

      {/* State breakdown table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: '12px', padding: '16px 18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#192744', marginBottom: '3px' }}>State breakdown — all states</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '12px' }}>Ranked by total leakage · click a row to drill down</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {breakdownCols.map(c => (
                  <th key={c} style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map((r, i) => (
                <tr key={i}
                  style={{ cursor: r.level !== 'ca' ? 'pointer' : 'default' }}
                  onClick={() => r.level !== 'ca' ? handleDrillDown(r) : undefined}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#185FA5' }}>{r.name}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>{r.contracted} kVA</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: r.mdi > r.contracted ? '#A32D2D' : '#3B6D11', fontWeight: 500 }}>{r.mdi} kVA</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>{r.over}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#A32D2D', fontWeight: 500 }}>{inr(r.totalLeak)}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                      background: r.util > 110 ? '#FCEBEB' : r.util > 100 ? '#FAEEDA' : '#EAF3DE',
                      color:      r.util > 110 ? '#A32D2D' : r.util > 100 ? '#633806' : '#27500A' }}>
                      {r.util > 110 ? 'Over' : r.util > 100 ? 'Near limit' : 'OK'}
                    </span>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(r.util, 130)}%`,
                        background: r.util > 110 ? '#E24B4A' : r.util > 100 ? '#EF9F27' : '#1D9E75' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
