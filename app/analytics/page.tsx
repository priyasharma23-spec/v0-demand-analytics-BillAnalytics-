'use client';

import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';

export default function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <main className="min-h-screen bg-background">
      <DashboardNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Placeholder for section content */}
      <div className="px-6 py-8">
        <div className="p-6 bg-background-secondary border border-border rounded-lg text-foreground">
          Active Section: <span className="font-semibold">{activeSection}</span>
        </div>
      </div>
    </main>
  );
}
