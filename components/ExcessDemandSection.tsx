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

  const [edMetrics, setEdMetrics] = useState({ avgCont: 0, avgMDI: 0, peakMDI: 0, overN: 0, overPct: 0, recommended: 0, netSavings: 0, utilEff: 0, totalExcess: 0 });
  const [kpis, setKpis] = useState<any[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownCols, setBreakdownCols] = useState<string[]>([]);
  const [chartMeta, setChartMeta] = useState({ scopeLabel: 'All states', granularityLabel: 'Monthly', dateRangeLabel: 'Apr 2024 – Mar 2025' });
  const [stateMetric, setStateMetric] = useState<'totalLeak' | 'over' | 'util'>('totalLeak');

  useEffect(() => {
    renderExcessDemand();
    return () => {
      if (edMainInstance.current) edMainInstance.current.destroy();
      if (edExcessInstance.current) edExcessInstance.current.destroy();
    };
  }, [appState.stateF, appState.branchF, appState.caF, appState.view]);

  const handleDrillDown = (r: BreakdownRow) => {};

  function getScopeLabel(stateF: string, branchF: string, caF: string): string {
    if (caF && caF !== 'all') return `CA: ${caF}`;
    if (branchF && branchF !== 'all') return `Branch: ${branchF}`;
    if (stateF && stateF !== 'all') return `State: ${stateF}`;
    return 'All states';
  }

  const renderExcessDemand = () => {
    const data = getFilteredBills('monthly', appState.stateF, appState.branchF, appState.caF);
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
    const extraFixed = (recommended - avgCont) * avgDemandRate * 12;
    const netSavings = Math.round(totalExcess - extraFixed);
    const utilEff = Math.round(avgMDI / peakMDI * 100);

    setEdMetrics({ avgCont, avgMDI, peakMDI, overN, overPct, recommended, netSavings, utilEff, totalExcess });
    setChartMeta({ scopeLabel: getScopeLabel(appState.stateF, appState.branchF, appState.caF), granularityLabel: 'Monthly', dateRangeLabel: 'Apr 2024 – Mar 2025' });
    setKpis([
      { variant: overPct === 100 ? 'danger' : overPct >= 75 ? 'warn' : 'good', label: 'Consistently over-contracted', value: `${overPct}%`, desc: overPct === 100 ? 'Every single month exceeded the contracted level — structurally under-sized.' : `${overN} of ${data.length} periods exceeded` },
      { variant: recommended > avgCont ? 'warn' : 'good', label: 'Recommended contract revision', value: `${recommended} kVA`, desc: 'Revise to P90 of MDI readings (+10% buffer). Eliminates excess charges.' },
      { variant: netSavings > 0 ? 'info' : 'warn', label: 'Estimated annual savings', value: `${netSavings > 0 ? '' : '−'}₹${(Math.abs(netSavings) / 100000).toFixed(1)}L`, desc: 'Net benefit after accounting for higher contracted demand tariff at revised level.' },
      { variant: utilEff >= 85 ? 'good' : utilEff >= 70 ? 'warn' : 'danger', label: 'Utilisation efficiency', value: `${utilEff}%`, desc: 'Avg MDI / Peak MDI — demand profile is consistent; contract revision is low-risk.' },
    ]);

    if (appState.caF && appState.caF !== 'all') {
      setBreakdownCols(['Month', 'Contracted', 'Avg MDI', 'Over contracted', 'Excess charges', 'Status']);
      const bills = getCABills(appState.caF, 'monthly');
      setBreakdownRows(bills.map(b => ({ name: b.label, contracted: b.contracted, mdi: b.mdi, over: b.mdi > b.contracted ? 1 : 0, totalLeak: b.excessCharge, util: Math.round(b.mdi / b.contracted * 100), level: 'ca' as const })));
    } else if (appState.branchF && appState.branchF !== 'all') {
      setBreakdownCols(['CA Number', 'Contracted', 'Avg MDI', 'Over periods', 'Total excess', 'Status']);
      const cas = CAS[appState.branchF] ?? [];
      setBreakdownRows(cas.map(ca => { const d = getCABills(ca, 'monthly'); const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length); const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length); const over = d.filter(r => r.mdi > r.contracted).length; const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0); const util = Math.round(avgMDI / contracted * 100); return { name: ca, contracted, mdi: avgMDI, over, totalLeak, util, level: 'ca' as const }; }));
    } else if (appState.stateF && appState.stateF !== 'all') {
      setBreakdownCols(['Branch', 'Contracted', 'Avg MDI', 'Over periods', 'Total excess', 'Status']);
      const branches = BRANCHES[appState.stateF] ?? [];
      setBreakdownRows(branches.map(br => { const d = getBranchBills(br, 'monthly'); const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length); const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length); const over = d.filter(r => r.mdi > r.contracted).length; const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0); const util = Math.round(avgMDI / contracted * 100); return { name: br, contracted, mdi: avgMDI, over, totalLeak, util, level: 'branch' as const }; }));
    } else {
      setBreakdownCols(['State', 'Contracted', 'Avg MDI', 'Excess periods', 'Total leakage', 'Status']);
      setBreakdownRows(STATES.map(st => { const d = getStateBills(st, 'monthly'); const avgMDI = Math.round(d.reduce((a, r) => a + r.mdi, 0) / d.length); const contracted = Math.round(d.reduce((a, r) => a + r.contracted, 0) / d.length); const over = d.filter(r => r.mdi > r.contracted).length; const totalLeak = d.reduce((a, r) => a + r.excessCharge, 0); const util = Math.round(avgMDI / contracted * 100); return { name: st, contracted, mdi: avgMDI, over, totalLeak, util, level: 'state' as const }; }).sort((a, b) => b.totalLeak - a.totalLeak));
    }

    initExcessCharts(labels, data);
  };

  const initExcessCharts = (labels: string[], data: any) => {
    if (edMainRef.current) {
      const ctx = edMainRef.current.getContext('2d');
      if (ctx) {
        if (edMainInstance.current) edMainInstance.current.destroy();
        edMainInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'Actual MDI', data: data.map((d: any) => d.mdi), borderColor: '#e53935', backgroundColor: 'rgba(229,57,53,0.06)', borderWidth: 2.5, pointBackgroundColor: '#fff', pointBorderColor: '#e53935', pointBorderWidth: 2, pointRadius: 3.5, pointHoverRadius: 5, tension: 0.35, fill: false },
              { label: 'Contracted', data: data.map((d: any) => d.contracted), borderColor: '#1c5af4', borderWidth: 2, borderDash: [6, 3], pointRadius: 0, tension: 0, fill: false },
              { label: 'Recommended', data: data.map((d: any) => Math.round(d.contracted * 1.13)), borderColor: '#36b37e', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, tension: 0, fill: false },
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#192744', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.85)', padding: 10, cornerRadius: 6, callbacks: { label: (item: any) => { const labels = ['MDI', 'Contracted', 'Recommended']; return '  ' + labels[item.datasetIndex] + ': ' + item.raw + ' kVA'; } } } },
            scales: { x: { grid: { color: '#f0f1f5' }, border: { display: false }, ticks: { color: '#9aa0b0', font: { size: 11 } } }, y: { grid: { color: '#f0f1f5' }, border: { display: false }, ticks: { color: '#9aa0b0', font: { size: 11 }, callback: (v: any) => v + ' kVA' } } },
          },
        }) as any;
      }
    }
    if (edExcessRef.current) {
      const ctx = edExcessRef.current.getContext('2d');
      if (ctx) {
        if (edExcessInstance.current) edExcessInstance.current.destroy();
        const maxCharge = Math.max(...data.map((d: any) => d.excessCharge));
        edExcessInstance.current = new Chart(ctx, {
          type: 'bar',
          data: { labels, datasets: [{ data: data.map((d: any) => d.excessCharge), backgroundColor: data.map((d: any) => d.excessCharge === maxCharge ? '#e53935' : '#f07070'), borderRadius: 3 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#192744', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.85)', padding: 10, cornerRadius: 6, callbacks: { label: (item: any) => '  Charge: ₹' + (item.raw / 100000).toFixed(1) + 'L' } } },
            scales: { x: { grid: { color: '#f0f1f5' }, border: { display: false }, ticks: { color: '#9aa0b0', font: { size: 11 } } }, y: { grid: { color: '#f0f1f5' }, border: { display: false }, ticks: { color: '#9aa0b0', font: { size: 11 }, callback: (v: any) => '₹' + (Number(v) / 100000).toFixed(1) + 'L' } } },
          },
        });
      }
    }
  };

  return (
    <div style={{ background: '#f5f6fa', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #f0f1f5', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
        {([
          { label: 'Contracted demand',    value: edMetrics.avgCont + ' kVA', sub: 'Current level',                                                                       subColor: '#1c5af4' },
          { label: 'Avg max demand (MDI)', value: edMetrics.avgMDI + ' kVA',  sub: edMetrics.avgMDI > edMetrics.avgCont ? 'Over contract' : 'Within contract',            subColor: edMetrics.avgMDI > edMetrics.avgCont ? '#e53935' : '#36b37e' },
          { label: 'Peak recorded',        value: edMetrics.peakMDI + ' kVA', sub: 'Highest MDI this year',                                                               subColor: '#e53935' },
          { label: 'Excess charges (YTD)', value: inr(edMetrics.totalExcess), sub: edMetrics.overN + ' of 12 months billed',                                              subColor: edMetrics.overPct > 50 ? '#e53935' : '#f59e0b' },
        ] as Array<{ label: string; value: string; sub: string; subColor: string }>).map((k, i, arr) => (
          <div key={k.label} style={{ flex: 1, padding: '16px 20px', borderRight: i < arr.length - 1 ? '1px solid #f0f1f5' : 'none', position: 'relative' }}>
            {i > 0 && <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '1px', background: '#f0f1f5' }} />}
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#192744', lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: k.subColor, fontWeight: 500 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {([
          { color: '#e53935', bdColor: '#fecaca', label: 'Consistently over-contracted',  value: edMetrics.overPct + '%',                                                                                    sub: edMetrics.overN + ' / 12 months exceeded limit',  desc: edMetrics.overPct === 100 ? 'Every single month exceeded the contracted level — the contract is structurally under-sized.' : edMetrics.overN + ' of 12 periods exceeded contracted demand.', cta: 'View CAs' },
          { color: '#f59e0b', bdColor: '#fde68a', label: 'Recommended contract revision', value: edMetrics.recommended + ' kVA',                                                                             sub: 'P90 of MDI + 10% buffer',                         desc: 'Revising eliminates excess charges and covers most peak months.',                                                                                                                              cta: 'Model revision' },
          { color: '#36b37e', bdColor: '#bbf7d0', label: 'Estimated annual savings',      value: (edMetrics.netSavings > 0 ? '' : '−') + '₹' + (Math.abs(edMetrics.netSavings) / 100000).toFixed(1) + 'L', sub: 'net after higher tariff adjustment',               desc: 'Net benefit after accounting for higher contracted demand tariff at revised level.',                                                                                                           cta: 'See breakdown' },
          { color: '#1c5af4', bdColor: '#c7d2fe', label: 'Utilisation efficiency',        value: edMetrics.utilEff + '%',                                                                                    sub: 'Avg MDI / contracted kVA',                        desc: 'Demand profile is consistent — contract revision is low risk.',                                                                                                                               cta: 'View profile' },
        ] as Array<{ color: string; bdColor: string; label: string; value: string; sub: string; desc: string; cta: string }>).map((k, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f1f5', borderLeft: '3px solid ' + k.color, borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: k.color, flexShrink: 0 }} />
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9aa0b0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: k.color, opacity: 0.75, marginTop: '3px' }}>{k.sub}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', lineHeight: 1.5, flex: 1 }}>{k.desc}</div>
            <button style={{ alignSelf: 'flex-start', fontSize: '12px', fontWeight: 500, color: k.color, background: '#fff', border: '1px solid ' + k.bdColor, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>{k.cta} →</button>
          </div>
        ))}
      </div>

      {/* Contracted vs MDI chart */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Contracted demand vs Max demand (MDI)</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>kVA · {chartMeta.dateRangeLabel} · {chartMeta.scopeLabel}</div>
        </div>
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
            {([{ color: '#e53935', dash: false, label: 'Actual MDI' }, { color: '#1c5af4', dash: true, label: 'Contracted demand' }, { color: '#36b37e', dash: true, label: 'Recommended revision' }] as Array<{ color: string; dash: boolean; label: string }>).map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke={l.color} strokeWidth="2" strokeDasharray={l.dash ? '5 3' : 'none'}/></svg>
                <span style={{ fontSize: '11px', color: '#9aa0b0' }}>{l.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '10px', borderRadius: '2px', background: '#e53935', opacity: 0.2 }} />
              <span style={{ fontSize: '11px', color: '#9aa0b0' }}>Excess zone</span>
            </div>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '260px' }}>
            <canvas ref={edMainRef}></canvas>
          </div>
        </div>
      </div>

      {/* Excess charges bar chart */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>Excess demand charges</div>
          <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Monthly · ₹ · {chartMeta.scopeLabel}</div>
        </div>
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <canvas ref={edExcessRef}></canvas>
          </div>
        </div>
      </div>

      {/* State breakdown */}
      <div style={{ background: '#fff', border: '1px solid #f0f1f5', borderRadius: '6px', boxShadow: '0 1px 3px rgba(25,39,68,.04)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#192744' }}>
              {appState.stateF && appState.stateF !== 'all' ? appState.branchF && appState.branchF !== 'all' ? 'Branch breakdown — ' + appState.branchF : 'Branch breakdown — ' + appState.stateF : 'State breakdown — all states'}
            </div>
            <div style={{ fontSize: '12px', color: '#9aa0b0', marginTop: '2px' }}>Ranked by total excess · click to drill down</div>
          </div>
          <div style={{ display: 'flex', background: '#f5f6fa', border: '1px solid #f0f1f5', borderRadius: '99px', padding: '2px', gap: '1px' }}>
            {([{ id: 'totalLeak', label: '₹ leakage' }, { id: 'over', label: 'Months' }, { id: 'util', label: '% util' }] as Array<{ id: string; label: string }>).map(o => (
              <button key={o.id} onClick={() => setStateMetric(o.id as any)} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer', borderRadius: '99px', padding: '3px 12px', fontSize: '12px', background: stateMetric === o.id ? '#1c5af4' : 'transparent', color: stateMetric === o.id ? '#fff' : '#9aa0b0', fontWeight: stateMetric === o.id ? 600 : 400, transition: 'all .12s' }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(() => {
            const sorted = [...breakdownRows].sort((a, b) => b[stateMetric as keyof BreakdownRow] as number - (a[stateMetric as keyof BreakdownRow] as number));
            const maxVal = Math.max(...sorted.map(x => x[stateMetric as keyof BreakdownRow] as number), 1);
            return sorted.map((r, i) => {
              const barPct = ((r[stateMetric as keyof BreakdownRow] as number) / maxVal) * 100;
              const isLeakMetric = stateMetric === 'totalLeak';
              const severity = isLeakMetric ? r.util >= 100 ? 'High' : r.util >= 80 ? 'Med' : 'Low' : r.over >= 8 ? 'High' : r.over >= 4 ? 'Med' : 'Low';
              const sc = severity === 'High' ? '#e53935' : severity === 'Med' ? '#f59e0b' : '#36b37e';
              const sb = severity === 'High' ? '#fef2f2' : severity === 'Med' ? '#fffbeb' : '#f0faf6';
              const displayVal = isLeakMetric ? '₹' + (r.totalLeak / 100000).toFixed(1) + 'L' : r.over + ' mths';
              return (
                <div key={r.name} onClick={() => handleDrillDown(r)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px', transition: 'background .12s', hoverStyle: { background: '#f9fafb' } }} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                  <div style={{ width: '18px', fontSize: '12px', fontWeight: 600, color: '#c8cbd6', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: '110px', fontSize: '12px', color: '#192744', flexShrink: 0 }}>{r.name}</div>
                  <div style={{ flex: 1, height: '22px', background: '#f5f6fa', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: barPct + '%', borderRadius: '3px', background: severity === 'High' ? 'rgba(229,57,53,0.18)' : severity === 'Med' ? 'rgba(245,158,11,0.18)' : 'rgba(54,179,126,0.15)', borderRight: '2px solid ' + sc, transition: 'width .4s ease' }} />
                    <div style={{ position: 'absolute', left: '8px', top: 0, height: '100%', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#192744', fontWeight: 500 }}>{displayVal}</div>
                  </div>
                  <div style={{ width: '54px', fontSize: '12px', color: '#9aa0b0', textAlign: 'right', flexShrink: 0 }}>{r.contracted} kVA</div>
                  <div style={{ width: '40px', flexShrink: 0 }}>
                    <span style={{ background: sb, color: sc, fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px' }}>{severity}</span>
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
