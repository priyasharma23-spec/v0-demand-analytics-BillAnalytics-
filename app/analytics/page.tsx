'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import LeakagesSection from '@/components/LeakagesSection';

export default function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="page-wrapper">
      <DashboardNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Section content */}
      <div className="content">
        {activeSection === 'leakages' ? (
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
