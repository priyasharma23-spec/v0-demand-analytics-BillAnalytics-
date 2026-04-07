'use client';

import React, { useState } from 'react';
import { AppState } from '@/lib/types';

type AnomalyKey = 'over_contracted_every_month' | 'pf_below_threshold' | 'recurring_late_payment' | 'under_utilised';

interface AnomalyDrilldownProps {
  anomalyKey: AnomalyKey;
  onBack: () => void;
  onNavigate: (section: string, filters?: Partial<AppState>) => void;
  appState: AppState;
}

const ANOMALY_CONFIG: Record<AnomalyKey, {
  title: string;
  desc: string;
  tags: { label: string; variant: 'danger' | 'warn' | 'info' }[];
  amount: string;
  amountLabel: string;
  primaryTable: 'ca' | 'branch';
  navigateTo: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}> = {
  over_contracted_every_month: {
    title: '43 CAs exceeded contracted demand every single month',
    desc: 'These CAs have structurally under-sized contracts. Raising contracted demand to P90 MDI + 15% buffer would eliminate excess charges and cover most peak months.',
    tags: [
      { label: 'Excess demand', variant: 'danger' },
      { label: '12/12 months', variant: 'danger' },
      { label: 'Maharashtra · Delhi · Karnataka', variant: 'warn' },
      { label: 'Recommended: Revise contracts', variant: 'info' },
    ],
    amount: '₹4.8L',
    amountLabel: 'avoidable / yr',
    primaryTable: 'ca',
    navigateTo: 'excess-demand',
    iconColor: '#A32D2D',
    iconBg: '#FCEBEB',
    borderColor: '#F7C1C1',
  },
  pf_below_threshold: {
    title: 'Power factor below 0.90 in 28 branches for 6+ months',
    desc: 'PF penalty triggered consistently in Uttar Pradesh and Rajasthan clusters. Installing capacitor banks at 6 high-impact branches would recover most of this charge.',
    tags: [
      { label: 'PF penalty', variant: 'warn' },
      { label: '6+ months', variant: 'warn' },
      { label: '28 branches', variant: 'info' },
      { label: 'Recommended: Install capacitor banks', variant: 'info' },
    ],
    amount: '₹2.1L',
    amountLabel: 'avoidable / yr',
    primaryTable: 'branch',
    navigateTo: 'leakages',
    iconColor: '#854F0B',
    iconBg: '#FAEEDA',
    borderColor: '#FAC775',
  },
  recurring_late_payment: {
    title: 'Late payment surcharge recurring in 19 CAs — 3+ consecutive months',
    desc: 'Concentrated in West Bengal and Gujarat. Payment scheduling alignment would eliminate this entirely — no tariff or infrastructure changes needed.',
    tags: [
      { label: 'Late payment', variant: 'danger' },
      { label: '3+ consecutive months', variant: 'warn' },
      { label: 'West Bengal · Gujarat', variant: 'info' },
      { label: 'Recommended: Fix payment schedule', variant: 'info' },
    ],
    amount: '₹1.3L',
    amountLabel: 'avoidable / yr',
    primaryTable: 'ca',
    navigateTo: 'leakages',
    iconColor: '#A32D2D',
    iconBg: '#FCEBEB',
    borderColor: '#F7C1C1',
  },
  under_utilised: {
    title: '12 CAs under-utilising contracted demand below 70%',
    desc: 'Tamil Nadu and Rajasthan clusters are consistently drawing well below contracted level. Reducing contracted demand for these CAs would lower fixed charges.',
    tags: [
      { label: 'Under-utilised', variant: 'info' },
      { label: 'Savings opportunity', variant: 'info' },
      { label: 'Tamil Nadu · Rajasthan', variant: 'warn' },
      { label: 'Recommended: Revise demand down', variant: 'info' },
    ],
    amount: '₹0.8L',
    amountLabel: 'saveable / yr',
    primaryTable: 'ca',
    navigateTo: 'optimization',
    iconColor: '#185FA5',
    iconBg: '#E6F1FB',
    borderColor: '#B5D4F4',
  },
};

