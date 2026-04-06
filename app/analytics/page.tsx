'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import OverviewSection from '@/components/OverviewSection';
import ExcessDemandSection from '@/components/ExcessDemandSection';
import LeakagesSection from '@/components/LeakagesSection';
import { BillCategory } from '@/lib/calculations';

export default function AnalyticsPage() {
  const [activeProduct, setActiveProduct] = useState<'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst'>('bill-payment');
  const [activeSection, setActiveSection] = useState<'overview' | 'excess-demand' | 'consumption' | 'leakages' | 'savings' | 'optimization'>('overview');

  const [appState, setAppState] = useState({
    view: 'yearly' as 'yearly' | 'monthly',
    stateF: 'all',
    branchF: 'all',
    caF: 'all',
    billCategory: 'all' as BillCategory,
    section: 'overview',
  });

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
        onSectionChange={setActiveSection}
        appState={appState}
        onStateChange={handleStateChange}
        onBranchChange={handleBranchChange}
        onCAChange={handleCAChange}
        onBillCategoryChange={handleBillCategoryChange}
        onPeriodChange={handlePeriodChange}
      />

      {/* Section content */}
      <div className="content">
        {activeProduct === 'bill-payment' ? (
          <>
            {activeSection === 'overview' && <OverviewSection appState={appState} />}
            {activeSection === 'excess-demand' && <ExcessDemandSection />}
            {activeSection === 'consumption' && (
              <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
                Active Section: <span className="font-semibold">{activeSection}</span>
              </div>
            )}
            {activeSection === 'leakages' && <LeakagesSection />}
            {activeSection === 'savings' && (
              <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
                Active Section: <span className="font-semibold">{activeSection}</span>
              </div>
            )}
            {activeSection === 'optimization' && (
              <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
                Active Section: <span className="font-semibold">{activeSection}</span>
              </div>
            )}
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
      </div>
    </div>
  );
}
