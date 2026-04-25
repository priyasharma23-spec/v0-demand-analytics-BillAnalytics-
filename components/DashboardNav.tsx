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
  analyticsMode: 'basic' | 'advanced';
  onModeChange: (mode: 'basic' | 'advanced') => void;
  basicSection?: string;
  onBasicSectionChange?: (section: string) => void;
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
  analyticsMode,
  onModeChange,
  basicSection = 'summary',
  onBasicSectionChange,
}: DashboardNavProps) {
  const [localState, setLocalState] = useState('');
  const [localBranch, setLocalBranch] = useState('');
  const [localCA, setLocalCA] = useState('');
  const [localBillCategory, setLocalBillCategory] = useState('all');
  const [period, setPeriod] = useState('1Y');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'billers', label: 'Billers' },
    { id: 'excess-demand', label: 'Excess demand' },
    { id: 'consumption', label: 'Consumption' },
    { id: 'leakages', label: 'Leakages' },
    { id: 'savings', label: 'Savings' },
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
    switch (sectionId) {
      case 'overview':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      case 'billers':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 5h10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8h7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 11h7" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      case 'excess-demand':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8.5 2L4 7.5h5L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'consumption':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 10l3-3.5 2.5 2L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.5 4H11v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'leakages':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M7 2.5L1.5 11.5h11L7 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7" cy="10" r="0.5" fill="currentColor"/>
          </svg>
        );
      case 'savings':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 9.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5 11.5l2 1 2-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 5.5C5.5 5.5 6 4.5 7 4.5s1.5.8 1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderBottom: '1px solid #F3F4F6' }}>
      {/* Analytics mode toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 24px',
        background: '#fff',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode toggle pill */}
          <div style={{ display: 'flex', gap: '3px', background: '#f5f5f4', borderRadius: '10px', padding: '3px' }}>
            {([
              { id: 'basic', label: 'Basic Analytics', icon: '◎' },
              { id: 'advanced', label: 'Advanced Analytics', icon: '⬡', badge: 'BILL COPY' },
            ] as const).map(mode => (
              <button
                key={mode.id}
                onClick={() => onModeChange?.(mode.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  background: analyticsMode === mode.id ? '#fff' : 'transparent',
                  color: analyticsMode === mode.id ? '#192744' : '#9b9b96',
                  boxShadow: analyticsMode === mode.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '10px', color: analyticsMode === mode.id ? '#2500D7' : '#c4c4c4' }}>{mode.icon}</span>
                {mode.label}
                {'badge' in mode && (
                  <span style={{
                    fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
                    background: analyticsMode === mode.id ? '#EBEAFF' : '#f0f0f0',
                    color: analyticsMode === mode.id ? '#2500D7' : '#b0b0b0',
                    letterSpacing: '0.04em',
                  }}>
                    {mode.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Breadcrumb — only shown in Advanced */}
          {analyticsMode === 'advanced' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#9b9b96' }}>
              <span>·</span>
              <span>Bill copy data connected</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block', marginLeft: '2px' }} />
            </div>
          )}
        </div>

        {/* Right — data freshness */}
        <div style={{ fontSize: '11px', color: '#b0b0b0' }}>
          Updated daily · Apr 2025
        </div>
      </div>

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

      {/* Section Navigation - Secondary (only for Bill Payment AND Advanced mode) */}
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
            {analyticsMode === 'basic' ? (
              <React.Fragment>
                {[{id:'summary',label:'Summary'},{id:'locations',label:'Locations'},{id:'trends',label:'Trends'},{id:'billers',label:'Billers'}].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onBasicSectionChange?.(s.id)}
                    style={{
                      height: '32px',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '13px',
                      fontWeight: basicSection === s.id ? 600 : 500,
                      color: basicSection === s.id ? '#192744' : '#858EA2',
                      background: basicSection === s.id ? '#ffffff' : 'transparent',
                      border: basicSection === s.id ? '1px solid #E5E7EB' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </React.Fragment>
            ) : (
              <React.Fragment>
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
              </React.Fragment>
            )}
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