const CA_DATA: Record<AnomalyKey, Array<{
  ca: string; biller: string; branch: string; state: string;
  contracted: number; mdi: number; recommended: number; avoidable: number;
}>> = {
  over_contracted_every_month: [
    { ca: 'MH-MN-0101', biller: 'MSEDCL', branch: 'Mumbai North', state: 'MH', contracted: 450, mdi: 538, recommended: 620, avoidable: 42000 },
    { ca: 'MH-MN-0102', biller: 'MSEDCL', branch: 'Mumbai North', state: 'MH', contracted: 380, mdi: 445, recommended: 510, avoidable: 36000 },
    { ca: 'DL-DS-4201', biller: 'TPDDL', branch: 'Delhi South', state: 'DL', contracted: 520, mdi: 608, recommended: 700, avoidable: 33000 },
    { ca: 'MH-MS-0201', biller: 'BEST', branch: 'Mumbai South', state: 'MH', contracted: 410, mdi: 472, recommended: 545, avoidable: 28000 },
    { ca: 'KA-BE-1101', biller: 'BESCOM', branch: 'Bangalore East', state: 'KA', contracted: 350, mdi: 399, recommended: 460, avoidable: 24000 },
    { ca: 'DL-DN-4101', biller: 'TPDDL', branch: 'Delhi North', state: 'DL', contracted: 490, mdi: 551, recommended: 635, avoidable: 22000 },
    { ca: 'MH-PE-0401', biller: 'MSEDCL', branch: 'Pune East', state: 'MH', contracted: 320, mdi: 361, recommended: 415, avoidable: 18000 },
    { ca: 'KA-BW-1201', biller: 'BESCOM', branch: 'Bangalore West', state: 'KA', contracted: 300, mdi: 336, recommended: 385, avoidable: 15000 },
  ],
  pf_below_threshold: [],
  recurring_late_payment: [
    { ca: 'WB-KN-7101', biller: 'WBSEDCL', branch: 'Kolkata North', state: 'WB', contracted: 280, mdi: 265, recommended: 280, avoidable: 12000 },
    { ca: 'GJ-AE-3101', biller: 'DGVCL', branch: 'Ahmedabad East', state: 'GJ', contracted: 310, mdi: 290, recommended: 310, avoidable: 10000 },
    { ca: 'WB-KS-7201', biller: 'WBSEDCL', branch: 'Kolkata South', state: 'WB', contracted: 250, mdi: 238, recommended: 250, avoidable: 9000 },
  ],
  under_utilised: [
    { ca: 'TN-CB-2401', biller: 'TNEB', branch: 'Coimbatore', state: 'TN', contracted: 500, mdi: 310, recommended: 360, avoidable: 8000 },
    { ca: 'RJ-JN-5101', biller: 'JVVNL', branch: 'Jaipur North', state: 'RJ', contracted: 420, mdi: 258, recommended: 300, avoidable: 6000 },
    { ca: 'TN-MD-2501', biller: 'TNEB', branch: 'Madurai', state: 'TN', contracted: 380, mdi: 224, recommended: 260, avoidable: 5500 },
  ],
};

