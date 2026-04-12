'use client'
import { useState } from 'react'
import { SummaryCard } from './SummaryCard'

interface BasicAnalyticsShellProps {
  appState: { view: string; stateF: string; branchF: string; caF: string }
}

const BASIC_SECTIONS = [
  { id: 'summary',   label: 'Summary'    },
  { id: 'locations', label: 'Locations'  },
  { id: 'trends',    label: 'Trends'     },
  { id: 'duedates',  label: 'Due Dates'  },
]

export default function BasicAnalyticsShell({ appState }: BasicAnalyticsShellProps) {
  const [section, setSection] = useState('summary')

  return (
    <div style={{ background: '#f0f5fa', minHeight: '100vh' }}>

      {/* Section pills */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 24px', display: 'flex', gap: '4px' }}>
        {BASIC_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '10px 16px', fontSize: '13px', fontWeight: 500,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: section === s.id ? '#2500D7' : '#858ea2',
            borderBottom: section === s.id ? '2px solid #2500D7' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div style={{ padding: '20px' }}>
        {section === 'summary' && <BasicSummary />}
        {section === 'locations' && <BasicLocations />}
        {section === 'trends' && <BasicTrends />}
        {section === 'duedates' && <BasicDueDates />}
      </div>
    </div>
  )
}

// ── Placeholder sections ────────────────────────────────
function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EBEAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="14" width="4" height="6" rx="1" fill="#2500D7" opacity="0.4"/>
          <rect x="9" y="9" width="4" height="11" rx="1" fill="#2500D7" opacity="0.7"/>
          <rect x="16" y="4" width="4" height="16" rx="1" fill="#2500D7"/>
        </svg>
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#192744' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#858ea2', textAlign: 'center', maxWidth: '320px' }}>{desc}</div>
      <div style={{ fontSize: '11px', color: '#2500D7', fontWeight: 500, padding: '4px 12px', borderRadius: '6px', background: '#EBEAFF' }}>Coming up next</div>
    </div>
  )
}

function BasicSummary() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard label="Total portfolio value"   value="₹42.5Cr"  sub="Apr 2024 – Mar 2025"         subColor="#858ea2" borderColor="#2500D7" />
        <SummaryCard label="Avg bill per location"   value="₹2.65L"   sub="across 160 active CAs"        subColor="#185FA5" borderColor="#185FA5" />
        <SummaryCard label="YoY change"              value="+8.3%"     sub="vs Apr 2023 – Mar 2024"       subColor="#854F0B" borderColor="#EF9F27" />
        <SummaryCard label="Bills due this month"    value="43"        sub="₹11.2L total · next 30 days"  subColor="#A32D2D" borderColor="#E24B4A" />
      </div>
      <PlaceholderSection title="Summary charts" desc="Monthly spend overview, payment status breakdown, and portfolio health score" />
    </div>
  )
}

function BasicLocations() {
  return <PlaceholderSection title="Location intelligence" desc="Top 10 locations by bill amount, outliers vs last year, and state-level heatmap" />
}

function BasicTrends() {
  return <PlaceholderSection title="Trends & comparisons" desc="Monthly spend trend, YoY comparison lines, and seasonal patterns across your portfolio" />
}

function BasicDueDates() {
  return <PlaceholderSection title="Due date calendar" desc="Upcoming bill due dates, capital planning view, and payment prioritisation by amount" />
}
