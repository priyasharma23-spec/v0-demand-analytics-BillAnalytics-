'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import ExcessDemandSection from '@/components/ExcessDemandSection';
import LeakagesSection from '@/components/LeakagesSection';

export default function AnalyticsPage() {
  const [activeProduct, setActiveProduct] = useState<'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst'>('bill-payment');
  const [activeSection, setActiveSection] = useState<'overview' | 'excess-demand' | 'consumption' | 'leakages' | 'savings' | 'optimization'>('overview');

  const handleProductChange = (product: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst') => {
    setActiveProduct(product);
    if (product === 'bill-payment') {
      setActiveSection('overview');
    }
  };

  return (
    <div className="page-wrapper">
      <DashboardNav
        activeProduct={activeProduct}
        onProductChange={handleProductChange}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Section content */}
      <div className="content">
        {activeProduct === 'bill-payment' ? (
          <>
            {activeSection === 'overview' && (
              <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
                Active Section: <span className="font-semibold">{activeSection}</span>
              </div>
            )}
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
