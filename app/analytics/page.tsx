'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import TopFilter from '@/components/TopFilter';
import OverviewSection from '@/components/OverviewSection';
import ExcessDemandSection from '@/components/ExcessDemandSection';
import LeakagesSection from '@/components/LeakagesSection';
import BillersSection from '@/components/BillersSection';
import ConsumptionSection from '@/components/ConsumptionSection';
import SavingsSection from '@/components/SavingsSection';
import HeatmapDrilldownPage from '@/components/HeatmapDrilldownPage';
import AnomalyDrilldownPage from '@/components/AnomalyDrilldownPage';
import MultiBillReviewPage from '@/components/MultiBillReviewPage';
import BasicAnalyticsShell from '@/components/BasicAnalyticsShell';
import { BillCategory } from '@/lib/calculations';

export default function AnalyticsPage() {
  const [activeProduct, setActiveProduct] = useState<'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst'>('bill-payment');
  const [activeSection, setActiveSection] = useState<'overview' | 'billers' | 'excess-demand' | 'consumption' | 'leakages' | 'savings'>('overview');
  const [analyticsMode, setAnalyticsMode] = useState<'basic' | 'advanced'>('basic');

  const [appState, setAppState] = useState({
    view: 'yearly' as 'yearly' | 'monthly',
    stateF: 'all',
    branchF: 'all',
    caF: 'all',
    billCategory: 'all' as BillCategory,
    section: 'overview',
  });

  const [drilldown, setDrilldown] = useState<{ state: string; month: string; monthIndex: number } | null>(null);
  const [anomalyDrilldown, setAnomalyDrilldown] = useState<'over_contracted_every_month' | 'pf_below_threshold' | 'recurring_late_payment' | 'under_utilised' | null>(null);
  const [multiBillReview, setMultiBillReview] = useState(false);

  const handleProductChange = (product: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst') => {
    setActiveProduct(product);
    if (product === 'bill-payment') {
      setActiveSection('overview');
    }
  };

  const handleStateChange = (value: string) => {
    setAppState(prev => ({ ...prev, stateF: value, branchF: 'all', caF: 'all' }));
  };

  const handleBranchChange = (value: string) => {
    setAppState(prev => ({ ...prev, branchF: value, caF: 'all' }));
  };

  const handleCAChange = (value: string) => {
    setAppState(prev => ({ ...prev, caF: value }));
  };

  const handleBillCategoryChange = (value: string) => {
    setAppState(prev => ({ ...prev, billCategory: value as BillCategory }));
  };

  const handlePeriodChange = (value: string) => {
    const viewMap: Record<string, 'yearly' | 'monthly'> = {
      '1m': 'monthly',
      '3m': 'monthly',
      '6m': 'monthly',
      '1y': 'yearly',
      'custom': 'monthly',
    };
    setAppState(prev => ({ ...prev, view: viewMap[value] || 'yearly' }));
  };

  return (
    <div className="page-wrapper">
      <DashboardNav
        activeProduct={activeProduct}
        onProductChange={handleProductChange}
        activeSection={activeSection}
        onSectionChange={(s) => setActiveSection(s as any)}
        appState={appState}
        onStateChange={handleStateChange}
        onBranchChange={handleBranchChange}
        onCAChange={handleCAChange}
        onBillCategoryChange={handleBillCategoryChange}
        onPeriodChange={handlePeriodChange}
        analyticsMode={analyticsMode}
        onModeChange={setAnalyticsMode}
      />

      <TopFilter
        onSearch={(query) => console.log('Search:', query)}
        onDateRangeChange={(range) => console.log('Date range:', range)}
        onApply={(filters: { stateF: string; branchF: string; caF: string; dateRange: string }) => {
          setAppState(prev => ({
            ...prev,
            stateF:  filters.stateF,
            branchF: filters.branchF,
            caF:     filters.caF,
          }))
        }}
        onSelectEntity={(name, type) => {
          if (type === 'state')  setAppState(prev => ({ ...prev, stateF: name, branchF: 'all', caF: 'all' }))
          if (type === 'branch') setAppState(prev => ({ ...prev, branchF: name, caF: 'all' }))
          if (type === 'ca')     setAppState(prev => ({ ...prev, caF: name }))
        }}
      />

      {/* Section content */}
      <div className="content">
        {analyticsMode === 'basic' ? (
          <BasicAnalyticsShell appState={appState} />
        ) : (
          <>
            {multiBillReview ? (
              <MultiBillReviewPage onBack={() => setMultiBillReview(false)} />
            ) : anomalyDrilldown ? (
              <AnomalyDrilldownPage
                anomalyKey={anomalyDrilldown}
                onBack={() => setAnomalyDrilldown(null)}
                onNavigate={(section, filters) => {
                  setAnomalyDrilldown(null);
                  if (filters?.caF) handleCAChange(filters.caF);
                  if (filters?.branchF) handleBranchChange(filters.branchF);
                  setActiveSection(section as any);
                }}
                appState={appState}
              />
            ) : drilldown ? (
              <HeatmapDrilldownPage
                state={drilldown.state}
                month={drilldown.month}
                monthIndex={drilldown.monthIndex}
                onBack={() => setDrilldown(null)}
                onViewAllSections={() => {
                  setDrilldown(null);
                  handleStateChange(drilldown.state);
                  setActiveSection('leakages');
                }}
                onBranchClick={(branch) => {
                  setDrilldown(null);
                  handleBranchChange(branch);
                  setActiveSection('leakages');
                }}
                appState={appState}
              />
            ) : (
              <>
                {activeProduct === 'bill-payment' ? (
                  <>
                    {activeSection === 'overview' && (
                      <OverviewSection 
                        appState={appState}
                        onStateChange={handleStateChange}
                        onBranchChange={handleBranchChange}
                        onCAChange={handleCAChange}
                        onSectionChange={(s) => setActiveSection(s as any)}
                        onHeatmapCellClick={(state, month, monthIndex) => {
                          setDrilldown({ state, month, monthIndex });
                        }}
                        onAnomalyClick={(anomalyKey) => setAnomalyDrilldown(anomalyKey)}
                      />
                    )}
                    {activeSection === 'billers' && <BillersSection appState={appState} onMultiBillReview={() => setMultiBillReview(true)} />}
                    {activeSection === 'excess-demand' && <ExcessDemandSection appState={appState} />}
                    {activeSection === 'consumption' && <ConsumptionSection appState={appState} />}
                    {activeSection === 'leakages' && <LeakagesSection />}
                    {activeSection === 'savings' && <SavingsSection appState={appState} />}
                    
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '320px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '0.5px solid rgba(0,0,0,0.15)',
                      margin: '20px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#192744' }}>
                      {activeProduct === 'vendor-payment' && 'Vendor Payment'}
                      {activeProduct === 'rental-payment' && 'Rental Payment'}
                      {activeProduct === 'gst' && 'GST'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#858ea2' }}>
                      Analytics for this product are coming soon
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
