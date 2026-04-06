'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, getStateBills, STATES } from '@/lib/calculations';
import { MetricCard } from './MetricCard';
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

export default function ExcessDemandSection() {
  const edMainRef = useRef<HTMLCanvasElement>(null);
  const edExcessRef = useRef<HTMLCanvasElement>(null);

  const edMainInstance = useRef<Chart | null>(null);
  const edExcessInstance = useRef<Chart | null>(null);

  const [edMetrics, setEdMetrics] = useState({
    avgCont: 0,
    avgMDI: 0,
    peakMDI: 0,
    overN: 0,
    overPct: 0,
    recommended: 0,
    netSavings: 0,
    utilEff: 0,
    totalExcess: 0,
  });
  const [kpis, setKpis] = useState<any[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownCols, setBreakdownCols] = useState<string[]>([]);

  useEffect(() => {
    renderExcessDemand();

    return () => {
      if (edMainInstance.current) edMainInstance.current.destroy();
      if (edExcessInstance.current) edExcessInstance.current.destroy();
    };
  }, []);

  const handleDrillDown = (r: BreakdownRow) => {
    // No-op for now - filter state would be passed as props from parent
  };

  const renderExcessDemand = () => {
    const data = getFilteredBills('yearly', 'all', 'all', 'all');
    const labels = data.map((d) => d.label);

    const totalExcess = data.reduce((a, d) => a + d.excessCharge, 0);
    const mdiArr = data.map(d => d.mdi);
    const contArr = data.map(d => d.contracted);
    const avgMDI = Math.round(mdiArr.reduce((a, b) => a + b, 0) / mdiArr.length);
    const avgCont = Math.round(contArr.reduce((a, b) => a + b, 0) / contArr.length);
    const peakMDI = Math.max(...mdiArr);
    const overN = mdiArr.filter((v, i) => v > contArr[i]).length;
    const overPct = Math.round(overN / data.length * 100);

    const sortedMDI = [...mdiArr].sort((a, b) => a - b);
    const p90MDI = sortedMDI[Math.floor(mdiArr.length * 0.9)];
    const recommended = Math.round(p90MDI * 1.1 / 10) * 10;

    const avgDemandRate = data.reduce((a, d) => a + d.fixedCharge / d.contracted, 0) / data.length;
    const annualExcess = totalExcess * 1;
    const extraFixed = (recommended - avgCont) * avgDemandRate * 12;
    const netSavings = Math.round(annualExcess - extraFixed);

    const utilEff = Math.round(avgMDI / peakMDI * 100);

    setEdMetrics({ avgCont, avgMDI, peakMDI, overN, overPct, recommended, netSavings, utilEff, totalExcess });
    
    setKpis([
      { variant: overPct === 100 ? 'danger' : overPct >= 75 ? 'warn' : overPct >= 50 ? 'warn' : 'good', label: 'Consistently over-contracted', value: `${overPct}%`, desc: overPct === 100 ? 'Every single month in FY2024-25 exceeded the contracted level — the contract is structurally under-sized.' : `${overN} of ${data.length} periods exceeded` },
      { variant: recommended > avgCont ? 'warn' : 'good', label: 'Recommended contract revision', value: `${recommended} kVA`, desc: 'Revise to P90 of MDI readings (+15% buffer). Eliminates excess charges and covers most peak months.' },
      { variant: netSavings > 0 ? 'info' : 'warn', label: 'Estimated annual savings', value: `${netSavings > 0 ? '' : '−'}₹${(Math.abs(netSavings)/100000).toFixed(1)}L`, desc: 'Net benefit after accounting for higher contracted demand tariff at revised level.' },
      { variant: utilEff >= 85 ? 'good' : utilEff >= 70 ? 'warn' : 'danger', label: 'Utilisation efficiency', value: `${utilEff}%`, desc: 'Avg MDI / Peak MDI — demand profile is consistent; contract revision is low-risk.' },
    ]);

    setBreakdownCols(['State', 'Contracted', 'Avg MDI', 'Excess periods', 'Total leakage', 'Status']);
    setBreakdownRows(
      STATES.map(st => {
        const d = getStateBills(st, 'yearly');
        const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length);
        const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length);
        const over = d.filter(r => r.mdi > r.contracted).length;
        const totalLeak = d.reduce((a, r) => a + r.totalLeakage, 0);
        const util = Math.round(avgMDI / contracted * 100);
        return { name: st, contracted, mdi: avgMDI, over, totalLeak, util, level: 'state' as const };
      })
    );

    initExcessCharts(labels, data);
  };

  const initExcessCharts = (labels: string[], data: any) => {
    // Contracted vs MDI chart
    if (edMainRef.current) {
      const ctx = edMainRef.current.getContext('2d');
      if (ctx) {
        if (edMainInstance.current) edMainInstance.current.destroy();
        edMainInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                data: data.map((d: any) => d.mdi),
                backgroundColor: data.map((d: any) => d.mdi > d.contracted ? 'rgba(239,159,39,0.15)' : 'transparent'),
                borderWidth: 0,
              },
              {
                data: data.map((d: any) => d.mdi),
                type: 'line',
                borderColor: '#E24B4A',
                backgroundColor: 'rgba(226,75,74,0.06)',
                borderWidth: 2,
                pointBackgroundColor: '#E24B4A',
                pointRadius: 3,
                tension: 0.35,
                fill: false,
              },
              {
                data: data.map((d: any) => d.contracted),
                type: 'line',
                borderColor: '#185FA5',
                borderWidth: 2,
                borderDash: [5, 4],
                pointRadius: 0,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { color: '#f0f0f0' } }, y: { grid: { color: '#f0f0f0' } } },
          },
        }) as any;
      }
    }

    // Excess demand charges chart
    if (edExcessRef.current) {
      const ctx = edExcessRef.current.getContext('2d');
      if (ctx) {
        if (edExcessInstance.current) edExcessInstance.current.destroy();
        edExcessInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: data.map((d: any) => d.excessCharge),
              backgroundColor: data.map((d: any) => d.excessCharge > 15000 ? '#E24B4A' : '#F09595'),
              borderRadius: 3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { color: '#f0f0f0' } }, y: { grid: { color: '#f0f0f0' } } },
          },
        });
      }
    }
  };

  return (
    <div>
      {/* Excess Demand Metrics */}
      <div className="metrics flex flex-wrap gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
        <MetricCard label="Contracted demand" value={`${edMetrics.avgCont} kVA`} sub="Current level" subColor="#185FA5" />
        <MetricCard label="Avg max demand (MDI)" value={`${edMetrics.avgMDI} kVA`} sub={edMetrics.avgMDI > edMetrics.avgCont ? 'Over contract' : 'within contract'} subColor={edMetrics.avgMDI > edMetrics.avgCont ? '#A32D2D' : '#3B6D11'} />
        <MetricCard label="Peak recorded" value={`${edMetrics.peakMDI} kVA`} sub="Aug 2024" subColor="#A32D2D" />
        <MetricCard label="Excess charges (YTD)" value={inr(edMetrics.totalExcess)} sub="12 of 12 months billed" subColor={edMetrics.overPct > 50 ? '#A32D2D' : '#633806'} />
      </div>

      <div className="chart-card px-6 py-6 mb-6">
        <div className="chart-title text-lg font-semibold text-foreground">Contracted demand vs Max demand (MDI) — Monthly</div>
        <div className="chart-sub text-sm text-foreground-secondary mt-1">kVA · Apr 2024 – Mar 2025</div>
        <div style={{ position: 'relative', width: '100%', height: '260px', marginTop: '16px' }}>
          <canvas ref={edMainRef}></canvas>
        </div>
      </div>

      <div className="chart-card px-6 py-6 mb-6">
        <div className="chart-title text-lg font-semibold text-foreground">Excess demand charges</div>
        <div className="chart-sub text-sm text-foreground-secondary mt-1">₹ penalty billed when MDI exceeds contracted demand</div>
        <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '16px' }}>
          <canvas ref={edExcessRef}></canvas>
        </div>
      </div>

      <div className="sec-label">Insights</div>
      <div className="kpi-grid grid grid-cols-4 gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
        {kpis.map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
      </div>

      {/* State breakdown table */}
      <div className="chart-card" id="lk-breakdownCard">
        <div className="chart-title" id="lk-breakdownTitle">State breakdown — all states</div>
        <div className="chart-sub" style={{ cursor: 'default' }}>Click a row to drill down</div>
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table className="breakdown-table">
            <thead>
              <tr>
                {breakdownCols.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map((r, i) => (
                <tr
                  key={i}
                  className={r.level !== 'ca' ? 'drillable' : ''}
                  onClick={() => r.level !== 'ca' ? handleDrillDown(r) : undefined}
                >
                  <td style={{ fontWeight: 500 }}>
                    {r.level !== 'ca' ? <span style={{ color: '#185FA5' }}>{r.name}</span> : r.name}
                  </td>
                  <td>{r.contracted} kVA</td>
                  <td style={{ color: r.mdi > r.contracted ? '#A32D2D' : '#3B6D11', fontWeight: 500 }}>{r.mdi} kVA</td>
                  <td>{r.over}</td>
                  <td>{inr(r.totalLeak)}</td>
                  <td>
                    <span className={`badge ${r.util > 110 ? 'over' : r.util > 100 ? 'warn' : 'ok'}`}>
                      {r.util > 110 ? 'Over' : r.util > 100 ? 'Near limit' : 'OK'}
                    </span>
                    <div className="bar-bg">
                      <div className="bar-f" style={{
                        width: `${Math.min(r.util, 130)}%`,
                        background: r.util > 110 ? '#E24B4A' : r.util > 100 ? '#EF9F27' : '#1D9E75'
                      }} />
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
