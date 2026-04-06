'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import ExcessDemandSection from '@/components/ExcessDemandSection';
import LeakagesSection from '@/components/LeakagesSection';

export default function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'excess-demand' | 'consumption' | 'leakages' | 'savings' | 'optimization'>('overview');

  return (
    <div className="page-wrapper">
      <DashboardNav
        activeSection={activeSection}
        onSectionChange={setActiveSection as any}
      />

      {/* Section content */}
      <div className="content">
        {activeSection === 'excess-demand' ? (
          <ExcessDemandSection />
        ) : activeSection === 'leakages' ? (
          <LeakagesSection />
        ) : (
          <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
            Active Section: <span className="font-semibold">{activeSection}</span>
          </div>
        )}
      </div>
    </div>
  );
}
