'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/lib/chartSetup';
import { Chart } from 'chart.js';
import { getFilteredBills, inr, getStateBills, STATES, BRANCHES, CAS, getBranchBills, getCABills } from '@/lib/calculations';
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

interface ExcessDemandSectionProps {
  appState: {
    view: string;
    stateF: string;
    branchF: string;
    caF: string;
    billCategory: string;
    section: string;
  };
}

export default function ExcessDemandSection({ appState }: ExcessDemandSectionProps) {
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
  const [chartMeta, setChartMeta] = useState({
    scopeLabel: 'All states',
    granularityLabel: 'Monthly',
    dateRangeLabel: 'Apr 2024 – Mar 2025',
  });

  useEffect(() => {
    renderExcessDemand();

    return () => {
      if (edMainInstance.current) edMainInstance.current.destroy();
      if (edExcessInstance.current) edExcessInstance.current.destroy();
    };
  }, [appState.stateF, appState.branchF, appState.caF, appState.view]);

  const handleDrillDown = (r: BreakdownRow) => {
    // No-op for now - filter state would be passed as props from parent
  };

  function getScopeLabel(stateF: string, branchF: string, caF: string): string {
    if (caF && caF !== 'all') return `CA: ${caF}`;
    if (branchF && branchF !== 'all') return `Branch: ${branchF}`;
    if (stateF && stateF !== 'all') return `State: ${stateF}`;
    return 'All states';
  }

  function getGranularityLabel(view: string): string {
    return view === '1y' || view === 'yearly' ? 'Yearly' : 'Monthly';
  }

  function getDateRangeLabel(view: string): string {
    return view === '1y' || view === 'yearly' ? 'FY22 – FY25' : 'Apr 2024 – Mar 2025';
  }

  const renderExcessDemand = () => {
    const view = appState.view === '1y' || appState.view === 'yearly' ? 'yearly' : 'monthly';
    const data = getFilteredBills(view, appState.stateF, appState.branchF, appState.caF);
    const labels = data.map(d => d.label);

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

    setChartMeta({
      scopeLabel: getScopeLabel(appState.stateF, appState.branchF, appState.caF),
      granularityLabel: getGranularityLabel(view),
      dateRangeLabel: getDateRangeLabel(view),
    });

    setKpis([
      { variant: overPct === 100 ? 'danger' : overPct >= 75 ? 'warn' : overPct >= 50 ? 'warn' : 'good', label: 'Consistently over-contracted', value: `${overPct}%`, desc: overPct === 100 ? 'Every single month in FY2024-25 exceeded the contracted level — the contract is structurally under-sized.' : `${overN} of ${data.length} periods exceeded` },
      { variant: recommended > avgCont ? 'warn' : 'good', label: 'Recommended contract revision', value: `${recommended} kVA`, desc: 'Revise to P90 of MDI readings (+15% buffer). Eliminates excess charges and covers most peak months.' },
      { variant: netSavings > 0 ? 'info' : 'warn', label: 'Estimated annual savings', value: `${netSavings > 0 ? '' : '−'}₹${(Math.abs(netSavings) / 100000).toFixed(1)}L`, desc: 'Net benefit after accounting for higher contracted demand tariff at revised level.' },
      { variant: utilEff >= 85 ? 'good' : utilEff >= 70 ? 'warn' : 'danger', label: 'Utilisation efficiency', value: `${utilEff}%`, desc: 'Avg MDI / Peak MDI — demand profile is consistent; contract revision is low-risk.' },
    ]);

    // Update breakdown table based on filter level
    if (appState.caF && appState.caF !== 'all') {
      // CA level — show monthly breakdown for this CA
      setBreakdownCols(['Month', 'Contracted', 'Avg MDI', 'Over contracted', 'Excess charges', 'Status']);
      const bills = getCABills(appState.caF, 'monthly');
      setBreakdownRows(bills.map(b => ({
        name: b.label,
        contracted: b.contracted,
        mdi: b.mdi,
        over: b.mdi > b.contracted ? 1 : 0,
        totalLeak: b.excessCharge,
        util: Math.round(b.mdi / b.contracted * 100),
        level: 'ca' as const,
      })));
    } else if (appState.branchF && appState.branchF !== 'all') {
      // Branch level — show CAs in this branch
      setBreakdownCols(['CA Number', 'Contracted', 'Avg MDI', 'Over periods', 'Total excess', 'Status']);
      const cas = CAS[appState.branchF] ?? [];
      setBreakdownRows(cas.map(ca => {
        const d = getCABills(ca, 'monthly');
        const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length);
        const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length);
        const over = d.filter(r => r.mdi > r.contracted).length;
        const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0);
        const util = Math.round(avgMDI / contracted * 100);
        return { name: ca, contracted, mdi: avgMDI, over, totalLeak, util, level: 'ca' as const };
      }));
    } else if (appState.stateF && appState.stateF !== 'all') {
      // State level — show branches in this state
      setBreakdownCols(['Branch', 'Contracted', 'Avg MDI', 'Over periods', 'Total excess', 'Status']);
      const branches = BRANCHES[appState.stateF] ?? [];
      setBreakdownRows(branches.map(br => {
        const d = getBranchBills(br, 'monthly');
        const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length);
        const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length);
        const over = d.filter(r => r.mdi > r.contracted).length;
        const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0);
        const util = Math.round(avgMDI / contracted * 100);
        return { name: br, contracted, mdi: avgMDI, over, totalLeak, util, level: 'branch' as const };
      }));
    } else {
      // All states — show states
      setBreakdownCols(['State', 'Contracted', 'Avg MDI', 'Excess periods', 'Total leakage', 'Status']);
      setBreakdownRows(
        STATES.map(st => {
          const d = getStateBills(st, view);
          const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length);
          const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length);
          const over = d.filter(r => r.mdi > r.contracted).length;
          const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0);
          const util = Math.round(avgMDI / contracted * 100);
          return { name: st, contracted, mdi: avgMDI, over, totalLeak, util, level: 'state' as const };
        }).sort((a, b) => b.totalLeak - a.totalLeak)
      );
    }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '20px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px' }}>
        <SummaryCard label="Contracted demand" value={`${edMetrics.avgCont} kVA`} sub="Current level" subColor="#185FA5" borderColor="#2500D7" />
        <SummaryCard label="Avg max demand (MDI)" value={`${edMetrics.avgMDI} kVA`} sub={edMetrics.avgMDI > edMetrics.avgCont ? 'Over contract' : 'within contract'} subColor={edMetrics.avgMDI > edMetrics.avgCont ? '#A32D2D' : '#3B6D11'} borderColor="#2500D7" />
        <SummaryCard label="Peak recorded" value={`${edMetrics.peakMDI} kVA`} sub="Aug 2024" subColor="#A32D2D" borderColor="#2500D7" />
        <SummaryCard label="Excess charges (YTD)" value={inr(edMetrics.totalExcess)} sub={`${edMetrics.overN} of 12 months billed`} subColor={edMetrics.overPct > 50 ? '#A32D2D' : '#633806'} borderColor="#2500D7" />
      </div>

      <div className="chart-card px-6 py-6 mb-6">
        <div className="chart-title text-lg font-semibold text-foreground">Contracted demand vs Max demand (MDI) — {chartMeta.granularityLabel}</div>
        <div className="chart-sub text-sm text-foreground-secondary mt-1">kVA · {chartMeta.dateRangeLabel} · {chartMeta.scopeLabel}</div>
        <div style={{ position: 'relative', width: '100%', height: '260px', marginTop: '16px' }}>
          <canvas ref={edMainRef}></canvas>
        </div>
      </div>

      <div className="chart-card px-6 py-6 mb-6">
        <div className="chart-title text-lg font-semibold text-foreground">Excess demand charges — {chartMeta.granularityLabel} (₹)</div>
        <div className="chart-sub text-sm text-foreground-secondary mt-1">Penalty billed when MDI exceeds contracted demand · {chartMeta.scopeLabel}</div>
        <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '16px' }}>
          <canvas ref={edExcessRef}></canvas>
        </div>
      </div>

      <div className="sec-label">Insights</div>
      <div className="kpi-grid grid grid-cols-4 gap-4 px-6 py-4" style={{ marginBottom: '1.25rem' }}>
        {kpis.map((kpi, i) => <KpiCard key={i} variant={kpi.variant} label={kpi.label} value={kpi.value} desc={kpi.desc} />)}
      </div>

      {/* Breakdown table */}
      <div className="chart-card" id="lk-breakdownCard">
        <div className="chart-title" id="lk-breakdownTitle">
          {appState.stateF && appState.stateF !== 'all'
            ? appState.branchF && appState.branchF !== 'all'
              ? `Branch breakdown — ${appState.branchF}`
              : `Branch breakdown — ${appState.stateF}`
            : 'State breakdown — all states'}
        </div>
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
