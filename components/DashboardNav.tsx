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
    <nav style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      {/* Product Navigation - Primary */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        padding: '12px 24px', 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #F3F4F6',
        alignItems: 'center'
      }}>
        {products.map((p) => (
          <button
            key={p.value}
            onClick={() => onProductChange(p.value as any)}
            style={{
              padding: '8px 0',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              fontWeight: activeProduct === p.value ? 600 : 500,
              color: activeProduct === p.value ? '#2500D7' : '#858EA2',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeProduct === p.value ? '2px solid #2500D7' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              position: 'relative',
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

      {/* Section Navigation - Secondary (only for Bill Payment) */}
      {showSectionPills && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '10px 24px', 
          backgroundColor: '#f5f6fa',
          alignItems: 'center'
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                height: '32px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                fontWeight: activeSection === section.id ? 600 : 500,
                color: activeSection === section.id ? '#192744' : '#858EA2',
                background: activeSection === section.id ? '#ffffff' : 'transparent',
                borderTop: activeSection === section.id ? '1px solid #E5E7EB' : 'none',
                borderRight: activeSection === section.id ? '1px solid #E5E7EB' : 'none',
                borderBottom: activeSection === section.id ? '1px solid #E5E7EB' : 'none',
                borderLeft: activeSection === section.id ? '1px solid #E5E7EB' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                  (e.currentTarget as HTMLButtonElement).style.borderTop = '1px solid #F3F4F6';
                  (e.currentTarget as HTMLButtonElement).style.borderRight = '1px solid #F3F4F6';
                  (e.currentTarget as HTMLButtonElement).style.borderBottom = '1px solid #F3F4F6';
                  (e.currentTarget as HTMLButtonElement).style.borderLeft = '1px solid #F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderTop = 'none';
                  (e.currentTarget as HTMLButtonElement).style.borderRight = 'none';
                  (e.currentTarget as HTMLButtonElement).style.borderBottom = 'none';
                  (e.currentTarget as HTMLButtonElement).style.borderLeft = 'none';
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