const BRANCH_DATA: Record<AnomalyKey, Array<{
  branch: string; state: string; count: number;
  avgPf?: number; monthsBelow?: number; pfPenalty?: number;
  avoidable: number; avgOver?: number;
}>> = {
  pf_below_threshold: [
    { branch: 'Lucknow East', state: 'UP', count: 4, avgPf: 0.874, monthsBelow: 9, pfPenalty: 28000, avoidable: 28000 },
    { branch: 'Kanpur', state: 'UP', count: 3, avgPf: 0.881, monthsBelow: 8, pfPenalty: 22000, avoidable: 22000 },
    { branch: 'Jaipur North', state: 'RJ', count: 3, avgPf: 0.868, monthsBelow: 10, pfPenalty: 20000, avoidable: 20000 },
    { branch: 'Jaipur South', state: 'RJ', count: 2, avgPf: 0.876, monthsBelow: 7, pfPenalty: 16000, avoidable: 16000 },
    { branch: 'Varanasi', state: 'UP', count: 2, avgPf: 0.883, monthsBelow: 6, pfPenalty: 14000, avoidable: 14000 },
    { branch: 'Jodhpur', state: 'RJ', count: 2, avgPf: 0.871, monthsBelow: 8, pfPenalty: 12000, avoidable: 12000 },
  ],
  over_contracted_every_month: [
    { branch: 'Mumbai North', state: 'MH', count: 4, avoidable: 120000, avgOver: 19 },
    { branch: 'Delhi South', state: 'DL', count: 3, avoidable: 88000, avgOver: 17 },
    { branch: 'Mumbai South', state: 'MH', count: 3, avoidable: 76000, avgOver: 15 },
    { branch: 'Bangalore East', state: 'KA', count: 2, avoidable: 52000, avgOver: 14 },
  ],
  recurring_late_payment: [
    { branch: 'Kolkata North', state: 'WB', count: 3, avoidable: 32000, avgOver: 0 },
    { branch: 'Ahmedabad East', state: 'GJ', count: 2, avoidable: 22000, avgOver: 0 },
    { branch: 'Kolkata South', state: 'WB', count: 2, avoidable: 18000, avgOver: 0 },
  ],
  under_utilised: [
    { branch: 'Coimbatore', state: 'TN', count: 2, avoidable: 18000, avgOver: 0 },
    { branch: 'Jaipur North', state: 'RJ', count: 2, avoidable: 14000, avgOver: 0 },
    { branch: 'Madurai', state: 'TN', count: 1, avoidable: 8000, avgOver: 0 },
  ],
};

