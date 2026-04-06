'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, inrK, STATES, getStateBills } from '@/lib/calculations';
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

export default function LeakagesSection() {
  const stackChartRef = useRef<HTMLCanvasElement>(null);
  const pctChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  const stackChartInstance = useRef<Chart | null>(null);
  const pctChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  const [kpis, setKpis] = useState<any[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownCols, setBreakdownCols] = useState<string[]>([]);

  useEffect(() => {
    renderLeakages();

    return () => {
      if (stackChartInstance.current) stackChartInstance.current.destroy();
      if (pctChartInstance.current) pctChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
    };
  }, []);

  const handleDrillDown = (r: BreakdownRow) => {
    // No-op for now - filter state would be passed as props from parent
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

    setKpis([
      { variant: leakPct > 20 ? 'danger' : leakPct > 10 ? 'warn' : 'good', label: 'Leakage ratio', value: `${leakPct}%`, desc: `${inrK(totalLeak)} penalties out of ${inrK(totalBill)} bill` },
      { variant: 'warn', label: 'Biggest leakage driver', value: totalExcess > totalPF ? 'Excess demand' : 'Power factor', desc: totalExcess > totalPF ? `₹${inrK(totalExcess)} excess charges` : `₹${inrK(totalPF)} PF penalty` },
      { variant: 'info', label: 'Frequency', value: `${periodsWithLeak}/${data.length}`, desc: `${Math.round(periodsWithLeak/data.length*100)}% periods had charges` },
      { variant: 'info', label: 'Avg leakage per period', value: inr(totalLeak / data.length), desc: `Avg charge per billing period` },
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

    initLeakageCharts(labels, data, totalExcess, totalPF, totalTOD, totalLV, totalLP, leakPct);
  };

  const initLeakageCharts = (labels: string[], data: any, totalExcess: number, totalPF: number, totalTOD: number, totalLV: number, totalLP: number, leakPct: number) => {
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

  return (
    <div>
      {/* Leakages Overview Metrics */}
      <div className="metrics grid grid-cols-4 gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
        <MetricCard label="Total leakages" value={inr(0)} sub="across all charges" subColor="#A32D2D" />
        <MetricCard label="Excess demand (₹)" value={inr(0)} sub="demand charges" subColor="#E24B4A" />
        <MetricCard label="PF penalty" value={inr(0)} sub="power factor" subColor="#EF9F27" />
        <MetricCard label="Periods with leakage" value="0/0" sub="billing cycles" subColor="#185FA5" />
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
