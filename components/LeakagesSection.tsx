'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, inrK, STATES, BRANCHES, CAS, getCABills, getBranchBills, getStateBills } from '@/lib/calculations';
import { MetricCard } from './MetricCard';
import { KpiCard } from './KpiCard';

interface LeakageMetric {
  label: string;
  value: string;
  sub: string;
  subColor: string;
}

interface LeakageKPI {
  variant: 'danger' | 'warn' | 'good' | 'info';
  label: string;
  value: string;
  desc: string;
}

type BreakdownRow = {
  name: string;
  contracted: number;
  mdi: number;
  over: number;
  totalLeak: number;
  util: number;
  level: 'state' | 'branch' | 'ca';
};

export default function LeakagesSection() {
  const stackChartRef = useRef<HTMLCanvasElement>(null);
  const pctChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  const edMainRef = useRef<HTMLCanvasElement>(null);
  const edExcessRef = useRef<HTMLCanvasElement>(null);

  const stackChartInstance = useRef<Chart | null>(null);
  const pctChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);
  const edMainInstance = useRef<Chart | null>(null);
  const edExcessInstance = useRef<Chart | null>(null);

  const [activeSubSection, setActiveSubSection] = useState<'excess' | 'overview'>('excess');
  
  const [metrics, setMetrics] = useState<LeakageMetric[]>([]);
  const [kpis, setKpis] = useState<LeakageKPI[]>([]);
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
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownCols, setBreakdownCols] = useState<string[]>([]);

  useEffect(() => {
    renderLeakages();

    return () => {
      if (stackChartInstance.current) stackChartInstance.current.destroy();
      if (pctChartInstance.current) pctChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
      if (edMainInstance.current) edMainInstance.current.destroy();
      if (edExcessInstance.current) edExcessInstance.current.destroy();
    };
  }, [activeSubSection]);

  const handleDrillDown = (r: BreakdownRow) => {
    // No-op for now - filter state would be passed as props from parent
    // This is a placeholder for the drill down functionality
  };

  const renderLeakages = () => {
    const data = getFilteredBills('yearly', 'all', 'all', 'all');
    const labels = data.map((d) => d.label);

    const totalExcess = data.reduce((a, d) => a + d.excessCharge, 0);
    const totalPF = data.reduce((a, d) => a + d.pfPenalty, 0);
    const totalTOD = data.reduce((a, d) => a + d.todViolation, 0);
    const totalLV = data.reduce((a, d) => a + d.lvSurcharge, 0);
    const totalLP = data.reduce((a, d) => a + d.latePayment, 0);
    const totalLeak = totalExcess + totalPF + totalTOD + totalLV + totalLP;
    const totalBill = data.reduce((a, d) => a + d.totalBill, 0);

    const leakPct = Math.round((totalLeak / totalBill) * 100);
    const periodsWithLeak = data.filter((d) => d.totalLeakage > 0).length;

    // Excess demand calculations
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

    // Chart initialization based on activeSubSection
    if (activeSubSection === 'overview') {
      initOverviewCharts(labels, data, totalExcess, totalPF, totalTOD, totalLV, totalLP, leakPct);
    } else {
      initExcessCharts(labels, data);
    }

    setMetrics([
      { label: activeSubSection === 'overview' ? 'Total leakages' : 'Avg contracted', value: activeSubSection === 'overview' ? inr(totalLeak) : `${avgCont} kVA`, sub: activeSubSection === 'overview' ? 'across all charges' : 'current level', subColor: activeSubSection === 'overview' ? '#A32D2D' : '#185FA5' },
    ]);

    setKpis(activeSubSection === 'overview' ? [
      { variant: leakPct > 20 ? 'danger' : leakPct > 10 ? 'warn' : 'good', label: 'Leakage ratio', value: `${leakPct}%`, desc: `${inrK(totalLeak)} penalties out of ${inrK(totalBill)} bill` },
      { variant: 'warn', label: 'Biggest leakage driver', value: totalExcess > totalPF ? 'Excess demand' : 'Power factor', desc: totalExcess > totalPF ? `₹${inrK(totalExcess)} excess charges` : `₹${inrK(totalPF)} PF penalty` },
      { variant: 'info', label: 'Frequency', value: `${periodsWithLeak}/${data.length}`, desc: `${Math.round(periodsWithLeak/data.length*100)}% periods had charges` },
      { variant: 'info', label: 'Avg leakage per period', value: inr(totalLeak / data.length), desc: `Avg charge per billing period` },
    ] : [
      { variant: overPct === 100 ? 'danger' : overPct >= 75 ? 'warn' : overPct >= 50 ? 'warn' : 'good', label: 'Consistently over-contracted', value: `${overPct}%`, desc: overPct === 100 ? 'Every period exceeded' : `${overN} of ${data.length} periods exceeded` },
      { variant: recommended > avgCont ? 'warn' : 'good', label: 'Recommended contract', value: `${recommended} kVA`, desc: recommended > avgCont ? `P90 MDI + 10% (currently ${avgCont})` : 'Contract above P90' },
      { variant: netSavings > 0 ? 'info' : 'warn', label: 'Est. annual savings', value: `${netSavings > 0 ? '' : '−'}₹${(Math.abs(netSavings)/100000).toFixed(1)}L`, desc: netSavings > 0 ? 'Net benefit after revision' : 'Tariff may offset savings' },
      { variant: utilEff >= 85 ? 'good' : utilEff >= 70 ? 'warn' : 'danger', label: 'Utilisation efficiency', value: `${utilEff}%`, desc: utilEff >= 85 ? 'Low risk revision' : 'Check demand variability' },
    ]);
  };

  const initOverviewCharts = (labels: string[], data: any, totalExcess: number, totalPF: number, totalTOD: number, totalLV: number, totalLP: number, leakPct: number) => {
    // Stack chart
    if (stackChartRef.current) {
      const ctx = stackChartRef.current.getContext('2d');
      if (ctx) {
        if (stackChartInstance.current) stackChartInstance.current.destroy();
        stackChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { data: data.map((d: any) => d.excessCharge), backgroundColor: '#E24B4A', label: 'Excess demand' },
              { data: data.map((d: any) => d.pfPenalty), backgroundColor: '#EF9F27', label: 'PF penalty' },
              { data: data.map((d: any) => d.todViolation), backgroundColor: '#7F77DD', label: 'TOD' },
              { data: data.map((d: any) => d.lvSurcharge), backgroundColor: '#D85A30', label: 'LV' },
              { data: data.map((d: any) => d.latePayment), backgroundColor: '#888780', label: 'Late payment' },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            plugins: { legend: { display: false } },
            scales: { x: { stacked: true }, y: { stacked: true } },
          },
        });
      }
    }

    // Percentage bar chart
    if (pctChartRef.current) {
      const ctx = pctChartRef.current.getContext('2d');
      if (ctx) {
        if (pctChartInstance.current) pctChartInstance.current.destroy();
        pctChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: data.map((d: any) => Math.round(d.totalLeakage / d.totalBill * 100)),
              backgroundColor: data.map((d: any) => {
                const p = Math.round(d.totalLeakage / d.totalBill * 100);
                return p > 20 ? '#E24B4A' : p > 10 ? '#EF9F27' : '#1D9E75';
              }),
            }]
          },
          options: {
            indexAxis: 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { max: 100 } },
          },
        });
      }
    }

    // Donut chart
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
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
        });
      }
    }
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
      {/* Sub-nav pills */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        background: '#f5f5f4',
        borderRadius: '8px',
        width: 'fit-content',
        marginBottom: '1.25rem',
        border: '0.5px solid rgba(0,0,0,0.15)'
      }}>
        <button
          onClick={() => setActiveSubSection('excess')}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeSubSection === 'excess' ? 500 : 400,
            background: activeSubSection === 'excess' ? '#ffffff' : 'transparent',
            border: activeSubSection === 'excess' ? '0.5px solid rgba(0,0,0,0.15)' : 'none',
            color: activeSubSection === 'excess' ? '#1a1a18' : '#6b6b67',
            cursor: 'pointer'
          }}
        >
          Excess demand
        </button>
        <button
          onClick={() => setActiveSubSection('overview')}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeSubSection === 'overview' ? 500 : 400,
            background: activeSubSection === 'overview' ? '#ffffff' : 'transparent',
            border: activeSubSection === 'overview' ? '0.5px solid rgba(0,0,0,0.15)' : 'none',
            color: activeSubSection === 'overview' ? '#1a1a18' : '#6b6b67',
            cursor: 'pointer'
          }}
        >
          Leakages overview
        </button>
      </div>

      {activeSubSection === 'excess' ? (
        <>
          {/* Excess Demand Section */}
          <div className="metrics flex flex-wrap gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
            <MetricCard label="Avg contracted" value={`${edMetrics.avgCont} kVA`} sub="current level" subColor="#185FA5" />
            <MetricCard label="Avg MDI" value={`${edMetrics.avgMDI} kVA`} sub={edMetrics.avgMDI > edMetrics.avgCont ? `+${Math.round((edMetrics.avgMDI/edMetrics.avgCont-1)*100)}% over` : 'within contract'} subColor={edMetrics.avgMDI > edMetrics.avgCont ? '#A32D2D' : '#3B6D11'} />
            <MetricCard label="Peak MDI" value={`${edMetrics.peakMDI} kVA`} sub="highest recorded" subColor="#A32D2D" />
            <MetricCard label="Total excess charges" value={inr(edMetrics.totalExcess)} sub={`${edMetrics.overPct}% periods exceeded`} subColor={edMetrics.overPct > 50 ? '#A32D2D' : '#633806'} />
          </div>

          <div className="chart-card px-6 py-6 mb-6">
            <div className="chart-title text-lg font-semibold text-foreground">Contracted vs Max demand</div>
            <div className="chart-sub text-sm text-foreground-secondary mt-1">kVA · contracted demand vs actual MDI per period</div>
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
            {kpis.slice(0, 4).map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
          </div>
        </>
      ) : (
        <>
          {/* Leakages Overview Section */}
          <div className="metrics flex flex-wrap gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
            <MetricCard label="Total leakages" value={inr(edMetrics.totalExcess + edMetrics.avgMDI)} sub="across all charges" subColor="#A32D2D" />
            <MetricCard label="Excess demand (₹)" value={inr(edMetrics.totalExcess)} sub="demand charges" subColor="#E24B4A" />
            <MetricCard label="PF penalty" value={inr(edMetrics.avgMDI)} sub="power factor" subColor="#EF9F27" />
            <MetricCard label="Periods with leakage" value={`${edMetrics.overN}/${Math.round(edMetrics.totalExcess / 1500)}`} sub="billing cycles" subColor="#185FA5" />
          </div>

          <div className="chart-card px-6 py-6 mb-6">
            <div className="chart-title text-lg font-semibold text-foreground">Total leakage charges by type</div>
            <div className="chart-sub text-sm text-foreground-secondary mt-1">₹ · stacked charges across the period</div>
            <div style={{ position: 'relative', width: '100%', height: '260px', marginTop: '16px' }}>
              <canvas ref={stackChartRef}></canvas>
            </div>
          </div>

          <div className="two-col grid grid-cols-2 gap-6 px-6 mb-6">
            <div className="chart-card py-6">
              <div className="chart-title text-lg font-semibold text-foreground">Leakage as % of total bill</div>
              <div className="chart-sub text-sm text-foreground-secondary mt-1">Penalty charges ÷ total bill amount × 100</div>
              <div style={{ height: '200px', marginTop: '16px' }}>
                <canvas ref={pctChartRef}></canvas>
              </div>
            </div>
            <div className="chart-card py-6">
              <div className="chart-title text-lg font-semibold text-foreground">Leakage type breakdown</div>
              <div className="chart-sub text-sm text-foreground-secondary mt-1">Share of total penalties across the period</div>
              <div style={{ height: '200px', marginTop: '16px' }}>
                <canvas ref={donutChartRef}></canvas>
              </div>
            </div>
          </div>

          <div className="sec-label">Insights</div>
          <div className="kpi-grid grid grid-cols-4 gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
            {kpis.map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
          </div>
        </>
      )}

      {/* State breakdown table (shared) */}
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
                    {r.level !== 'ca'
                      ? <span style={{ color: '#185FA5' }}>{r.name}</span>
                      : r.name}
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
