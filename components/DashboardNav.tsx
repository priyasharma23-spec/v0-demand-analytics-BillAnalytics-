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

  const handleApplyFilter = () => {
    console.log('[v0] Apply Filter clicked', { state, branch, ca, billCategory, period });
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

      {/* Row 2: Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
        {/* State filter pill */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={appState.stateF}
            onChange={(e) => {
              onStateChange(e.target.value);
            }}
            style={{
              height: '36px',
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #F3F4F6',
              borderRadius: '8px',
              paddingTop: '0',
              paddingBottom: '0',
              paddingLeft: '14px',
              paddingRight: '28px',
              fontSize: '14px',
              color: '#858EA2',
              fontWeight: 400,
              appearance: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#F3F4F6';
            }}
          >
            <option value="all">All States</option>
            {getStateOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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

        {/* Branch filter pill */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={appState.branchF}
            onChange={(e) => {
              onBranchChange(e.target.value);
            }}
            disabled={appState.stateF === 'all'}
            style={{
              height: '36px',
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #F3F4F6',
              borderRadius: '8px',
              paddingTop: '0',
              paddingBottom: '0',
              paddingLeft: '14px',
              paddingRight: '28px',
              fontSize: '14px',
              color: '#858EA2',
              fontWeight: 400,
              appearance: 'none',
              cursor: appState.stateF !== 'all' ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
              opacity: appState.stateF !== 'all' ? 1 : 0.5,
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
            }}
            onMouseEnter={(e) => {
              if (appState.stateF !== 'all') {
                (e.target as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#F3F4F6';
            }}
          >
            <option value="all">All Branches</option>
            {getBranchOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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

        {/* CA filter pill */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={appState.caF}
            onChange={(e) => onCAChange(e.target.value)}
            disabled={appState.branchF === 'all'}
            style={{
              height: '36px',
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #F3F4F6',
              borderRadius: '8px',
              paddingTop: '0',
              paddingBottom: '0',
              paddingLeft: '14px',
              paddingRight: '28px',
              fontSize: '14px',
              color: '#858EA2',
              fontWeight: 400,
              appearance: 'none',
              cursor: appState.branchF !== 'all' ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
              opacity: appState.branchF !== 'all' ? 1 : 0.5,
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
            }}
            onMouseEnter={(e) => {
              if (appState.branchF !== 'all') {
                (e.target as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#F3F4F6';
            }}
          >
            <option value="all">All CAs</option>
            {getCAOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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

        {/* Date range pill with period dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', background: '#ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #F3F4F6', borderRadius: '8px', paddingTop: '0', paddingBottom: '0', paddingLeft: '14px', paddingRight: '14px', fontFamily: '"Inter", sans-serif' }}>
          <span style={{ fontSize: '14px', color: '#192744', fontWeight: 400, paddingRight: '12px', whiteSpace: 'nowrap' }}>Jan 2023 - Dec 2023</span>
          <div style={{ width: '1px', height: '18px', background: '#F3F4F6', margin: '0 12px' }}></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                onPeriodChange(e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2500D7',
                fontSize: '14px',
                fontWeight: 500,
                appearance: 'none',
                cursor: 'pointer',
                paddingRight: '18px',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              <option value="1M">Last Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last Year</option>
              <option value="Custom">Custom Range</option>
            </select>
            <svg
              style={{
                position: 'absolute',
                right: '0',
                width: '12px',
                height: '12px',
                color: '#2500D7',
                pointerEvents: 'none',
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

        {/* Bill Category pill */}
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', minWidth: '177px', background: '#ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #F3F4F6', borderRadius: '8px', paddingTop: '0', paddingBottom: '0', paddingLeft: '14px', paddingRight: '14px', gap: '8px', fontFamily: '"Inter", sans-serif', transition: 'border-color 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#F3F4F6'; }}>
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#858EA2', whiteSpace: 'nowrap' }}>Bill Category</span>
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#858EA2' }}>|</span>
          <select
            value={appState.billCategory}
            onChange={(e) => onBillCategoryChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858EA2',
              fontSize: '14px',
              fontWeight: 400,
              appearance: 'none',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              paddingRight: '4px',
            }}
          >
            <option value="all">All categories</option>
            {BILL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Apply Filter Button */}
        <button
          onClick={handleApplyFilter}
          style={{
            height: '36px',
            background: '#2500D7',
            color: '#ffffff',
            borderRadius: '8px',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            padding: '0 20px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#1f00b8';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#2500D7';
          }}
        >
          Apply Filter
        </button>
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
