'use client';

import React, { useState } from 'react';
import { STATES, BRANCHES, CAS, BILL_CATEGORIES, BillCategory } from '@/lib/calculations';

interface AppState {
  view: 'yearly' | 'monthly';
  stateF: string;
  branchF: string;
  caF: string;
  billCategory: BillCategory;
  section: string;
}

interface DashboardNavProps {
  activeProduct: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst';
  onProductChange: (product: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst') => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  appState: AppState;
  onStateChange: (state: string) => void;
  onBranchChange: (branch: string) => void;
  onCAChange: (ca: string) => void;
  onBillCategoryChange: (category: string) => void;
  onPeriodChange: (period: string) => void;
}

export default function DashboardNav({
  activeProduct,
  onProductChange,
  activeSection,
  onSectionChange,
  appState,
  onStateChange,
  onBranchChange,
  onCAChange,
  onBillCategoryChange,
  onPeriodChange,
}: DashboardNavProps) {
  const [localState, setLocalState] = useState('');
  const [localBranch, setLocalBranch] = useState('');
  const [localCA, setLocalCA] = useState('');
  const [localBillCategory, setLocalBillCategory] = useState('all');
  const [period, setPeriod] = useState('1Y');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'excess-demand', label: 'Excess demand' },
    { id: 'consumption', label: 'Consumption' },
    { id: 'leakages', label: 'Leakages' },
    { id: 'savings', label: 'Savings' },
    { id: 'optimization', label: 'Optimization' },
  ];

  const products = [
    { value: 'bill-payment', label: 'Bill Payment' },
    { value: 'vendor-payment', label: 'Vendor Payment' },
    { value: 'rental-payment', label: 'Rental Payment' },
    { value: 'gst', label: 'GST' },
  ];

  const showSectionPills = activeProduct === 'bill-payment';

  const getStateOptions = () => {
    return STATES.map((name) => ({
      value: name,
      label: name,
    }));
  };

  const getBranchOptions = () => {
    if (appState.stateF === 'all') return [];
    const branches = BRANCHES[appState.stateF] || [];
    return branches.map((name) => ({
      value: name,
      label: name,
    }));
  };

  const getCAOptions = () => {
    if (appState.branchF === 'all') return [];
    const caList = CAS[appState.branchF] || [];
    return caList.map((ca) => ({
      value: ca,
      label: ca,
    }));
  };


  return (
    <nav style={{ backgroundColor: '#ffffff' }}>
      {/* Row 1: Product Tab Strip */}
      <div style={{ display: 'flex', gap: '0', padding: '0 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
        {products.map((p) => (
          <button
            key={p.value}
            onClick={() => onProductChange(p.value as any)}
            style={{
              height: '48px',
              padding: '0 20px',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              fontWeight: activeProduct === p.value ? 600 : 400,
              color: activeProduct === p.value ? '#192744' : '#858EA2',
              background: activeProduct === p.value ? '#EBEAFF' : 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeProduct === p.value ? '2px solid #2500D7' : '2px solid transparent',
              borderRadius: activeProduct === p.value ? '8px 8px 0 0' : '0',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (activeProduct !== p.value) {
                (e.target as HTMLButtonElement).style.color = '#192744';
              }
            }}
            onMouseLeave={(e) => {
              if (activeProduct !== p.value) {
                (e.target as HTMLButtonElement).style.color = '#858EA2';
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Row 3: Section Pills - only visible for Bill Payment */}
      {showSectionPills && (
        <div style={{ display: 'flex', gap: '4px', padding: '10px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '8px',
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                fontWeight: activeSection === section.id ? 500 : 400,
                color: activeSection === section.id ? '#0C447C' : '#858EA2',
                background: activeSection === section.id ? '#e6f1fb' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  (e.target as HTMLButtonElement).style.background = '#f5f5f4';
                  (e.target as HTMLButtonElement).style.color = '#192744';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  (e.target as HTMLButtonElement).style.background = 'transparent';
                  (e.target as HTMLButtonElement).style.color = '#858EA2';
                }
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