export default function AnomalyDrilldownPage({
  anomalyKey,
  onBack,
  onNavigate,
  appState,
}: AnomalyDrilldownProps) {
  const [sortBy, setSortBy] = useState<'avoidable' | 'overrun'>('avoidable');
  const config = ANOMALY_CONFIG[anomalyKey];
  const caRows = CA_DATA[anomalyKey];
  const brRows = BRANCH_DATA[anomalyKey];

  const totalAvoidable = caRows.reduce((s, r) => s + r.avoidable, 0);
  const affectedCAs = caRows.length;
  const affectedStates = [...new Set(caRows.map(r => r.state))].length;
  const avgOverRun = caRows.length
    ? Math.round(caRows.reduce((s, r) => s + (r.mdi / r.contracted - 1) * 100, 0) / caRows.length)
    : 0;

  const totalPfPenalty = brRows.reduce((s, r) => s + (r.pfPenalty ?? 0), 0);
  const affectedBranches = brRows.length;
  const avgPf = brRows.length
    ? (brRows.reduce((s, r) => s + (r.avgPf ?? 0), 0) / brRows.length).toFixed(3)
    : '—';
  const maxMonthsBelow = Math.max(...brRows.map(r => r.monthsBelow ?? 0), 0);

  const METRIC_CONFIGS: Record<AnomalyKey, Array<{ label: string; value: string; sub: string; subColor: string }>> = {
    over_contracted_every_month: [
      { label: 'Affected CAs', value: `${affectedCAs}`, sub: 'of 187 total', subColor: '#858ea2' },
      { label: 'Avoidable annually', value: `₹${(totalAvoidable / 100000).toFixed(1)}L`, sub: 'excess demand charges', subColor: '#A32D2D' },
      { label: 'Avg over-run', value: `+${avgOverRun}%`, sub: 'MDI above contracted', subColor: '#854F0B' },
      { label: 'States affected', value: `${affectedStates}`, sub: 'MH · DL · KA', subColor: '#858ea2' },
    ],
    pf_below_threshold: [
      { label: 'Affected branches', value: `${affectedBranches}`, sub: 'of 62 total', subColor: '#858ea2' },
      { label: 'Avoidable annually', value: `₹${(totalPfPenalty / 100000).toFixed(1)}L`, sub: 'PF penalty charges', subColor: '#854F0B' },
      { label: 'Avg power factor', value: `${avgPf}`, sub: 'threshold is 0.90', subColor: '#A32D2D' },
      { label: 'Max months below', value: `${maxMonthsBelow}`, sub: 'consecutive periods', subColor: '#854F0B' },
    ],
    recurring_late_payment: [
      { label: 'Affected CAs', value: `${affectedCAs}`, sub: 'of 187 total', subColor: '#858ea2' },
      { label: 'Avoidable annually', value: `₹${(totalAvoidable / 100000).toFixed(1)}L`, sub: 'late payment surcharge', subColor: '#A32D2D' },
      { label: 'Avg consecutive', value: '3+ months', sub: 'recurring pattern', subColor: '#854F0B' },
      { label: 'States affected', value: `${affectedStates}`, sub: 'WB · GJ', subColor: '#858ea2' },
    ],
    under_utilised: [
      { label: 'Affected CAs', value: `${affectedCAs}`, sub: 'of 187 total', subColor: '#858ea2' },
      { label: 'Potential saving', value: `₹${(totalAvoidable / 100000).toFixed(1)}L`, sub: 'on fixed charges', subColor: '#3B6D11' },
      { label: 'Avg utilisation', value: '58%', sub: 'below 70% threshold', subColor: '#854F0B' },
      { label: 'States affected', value: `${affectedStates}`, sub: 'TN · RJ', subColor: '#858ea2' },
    ],
  };

  const metrics = METRIC_CONFIGS[anomalyKey];
  const sortedCAs = [...caRows].sort((a, b) => b.avoidable - a.avoidable);
  const sortedBrs = [...brRows].sort((a, b) => b.avoidable - a.avoidable);

  return (
    <div style={{ padding: '20px', background: '#f5f6fa', minHeight: '100vh' }}>
      {/* SECTION 1 — Back nav + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '0.5px solid rgba(0,0,0,0.15)',
            background: '#fff',
            fontSize: '13px',
            color: '#6b6b67',
            cursor: 'pointer',
          }}
        >
          ← Back to overview
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#858ea2' }}>
          <span style={{ color: '#2500D7', cursor: 'pointer' }} onClick={onBack}>
            Overview
          </span>
          <span style={{ color: '#d0d0d0' }}>›</span>
          <span style={{ color: '#192744', fontWeight: 500 }}>{config.title}</span>
        </div>
      </div>

      {/* SECTION 2 — Anomaly context banner */}
      <div
        style={{
          background: '#fff',
          border: `0.5px solid ${config.borderColor}`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke={config.iconColor} strokeWidth="1.5" />
            <path d="M10 6.5v4" stroke={config.iconColor} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="14" r="0.75" fill={config.iconColor} />
          </svg>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#192744', marginBottom: '4px' }}>
            {config.title}
          </div>
          <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: 1.5, marginBottom: '8px' }}>
            {config.desc}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {config.tags.map(tag => (
              <span
                key={tag.label}
                style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  background:
                    tag.variant === 'danger' ? '#FCEBEB' : tag.variant === 'warn' ? '#FAEEDA' : '#E6F1FB',
                  color: tag.variant === 'danger' ? '#A32D2D' : tag.variant === 'warn' ? '#633806' : '#0C447C',
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: config.iconColor }}>
            {config.amount}
          </div>
          <div style={{ fontSize: '11px', color: '#858ea2', marginTop: '2px' }}>
            {config.amountLabel}
          </div>
          <button
            onClick={() => onNavigate(config.navigateTo)}
            style={{
              marginTop: '8px',
              height: '30px',
              padding: '0 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#EBEAFF',
              color: '#2500D7',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View in {config.navigateTo} →
          </button>
        </div>
      </div>

      {/* SECTION 3 — Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        {metrics.map(m => (
          <div
            key={m.label}
            style={{
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.10)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#858ea2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: '#192744' }}>
              {m.value}
            </div>
            <div style={{ fontSize: '11px', marginTop: '3px', color: m.subColor }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 4 — Primary table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#192744' }}>
              {config.primaryTable === 'ca' ? 'Affected CAs — ranked by avoidable charges' : 'Affected branches — ranked by PF penalty'}
            </div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>
              Click any row to view full detail
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {config.primaryTable === 'ca' ? (
                  <>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      CA number
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Biller
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Branch
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      State
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Contracted
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Avg MDI
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Over-run
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Recommended
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Avoidable / yr
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Action
                    </th>
                  </>
                ) : (
                  <>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Branch
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      State
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Affected CAs
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Avg PF
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Months below 0.90
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      PF penalty
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Avoidable / yr
                    </th>
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Action
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {config.primaryTable === 'ca'
                ? sortedCAs.map(r => (
                    <tr
                      key={r.ca}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9')}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#2500D7' }}>
                        {r.ca}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#858ea2' }}>
                        {r.biller}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                        {r.branch}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: '#EBEAFF', color: '#2500D7' }}>
                          {r.state}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                        {r.contracted}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#A32D2D', fontWeight: 500 }}>
                        {r.mdi}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#854F0B' }}>
                            +{Math.round((r.mdi / r.contracted - 1) * 100)}%
                          </span>
                          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#f0f0f0', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min((r.mdi / r.contracted - 1) * 100 * 2, 100)}%`,
                                height: '100%',
                                background: '#E24B4A',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#3B6D11', fontWeight: 500 }}>
                        {r.recommended}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#A32D2D', fontWeight: 500 }}>
                        ₹{(r.avoidable / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <button
                          onClick={() => onNavigate(config.navigateTo, { caF: r.ca })}
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#EBEAFF',
                            color: '#2500D7',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Revise →
                        </button>
                      </td>
                    </tr>
                  ))
                : sortedBrs.map(r => (
                    <tr
                      key={r.branch}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9')}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#2500D7' }}>
                        {r.branch}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: '#EBEAFF', color: '#2500D7' }}>
                          {r.state}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744', fontWeight: 500 }}>
                        {r.count} CAs
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: r.avgPf && r.avgPf < 0.9 ? '#A32D2D' : '#192744' }}>
                        {r.avgPf}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#854F0B' }}>
                        {r.monthsBelow}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#854F0B', fontWeight: 500 }}>
                        ₹{((r.pfPenalty ?? 0) / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#A32D2D', fontWeight: 500 }}>
                        ₹{(r.avoidable / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <button
                          onClick={() => onNavigate('optimization', { branchF: r.branch })}
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#EBEAFF',
                            color: '#2500D7',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Install capacitor →
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 — Branch grouping table (for CA-primary anomalies only) */}
      {anomalyKey !== 'pf_below_threshold' && (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#192744' }}>
              Grouped by branch — concentration view
            </div>
            <div style={{ fontSize: '12px', color: '#858ea2', marginTop: '2px' }}>
              Which branches have the most affected CAs
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Branch
                  </th>
                  <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    State
                  </th>
                  <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Affected CAs
                  </th>
                  <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total avoidable
                  </th>
                  {anomalyKey === 'over_contracted_every_month' && (
                    <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Avg over-run
                    </th>
                  )}
                  <th style={{ fontSize: '11px', fontWeight: 500, color: '#858ea2', textAlign: 'left', padding: '8px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.10)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {BRANCH_DATA[anomalyKey].map(r => {
                  const priorityBg = r.avoidable > 100000 ? '#FCEBEB' : r.avoidable > 70000 ? '#FAEEDA' : '#EAF3DE';
                  const priorityColor = r.avoidable > 100000 ? '#A32D2D' : r.avoidable > 70000 ? '#633806' : '#27500A';
                  const priorityLabel = r.avoidable > 100000 ? 'High' : r.avoidable > 70000 ? 'Medium' : 'Low';
                  return (
                    <tr
                      key={r.branch}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = '#f9f9f9')}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', fontWeight: 500, color: '#2500D7' }}>
                        {r.branch}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: '#EBEAFF', color: '#2500D7' }}>
                          {r.state}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#192744' }}>
                        {r.count} CAs
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#A32D2D', fontWeight: 500 }}>
                        ₹{(r.avoidable / 1000).toFixed(0)}K
                      </td>
                      {anomalyKey === 'over_contracted_every_month' && (
                        <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', color: '#854F0B' }}>
                          +{r.avgOver}%
                        </td>
                      )}
                      <td style={{ padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: priorityBg, color: priorityColor }}>
                          {priorityLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
