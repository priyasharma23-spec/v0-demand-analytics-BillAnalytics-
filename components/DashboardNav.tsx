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

  const getSectionIcon = (sectionId: string) => {
    const iconProps = {
      width: '16px',
      height: '16px',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (sectionId) {
      case 'overview':
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'excess-demand':
        return (
          <svg {...iconProps}>
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5h4v6h-4z" />
            <path d="M3 11h4v10H3z" />
            <path d="M10 13h4v8h-4z" />
          </svg>
        );
      case 'consumption':
        return (
          <svg {...iconProps}>
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5h4v6h-4z" />
            <path d="M3 11h4v10H3z" />
            <path d="M10 13h4v8h-4z" />
          </svg>
        );
      case 'leakages':
        return (
          <svg {...iconProps}>
            <path d="M12 2C12 2 6 8 6 13c0 3.31 2.69 6 6 6s6-2.69 6-6c0-5-6-11-6-11z" />
            <path d="M12 13v2" />
            <path d="M9 18h6" />
          </svg>
        );
      case 'savings':
        return (
          <svg {...iconProps}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" />
            <path d="M13 9h3" />
          </svg>
        );
      case 'optimization':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6m0 6v6" />
            <path d="M4.22 4.22l4.24 4.24m2.08 2.08l4.24 4.24" />
            <path d="M1 12h6m6 0h6" />
            <path d="M4.22 19.78l4.24-4.24m2.08-2.08l4.24-4.24" />
          </svg>
        );
      default:
        return null;
    }
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
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getSectionIcon(section.id)}
                </span>
                {section.label}
              </button>
            ))}
          </div>

          {/* Bill Category Filter - Right side */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={appState.billCategory}
              onChange={(e) => onBillCategoryChange(e.target.value)}
              style={{
                height: '32px',
                background: '#ffffff',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                borderBottomLeftRadius: '4px',
                borderBottomRightRadius: '4px',
                paddingTop: '6px',
                paddingBottom: '6px',
                paddingLeft: '10px',
                paddingRight: '28px',
                fontSize: '13px',
                color: '#858EA2',
                fontWeight: 500,
                appearance: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: '"Inter", sans-serif',
                borderTop: '1px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
                borderBottom: '1px solid #E5E7EB',
                borderLeft: '1px solid #E5E7EB',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderTopColor = '#D0D3DB';
                (e.currentTarget as HTMLSelectElement).style.borderRightColor = '#D0D3DB';
                (e.currentTarget as HTMLSelectElement).style.borderBottomColor = '#D0D3DB';
                (e.currentTarget as HTMLSelectElement).style.borderLeftColor = '#D0D3DB';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderTopColor = '#E5E7EB';
                (e.currentTarget as HTMLSelectElement).style.borderRightColor = '#E5E7EB';
                (e.currentTarget as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
                (e.currentTarget as HTMLSelectElement).style.borderLeftColor = '#E5E7EB';
              }}
            >
              <option value="all">All categories</option>
              {BILL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <svg
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                width: '12px',
                height: '12px',
                color: '#858EA2',
                flexShrink: 0,
              }}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
            </svg>
          </div>
        </div>
      )}
    </nav>
  );
}
