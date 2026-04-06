'use client';

import React from 'react';
import { BillCategory } from '@/lib/calculations';

interface AppState {
  view: 'yearly' | 'monthly';
  stateF: string;
  branchF: string;
  caF: string;
  billCategory: BillCategory;
  section: string;
}

interface BillersSectionProps {
  appState: AppState;
}

export default function BillersSection({ appState }: BillersSectionProps) {
  return (
    <div style={{ padding: '24px', background: '#ffffff', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#192744', marginBottom: '16px' }}>
        Billers
      </h2>
      <div style={{ fontSize: '13px', color: '#858EA2' }}>
        Billers section content for {appState.stateF === 'all' ? 'all states' : appState.stateF}
      </div>
    </div>
  );
}
