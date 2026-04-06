'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DemandAnalytics() {
  const [activeSection, setActiveSection] = useState('overview')
  const [activePeriod, setActivePeriod] = useState('1y')
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [productSelect, setProductSelect] = useState('bill')

  // Data state
  const [metrics, setMetrics] = useState<any>({})
  const [kpis, setKpis] = useState<any>({})
  const [breadcrumb, setBreadcrumb] = useState<any[]>([])
  const [breakdownData, setBreakdownData] = useState<any[]>([])

  useEffect(() => {
    // Initialize with sample data
    initializeData()
  }, [])

  const initializeData = () => {
    // Sample metrics data
    setMetrics({
      overview: [
        { label: 'Avg Contracted Demand', value: '850 kVA' },
        { label: 'Max Demand (MDI)', value: '920 kVA' },
        { label: 'Excess Charges', value: '₹ 2.5L' },
        { label: 'Period', value: '12 months' },
      ],
      consumption: [
        { label: 'Total Consumption', value: '2.4M kWh' },
        { label: 'Avg Monthly', value: '198k kWh' },
        { label: 'Energy Charges', value: '₹ 18.5L' },
        { label: 'Cost/kWh', value: '₹7.71' },
      ],
      leakages: [
        { label: 'Total Leakages', value: '₹ 4.2L' },
        { label: 'As % of Bill', value: '18.2%' },
        { label: 'Top Penalty Type', value: 'Excess Demand' },
        { label: 'Months Affected', value: '11 of 12' },
      ],
      savings: [
        { label: 'Current Penalties', value: '₹ 4.2L' },
        { label: 'Potential Savings', value: '₹ 2.8L' },
        { label: 'Savings %', value: '66.7%' },
        { label: 'Recommended Revision', value: '850 kVA' },
      ],
      optimization: [
        { label: 'Avg Utilization', value: '108.2%' },
        { label: 'Over-threshold Months', value: '9 of 12' },
        { label: 'Avg Power Factor', value: '0.94' },
        { label: 'Violation Months', value: '2 of 12' },
      ],
    })

    // Sample KPI data
    setKpis({
      overview: [
        { type: 'info', label: 'Current Status', value: '920 kVA', desc: 'Peak MDI in period' },
        { type: 'danger', label: 'Excess Amount', value: '70 kVA', desc: '8.2% over contract' },
        { type: 'warn', label: 'Avg Excess Days', value: '23 days/mo', desc: '76% of month' },
        { type: 'good', label: 'Best Month', value: '750 kVA', desc: 'Feb-24: 88% utilization' },
      ],
      consumption: [
        { type: 'info', label: 'Billing Month Avg', value: '₹15.4L', desc: 'Energy charges only' },
        { type: 'good', label: 'Min Rate Month', value: '₹7.21/kWh', desc: 'Feb-24' },
        { type: 'warn', label: 'Max Rate Month', value: '₹8.34/kWh', desc: 'Sep-24' },
        { type: 'info', label: 'Rate Volatility', value: '15.7%', desc: 'Coefficient of variation' },
      ],
      leakages: [
        { type: 'danger', label: 'Monthly Avg Penalties', value: '₹35k', desc: 'Recurring cost' },
        { type: 'danger', label: 'Excess Demand Share', value: '58%', desc: 'Of total penalties' },
        { type: 'warn', label: 'PF Penalty Avg', value: '₹8.5k', desc: 'When applicable' },
        { type: 'good', label: 'Penalty-Free Months', value: '1 of 12', desc: 'Aug-24' },
      ],
      savings: [
        { type: 'good', label: 'Realised Savings', value: '₹1.2L', desc: 'Aug-24 penalty-free month' },
        { type: 'info', label: 'Monthly Avg Savings Potential', value: '₹23k', desc: 'If penalties = 0' },
        { type: 'warn', label: 'Contract Revision Impact', value: '-66.7%', desc: 'Projected penalty reduction' },
        { type: 'good', label: 'Revision ROI', value: '2.1 mo', desc: 'Time to recover revision cost' },
      ],
      optimization: [
        { type: 'info', label: 'Utilization Band', value: '75–120%', desc: 'Range across 12 months' },
        { type: 'warn', label: 'Demand Volatility', value: '170 kVA', desc: 'Month-on-month std dev' },
        { type: 'good', label: 'PF Compliance', value: '83.3%', desc: '10 of 12 months ≥0.90' },
        { type: 'warn', label: 'Low Voltage Surcharge', value: '₹4.2k/mo', desc: 'Avg penalty impact' },
      ],
    })

    // Sample breakdown data
    setBreakdownData([
      { state: 'Maharashtra', demand: '320 kVA', excess: '85 kVA', charge: '₹78k', utilization: '126.6%' },
      { state: 'Karnataka', demand: '280 kVA', excess: '45 kVA', charge: '₹42k', utilization: '116.1%' },
      { state: 'Rajasthan', demand: '250 kVA', excess: '40 kVA', charge: '₹38k', utilization: '116%' },
    ])
  }

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'consumption', label: 'Consumption' },
    { id: 'leakages', label: 'Leakages', badge: '0' },
    { id: 'savings', label: 'Savings' },
    { id: 'optimization', label: 'Optimization' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-background border-b border-border">
        {/* Product Bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</span>
          <div className="w-px h-3.5 bg-border"></div>
          <div className="relative">
            <select
              value={productSelect}
              onChange={(e) => setProductSelect(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-foreground pr-5 cursor-pointer outline-none"
            >
              <option value="bill">Bill payments</option>
              <option value="invoice">Invoice payments</option>
              <option value="gst">GST</option>
            </select>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">▾</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-border">
          {/* State Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">State</span>
            <select className="text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground cursor-pointer appearance-none">
              <option>All states</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Branch</span>
            <select className="text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground cursor-pointer appearance-none">
              <option>All branches</option>
            </select>
          </div>

          {/* CA Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">CA</span>
            <select className="text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground cursor-pointer appearance-none">
              <option>All CAs</option>
            </select>
          </div>

          {/* Bill Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Bill category</span>
            <select className="text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground cursor-pointer appearance-none">
              <option>All categories</option>
              <option>HT Industrial</option>
              <option>LT Commercial</option>
              <option>HT Commercial</option>
              <option>LT Industrial</option>
            </select>
          </div>

          <div className="w-px h-4 bg-border"></div>

          {/* Date Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Period</span>
            <div className="flex gap-0.5 p-1 rounded border border-border bg-card">
              {['1m', '3m', '6m', '1y', 'custom'].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setActivePeriod(period)
                    setShowCustomRange(period === 'custom')
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    activePeriod === period
                      ? 'bg-background text-foreground border border-border'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {period === '1m' && '1M'}
                  {period === '3m' && '3M'}
                  {period === '6m' && '6M'}
                  {period === '1y' && '1Y'}
                  {period === 'custom' && 'Custom'}
                </button>
              ))}
            </div>
            {showCustomRange && (
              <div className="flex items-center gap-2 ml-2">
                <input type="date" className="text-xs px-2 py-1 rounded border border-border bg-card text-foreground" />
                <span className="text-xs text-muted-foreground">—</span>
                <input type="date" className="text-xs px-2 py-1 rounded border border-border bg-card text-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-border overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {section.label}
              {section.badge && <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs font-medium rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">{section.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 p-5">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm mb-4">
            {breadcrumb.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="text-foreground font-medium">{item}</span>
                {idx < breadcrumb.length - 1 && <span className="text-muted-foreground">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Active Section Content */}
        {(activeSection === 'overview' || activeSection === 'consumption' || activeSection === 'leakages' || activeSection === 'savings' || activeSection === 'optimization') && (
          <>
            {/* Summary Section Label */}
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Summary</div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
              {metrics[activeSection]?.map((metric: any, idx: number) => (
                <Card key={idx} className="p-3 rounded-lg bg-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">{metric.label}</div>
                  <div className="text-lg font-medium text-foreground">{metric.value}</div>
                </Card>
              ))}
            </div>

            {/* Chart Cards - Placeholder for actual charts */}
            <Card className="p-5 rounded-xl mb-4 bg-background border border-border">
              <div className="mb-1">
                <h3 className="text-sm font-medium text-foreground">
                  {activeSection === 'overview' && 'Contracted vs Max demand — all states'}
                  {activeSection === 'consumption' && 'Total units consumed (kWh)'}
                  {activeSection === 'leakages' && 'Total leakage charges by type'}
                  {activeSection === 'savings' && 'Realised savings vs avoidable losses'}
                  {activeSection === 'optimization' && 'Demand utilisation band'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {activeSection === 'overview' && 'kVA · aggregated across portfolio'}
                {activeSection === 'consumption' && 'Aggregated energy consumption over period'}
                {activeSection === 'leakages' && 'Stacked view of all avoidable penalty charges (₹)'}
                {activeSection === 'savings' && 'Months where penalties were zero = realised savings opportunity'}
                {activeSection === 'optimization' && 'MDI vs contracted demand — distribution of usage intensity'}
              </p>
              <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                <span>📊 Chart visualization goes here</span>
              </div>
              <div className="h-48 bg-muted/20 rounded border border-border flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Chart Canvas</span>
              </div>
            </Card>

            {/* KPI Grid */}
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Insights</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
              {kpis[activeSection]?.map((kpi: any, idx: number) => {
                const bgColors = {
                  danger: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
                  warn: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900',
                  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
                  good: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
                }
                const textColors = {
                  danger: 'text-red-600 dark:text-red-400',
                  warn: 'text-yellow-700 dark:text-yellow-400',
                  info: 'text-blue-600 dark:text-blue-400',
                  good: 'text-green-700 dark:text-green-600',
                }
                const labelColors = {
                  danger: 'text-red-900 dark:text-red-200',
                  warn: 'text-yellow-900 dark:text-yellow-200',
                  info: 'text-blue-900 dark:text-blue-200',
                  good: 'text-green-900 dark:text-green-200',
                }

                return (
                  <Card key={idx} className={`p-3.5 rounded-lg border ${bgColors[kpi.type as keyof typeof bgColors]}`}>
                    <div className={`text-xs font-medium uppercase tracking-wide mb-1.5 ${labelColors[kpi.type as keyof typeof labelColors]}`}>
                      {kpi.label}
                    </div>
                    <div className={`text-xl font-medium mb-1 ${textColors[kpi.type as keyof typeof textColors]}`}>
                      {kpi.value}
                    </div>
                    <div className={`text-xs leading-relaxed ${labelColors[kpi.type as keyof typeof labelColors]}`}>
                      {kpi.desc}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Breakdown Table */}
            <Card className="p-5 rounded-xl bg-background border border-border">
              <h3 className="text-sm font-medium text-foreground mb-1">
                {activeSection === 'overview' && 'Breakdown by state'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Click a row to drill down</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left p-2.5">State</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left p-2.5">Contracted Demand</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left p-2.5">Excess</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left p-2.5">Charges</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left p-2.5">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownData.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 cursor-pointer">
                        <td className="text-foreground p-2.5">{row.state}</td>
                        <td className="text-foreground p-2.5">{row.demand}</td>
                        <td className="text-foreground p-2.5">{row.excess}</td>
                        <td className="text-foreground p-2.5">{row.charge}</td>
                        <td className="text-foreground p-2.5">{row.utilization}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
