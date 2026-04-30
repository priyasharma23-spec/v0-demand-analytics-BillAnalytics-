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
  const [stateMetric, setStateMetric] = React.useState<'totalLeak' | 'pct'>('pct');
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
    <div style={{ background: '#f5f6fa', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #f0f1f5', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(25,39,68,.04)', alignItems: 'stretch' }}>
        {(() => {
          const leakPct = Math.round((leakSummary.totalLeak / Math.max(leakSummary.totalBill, 1)) * 100);
          const excessPct = Math.round((leakSummary.totalExcess / Math.max(leakSummary.totalLeak, 1)) * 100);
          const pfPct = Math.round((leakSummary.totalPF / Math.max(leakSummary.totalLeak, 1)) * 100);
          const lpPct = Math.round((leakSummary.totalLP / Math.max(leakSummary.totalLeak, 1)) * 100);
          const fmtL = (v: number) => '\u20b9' + (v / 100000).toFixed(1) + 'L';
          const cards = [
            { label: 'Total leakages',      value: fmtL(leakSummary.totalLeak),   sub: leakPct + '% of total bill',  subColor: leakPct > 10 ? '#e53935' : '#f59e0b' },
            { label: 'Excess demand',        value: fmtL(leakSummary.totalExcess), sub: excessPct + '% of leakages',  subColor: excessPct > 30 ? '#e53935' : '#f59e0b' },
            { label: 'PF penalty',           value: fmtL(leakSummary.totalPF),     sub: pfPct + '% of leakages',      subColor: pfPct > 30 ? '#e53935' : '#f59e0b' },
            { label: 'Late payment charges', value: fmtL(leakSummary.totalLP),     sub: lpPct + '% of leakages',      subColor: '#36b37e' },
          ];
          return cards.map((card, i) => (
            <div key={card.label} style={{ padding: '16px 20px', borderRight: i < cards.length - 1 ? '1px solid #f0f1f5' : 'none', position: 'relative' }}>
              {i < cards.length - 1 && <div style={{ position: 'absolute', right: 0, top: '16px', bottom: '16px', width: '1px', background: '#f0f1f5' }} />}
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#192744', lineHeight: 1, marginBottom: '4px' }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: card.subColor, fontWeight: 500 }}>{card.sub}</div>
            </div>
          ));
        })()}
      </div>

      {/* Alert insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {([
          { color: '#e53935', label: 'Power factor <0.92',    value: (breakdownRows.filter(r => r.util < 92).length || 14) + ' CAs', sub: '\u20b9' + (leakSummary.totalPF / 100000).toFixed(1) + 'L monthly leakage',    desc: 'Capacitors non-compliant for 6+ consecutive months.', cta: 'View CAs' },
          { color: '#e53935', label: 'Demand shrinkage',      value: 'All CAs',                                                       sub: '\u20b9' + (leakSummary.totalExcess / 100000).toFixed(1) + 'L monthly leakage', desc: 'Contracted demand declined every month this year.',    cta: 'Review'   },
          { color: '#f59e0b', label: 'Late payment surcharge',value: (breakdownRows.length * 3 || 55) + ' CAs',                       sub: '\u20b9' + (leakSummary.totalLP / 100000).toFixed(1) + 'L monthly leakage',    desc: '3+ consecutive months of late payment charges.',      cta: 'View CAs' },
          { color: '#f59e0b', label: 'Under-utilised demand', value: 'TOD mismatch',                                                  sub: '\u20b9' + (leakSummary.totalLeak * 0.05 / 100000).toFixed(1) + 'L recoverable',desc: 'Wrong TOD slot or under-utilised contracted demand.',  cta: 'Fix now'  },
        ] as Array<{ color: string; label: string; value: string; sub: string; desc: string; cta: string }>).map((a, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f1f5', borderLeft: '3px solid ' + a.color, borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{a.label}</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#192744', lineHeight: 1 }}>{a.value}</div>
              <div style={{ fontSize: '12px', color: a.color, marginTop: '3px' }}>{a.sub}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', lineHeight: 1.5, flex: 1 }}>{a.desc}</div>
            <button style={{ alignSelf: 'flex-start', fontSize: '12px', fontWeight: 600, color: a.color, background: '#fff', border: '1px solid ' + a.color + '33', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>{a.cta} &rarr;</button>
          </div>
        ))}
      </div>

      {/* Inline header stats strip */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', display: 'flex', overflow: 'hidden' }}>
        {([
          { label: 'Avg leakage rate',  value: Math.round((leakSummary.totalLeak / Math.max(leakSummary.totalBill, 1)) * 100) + '%', sub: 'Target <4%', neg: true,  hi: false },
          { label: 'Biggest type',      value: leakSummary.totalExcess >= leakSummary.totalPF && leakSummary.totalExcess >= leakSummary.totalLP ? 'Excess Demand' : leakSummary.totalPF >= leakSummary.totalLP ? 'Power Factor' : 'Late Payment', sub: '\u20b9' + (Math.max(leakSummary.totalExcess, leakSummary.totalPF, leakSummary.totalLP) / 100000).toFixed(1) + 'L / year', neg: false, hi: false },
          { label: 'Months leaking',    value: leakSummary.periodsWithLeak + ' / ' + leakSummary.totalPeriods, sub: Math.round((leakSummary.periodsWithLeak / Math.max(leakSummary.totalPeriods, 1)) * 100) + '% of periods affected', neg: false, hi: false },
          { label: 'Savings potential', value: '\u20b9' + (leakSummary.totalLeak / 100000).toFixed(1) + 'L', sub: 'If fully remediated', neg: false, hi: true },
        ] as Array<{ label: string; value: string; sub: string; neg: boolean; hi: boolean }>).map((s, i, arr) => (
          <div key={i} style={{ flex: 1, padding: '12px 20px', borderRight: i < arr.length - 1 ? '1px solid #f0f1f5' : 'none', background: s.hi ? '#eef3fe' : '#fff' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1, marginBottom: '3px', color: s.hi ? '#1c5af4' : s.neg ? '#e53935' : '#192744' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#9aa0b0' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Stacked leakage chart */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Monthly leakage by type</div>
          <div style={{ display: 'flex', gap: '14px' }}>
            {([
              { color: '#4a7ef7', label: 'Excess demand' },
              { color: '#f6b83f', label: 'PF penalty' },
              { color: '#f07070', label: 'TOD violation' },
              { color: '#9f76e8', label: 'LV surcharge' },
              { color: '#7ab67a', label: 'Late payment' },
            ] as Array<{ color: string; label: string }>).map(item => (
              <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
                <span style={{ fontSize: '12px', color: '#9aa0b0' }}>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '250px' }}>
          <canvas ref={stackChartRef}></canvas>
        </div>
      </div>

      {/* Pct + Donut row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Leakage % of bill</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginBottom: '10px' }}>Target &lt;4%</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={pctChartRef}></canvas>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744', marginBottom: '2px' }}>Type breakdown</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginBottom: '10px' }}>Annual total &middot; share by category</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* State breakdown */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>State breakdown</div>
          <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
            {([{ id: 'pct', label: '% rate' }, { id: 'totalLeak', label: '\u20b9 amount' }] as Array<{ id: 'totalLeak' | 'pct'; label: string }>).map(o => (
              <button key={o.id} onClick={() => setStateMetric(o.id)} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '3px 12px', fontSize: '12px', background: stateMetric === o.id ? '#1c5af4' : 'transparent', color: stateMetric === o.id ? '#fff' : '#9aa0b0', fontWeight: stateMetric === o.id ? 600 : 400, transition: 'all .12s' }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(() => {
            const stateRows = breakdownRows.map(r => ({
              ...r,
              pct: Math.round(r.totalLeak / Math.max(leakSummary.totalBill / Math.max(breakdownRows.length, 1), 1) * 1000) / 10,
            }));
            const sorted = [...stateRows].sort((a, b) => b[stateMetric] - a[stateMetric]);
            const maxVal = Math.max(...sorted.map(x => x[stateMetric]), 1);
            return sorted.map((r, i) => {
              const barPct = (r[stateMetric] / maxVal) * 100;
              const sc = r.pct >= 7 ? '#e53935' : r.pct >= 5.5 ? '#f59e0b' : '#36b37e';
              const sb = r.pct >= 7 ? '#fef2f2' : r.pct >= 5.5 ? '#fffbeb' : '#f0faf6';
              const sl = r.pct >= 7 ? 'High' : r.pct >= 5.5 ? 'Med' : 'Low';
              const displayVal = stateMetric === 'totalLeak' ? '\u20b9' + (r.totalLeak / 100000).toFixed(1) + 'L' : r.pct + '%';
              return (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '18px', fontSize: '12px', fontWeight: 600, color: '#c8cbd6', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: '110px', fontSize: '12px', color: '#192744', flexShrink: 0 }}>{r.name}</div>
                  <div style={{ flex: 1, height: '22px', background: '#f5f6fa', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: barPct + '%', borderRadius: '3px', background: r.pct >= 7 ? 'rgba(229,57,53,0.18)' : r.pct >= 5.5 ? 'rgba(245,158,11,0.18)' : 'rgba(54,179,126,0.15)', borderRight: '2px solid ' + sc, transition: 'width .4s ease' }} />
                    <div style={{ position: 'absolute', left: '8px', top: 0, height: '100%', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#192744', fontWeight: 500 }}>{displayVal}</div>
                  </div>
                  <div style={{ width: '54px', fontSize: '12px', color: '#9aa0b0', textAlign: 'right', flexShrink: 0 }}>{r.mdi} kVA</div>
                  <div style={{ width: '40px', flexShrink: 0 }}>
                    <span style={{ background: sb, color: sc, fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px' }}>{sl}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

    </div>
  );
}
              cta: 'View CAs',
            },
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
              title: 'Late payment surcharge recurring in 19 CAs �� 3+ consecutive months',
              where: 'WB · GJ',
              amount: '₹1.3L',
              amountLabel: 'avoidable / yr',
              amountColor: '#A32D2D',
              iconBg: '#FCEBEB',
              iconColor: '#A32D2D',
              cta: 'View CAs',
            },
            {
              anomalyKey: 'under_utilised',
              title: '12 CAs under-utilising contracted demand below 70% — revision opportunity',
              where: 'TN · RJ',
              amount: '₹0.8L',
              amountLabel: 'saveable / yr',
              amountColor: '#15803D',
              iconBg: '#F0FDF4',
              iconColor: '#15803D',
              cta: 'View CAs',
            },
          ].map((a, idx) => {
            return (
              <div key={a.anomalyKey} style={{ background: '#f9fafb', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', transition: 'all .16s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid #C7D2FE'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(79,70,229,0.08)'; (e.currentTarget as HTMLDivElement).style.background = '#FAFBFF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid #E5E7EB'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.background = '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.iconColor, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2.5L1.5 15.5h15L9 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
                      <path d="M9 7v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="9" cy="13" r="0.8" fill="currentColor" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: a.amountColor, letterSpacing: '-0.5px' }}>{a.amount}</div>
                    <div style={{ fontSize: '10px', color: '#858ea2', fontWeight: 500 }}>{a.amountLabel}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#192744', lineHeight: 1.4 }}>{a.title}</div>
                  {a.where && <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '6px' }}>{a.where}</div>}
                </div>
                <button style={{ alignSelf: 'flex-start', background: 'none', color: '#4F46E5', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#C7D2FE' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}>
                  {a.cta} →
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {/* Stacked leakage chart */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>Total leakage charges by type</div>
        <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>₹ · stacked by penalty category · monthly</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', fontSize: '11px', color: '#858ea2' }}>
          {[
            { color: '#E24B4A', label: 'Excess demand' },
            { color: '#EF9F27', label: 'PF penalty' },
            { color: '#7F77DD', label: 'TOD violation' },
            { color: '#D85A30', label: 'LV surcharge' },
            { color: '#888780', label: 'Late payment' },
          ].map(item => (
            <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', width: '100%', height: '250px' }}>
          <canvas ref={stackChartRef}></canvas>
        </div>
      </div>

      {/* Pct + Donut row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>Leakage as % of bill</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Monthly leakage intensity · colour indicates severity</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={pctChartRef}></canvas>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>Leakage type breakdown</div>
          <div style={{ fontSize: '12px', color: '#858ea2', marginBottom: '10px' }}>Share of total penalties · by category</div>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* KPI insight cards */}
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Insights</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '16px' }}>
        {kpis.map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
      </div>

      {/* State breakdown table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#192744', marginBottom: '2px' }}>State breakdown — all states</div>
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
