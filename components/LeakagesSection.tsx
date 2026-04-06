'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, inrK } from '@/lib/calculations';

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

export default function LeakagesSection() {
  const stackChartRef = useRef<HTMLCanvasElement>(null);
  const pctChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  const stackChartInstance = useRef<Chart | null>(null);
  const pctChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  const [metrics, setMetrics] = useState<LeakageMetric[]>([]);
  const [kpis, setKpis] = useState<LeakageKPI[]>([]);

  useEffect(() => {
    renderLeakages();

    return () => {
      if (stackChartInstance.current) stackChartInstance.current.destroy();
      if (pctChartInstance.current) pctChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
    };
  }, []);

  const renderLeakages = () => {
    console.log('[v0] renderLeakages called');
    const data = getFilteredBills('yearly', 'all', 'all', 'all');
    console.log('[v0] filtered bills:', data.length, data.slice(0, 2));
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

    // Metric cards
    const newMetrics: LeakageMetric[] = [
      {
        label: 'Total leakages',
        value: inr(totalLeak),
        sub: leakPct + '% of total bill',
        subColor: '#A32D2D',
      },
      {
        label: 'Excess demand',
        value: inr(totalExcess),
        sub: Math.round((totalExcess / totalLeak) * 100) + '% of leakages',
        subColor: '#A32D2D',
      },
      {
        label: 'PF penalty',
        value: inr(totalPF),
        sub: Math.round((totalPF / totalLeak) * 100) + '% of leakages',
        subColor: '#854F0B',
      },
      {
        label: 'Periods with leakage',
        value: periodsWithLeak + '/' + data.length,
        sub: Math.round((periodsWithLeak / data.length) * 100) + '% occurrence',
        subColor: periodsWithLeak === data.length ? '#A32D2D' : '#854F0B',
      },
    ];
    setMetrics(newMetrics);

    // Chart 1 — Stack chart
    if (stackChartRef.current) {
      const ctx = stackChartRef.current.getContext('2d');
      if (ctx) {
        if (stackChartInstance.current) stackChartInstance.current.destroy();

        stackChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Excess demand',
                data: data.map((d) => d.excessCharge),
                backgroundColor: '#E24B4A',
                stack: 's',
              },
              {
                label: 'PF penalty',
                data: data.map((d) => d.pfPenalty),
                backgroundColor: '#EF9F27',
                stack: 's',
              },
              {
                label: 'TOD violation',
                data: data.map((d) => d.todViolation),
                backgroundColor: '#7F77DD',
                stack: 's',
              },
              {
                label: 'LV surcharge',
                data: data.map((d) => d.lvSurcharge),
                backgroundColor: '#D85A30',
                stack: 's',
              },
              {
                label: 'Late payment',
                data: data.map((d) => d.latePayment),
                backgroundColor: '#888780',
                stack: 's',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                stacked: true,
                ticks: {
                  callback: (v) => '₹' + ((v as number) / 1000).toFixed(0) + 'K',
                },
              },
            },
          },
        });
      }
    }

    // Chart 2 — Percentage chart
    if (pctChartRef.current) {
      const ctx = pctChartRef.current.getContext('2d');
      if (ctx) {
        if (pctChartInstance.current) pctChartInstance.current.destroy();

        const pctData = data.map((d) => Math.round((d.totalLeakage / d.totalBill) * 100));
        const pctColors = pctData.map((pct) => {
          if (pct > 15) return '#E24B4A';
          if (pct > 8) return '#EF9F27';
          return '#1D9E75';
        });

        pctChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Leakage %',
                data: pctData,
                backgroundColor: pctColors,
                borderRadius: 3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                ticks: {
                  callback: (v) => (v as number) + '%',
                },
              },
            },
          },
        });
      }
    }

    // Chart 3 — Donut chart
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      if (ctx) {
        if (donutChartInstance.current) donutChartInstance.current.destroy();

        donutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: [
              'Excess demand',
              'PF penalty',
              'TOD violation',
              'LV surcharge',
              'Late payment',
            ],
            datasets: [
              {
                data: [totalExcess, totalPF, totalTOD, totalLV, totalLP],
                backgroundColor: ['#E24B4A', '#EF9F27', '#7F77DD', '#D85A30', '#888780'],
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  font: { size: 11 },
                  boxWidth: 10,
                  padding: 8,
                },
              },
            },
          },
        });
      }
    }

    // KPI cards
    const worstType = (() => {
      const types = [
        { name: 'Excess demand', val: totalExcess },
        { name: 'PF penalty', val: totalPF },
        { name: 'TOD violation', val: totalTOD },
        { name: 'LV surcharge', val: totalLV },
        { name: 'Late payment', val: totalLP },
      ];
      return types.reduce((a, b) => (a.val > b.val ? a : b)).name;
    })();

    const newKpis: LeakageKPI[] = [
      {
        variant: leakPct > 15 ? 'danger' : leakPct > 8 ? 'warn' : 'good',
        label: 'Leakage ratio',
        value: leakPct + '%',
        desc:
          (leakPct > 15
            ? 'critical — immediate action needed'
            : leakPct > 8
              ? 'elevated — review contracts'
              : 'within acceptable range') + ' · Total penalties ÷ total bill',
      },
      {
        variant: 'danger',
        label: 'Biggest leakage driver',
        value: worstType,
        desc: inr(Math.max(totalExcess, totalPF, totalTOD, totalLV, totalLP)) + ' — highest single penalty category',
      },
      {
        variant: periodsWithLeak === data.length ? 'danger' : 'warn',
        label: 'Frequency',
        value: Math.round((periodsWithLeak / data.length) * 100) + '%',
        desc: periodsWithLeak + ' of ' + data.length + ' periods had avoidable charges',
      },
      {
        variant: 'info',
        label: 'Avg leakage per period',
        value: inrK(Math.round(totalLeak / data.length)),
        desc: 'Mean avoidable cost per billing cycle',
      },
    ];
    setKpis(newKpis);
  };

  return (
    <div className="w-full">
      {/* Summary Section */}
      <div className="sec-label">Summary</div>
      <div className="metrics flex flex-wrap gap-4 px-6 py-4">
        {metrics.map((m, i) => (
          <div key={i} className="flex-1 min-w-64">
            <div className="text-sm font-medium text-foreground">{m.label}</div>
            <div className="text-2xl font-bold text-foreground mt-2">{m.value}</div>
            <div className="text-xs mt-1" style={{ color: m.subColor }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main Stack Chart */}
      <div className="chart-card px-6 py-6 mb-6">
        <div className="chart-title text-lg font-semibold text-foreground">
          Total leakage charges by type
        </div>
        <div className="chart-sub text-sm text-foreground-secondary mt-1">
          Stacked view of all avoidable penalty charges (₹)
        </div>
        <div className="legend flex flex-wrap gap-4 mt-4">
          <span className="flex items-center gap-2 text-sm">
            <span className="ld w-3 h-3 rounded" style={{ backgroundColor: '#E24B4A' }}></span>
            Excess demand
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="ld w-3 h-3 rounded" style={{ backgroundColor: '#EF9F27' }}></span>
            Power factor penalty
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="ld w-3 h-3 rounded" style={{ backgroundColor: '#7F77DD' }}></span>
            TOD violation
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="ld w-3 h-3 rounded" style={{ backgroundColor: '#D85A30' }}></span>
            Low voltage surcharge
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="ld w-3 h-3 rounded" style={{ backgroundColor: '#888780' }}></span>
            Late payment
          </span>
        </div>
        <div style={{ height: '260px', marginTop: '16px' }}>
          <canvas ref={stackChartRef}></canvas>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="two-col grid grid-cols-2 gap-6 px-6 mb-6">
        <div className="chart-card py-6">
          <div className="chart-title text-lg font-semibold text-foreground">
            Leakage as % of total bill
          </div>
          <div className="chart-sub text-sm text-foreground-secondary mt-1">
            Penalty charges ÷ total bill amount × 100
          </div>
          <div style={{ height: '200px', marginTop: '16px' }}>
            <canvas ref={pctChartRef}></canvas>
          </div>
        </div>
        <div className="chart-card py-6">
          <div className="chart-title text-lg font-semibold text-foreground">
            Leakage type breakdown
          </div>
          <div className="chart-sub text-sm text-foreground-secondary mt-1">
            Share of total penalties across the period
          </div>
          <div style={{ height: '200px', marginTop: '16px' }}>
            <canvas ref={donutChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="sec-label">Insights</div>
      <div className="kpi-grid grid grid-cols-4 gap-4 px-6 py-4">
        {kpis.map((kpi, i) => {
          const variantStyles = {
            danger: {
              card: 'bg-[#FCEBEB]',
              borderColor: '#F7C1C1',
              label: 'text-[#791F1F]',
              value: 'text-[#A32D2D]',
              desc: 'text-[#791F1F]',
            },
            warn: {
              card: 'bg-[#FAEEDA]',
              borderColor: '#FAC775',
              label: 'text-[#633806]',
              value: 'text-[#854F0B]',
              desc: 'text-[#633806]',
            },
            good: {
              card: 'bg-[#EAF3DE]',
              borderColor: '#C0DD97',
              label: 'text-[#27500A]',
              value: 'text-[#3B6D11]',
              desc: 'text-[#27500A]',
            },
            info: {
              card: 'bg-[#E6F1FB]',
              borderColor: '#B5D4F4',
              label: 'text-[#0C447C]',
              value: 'text-[#185FA5]',
              desc: 'text-[#0C447C]',
            },
          };
          const style = variantStyles[kpi.variant];

          return (
            <div
              key={i}
              className={`kpi-card ${style.card} border rounded-lg p-3.5`}
              style={{
                borderColor: style.borderColor,
                borderWidth: '0.5px',
              }}
            >
              <div className={`kpi-label text-xs font-medium uppercase tracking-wide ${style.label}`}>{kpi.label}</div>
              <div className={`kpi-value text-2xl font-medium mt-1.5 ${style.value}`}>
                {kpi.value}
              </div>
              <div className={`kpi-desc text-xs mt-1 ${style.desc}`}>{kpi.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
