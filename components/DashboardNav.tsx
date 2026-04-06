'use client';

import React, { useState } from 'react';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';

interface DashboardNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function DashboardNav({
  activeSection,
  onSectionChange,
}: DashboardNavProps) {
  const [product, setProduct] = useState<'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst'>('bill-payment');
  const [state, setState] = useState('');
  const [branch, setBranch] = useState('');
  const [ca, setCA] = useState('');
  const [billCategory, setBillCategory] = useState('');
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

  const showSectionPills = product === 'bill-payment';

  const periodLabels = {
    '1M': 'Last Month',
    '3M': 'Last 3 Months',
    '6M': 'Last 6 Months',
    '1Y': 'Last Year',
    'Custom': 'Custom Range',
  };

  const getStateOptions = () => {
    return Object.entries(STATES).map(([key, name]) => ({
      value: key,
      label: name,
    }));
  };

  const getBranchOptions = () => {
    if (!state) return [];
    const branches = BRANCHES[state as keyof typeof BRANCHES] || {};
    return Object.entries(branches).map(([key, name]) => ({
      value: key,
      label: name,
    }));
  };

  const getCAOptions = () => {
    if (!branch) return [];
    const caMap = CAS[branch as keyof typeof CAS] || [];
    return caMap.map((ca) => ({
      value: ca,
      label: ca,
    }));
  };

  const getBillCategoryLabel = () => {
    if (!billCategory) return 'All';
    return billCategory === 'PAID' ? 'Paid' : billCategory === 'PENDING' ? 'Pending' : 'Overdue';
  };

  const handleApplyFilter = () => {
    // Trigger filter application logic - filters are already applied via state
    console.log('[v0] Apply Filter clicked', { state, branch, ca, billCategory, period });
  };

  return (
    <nav style={{ backgroundColor: '#ffffff' }}>
      {/* Row 1: Product Tabs */}
      <div style={{ display: 'flex', gap: '32px', padding: '0 20px', borderBottom: '1px solid #efeff1', backgroundColor: '#ffffff' }}>
        {products.map((p) => (
          <button
            key={p.value}
            onClick={() => setProduct(p.value)}
            style={{
              color: product === p.value ? '#192744' : '#858ea2',
              fontWeight: product === p.value ? 600 : 400,
              fontSize: '14px',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: product === p.value ? '2px solid #1a56fe' : '2px solid transparent',
              paddingBottom: '12px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Row 2: Filters */}
      <div style={{ display: 'flex', gap: '12px', padding: '12px 20px', backgroundColor: '#ffffff', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* State dropdown pill */}
        <div style={{ position: 'relative' }}>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setBranch('');
              setCA('');
            }}
            style={{
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #efeff1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '14px',
              color: '#1a56fe',
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              paddingRight: '28px',
            }}
          >
            <option value="">All States</option>
            {getStateOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '16px', height: '16px', color: '#1a56fe' }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
          </svg>
        </div>

        {/* Branch dropdown pill */}
        <div style={{ position: 'relative' }}>
          <select
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setCA('');
            }}
            disabled={!state}
            style={{
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #efeff1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '14px',
              color: '#1a56fe',
              fontWeight: 500,
              appearance: 'none',
              cursor: state ? 'pointer' : 'not-allowed',
              paddingRight: '28px',
              opacity: state ? 1 : 0.5,
            }}
          >
            <option value="">All Branches</option>
            {getBranchOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '16px', height: '16px', color: '#1a56fe' }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
          </svg>
        </div>

        {/* CA dropdown pill */}
        <div style={{ position: 'relative' }}>
          <select
            value={ca}
            onChange={(e) => setCA(e.target.value)}
            disabled={!branch}
            style={{
              background: '#ffffff',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #efeff1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '14px',
              color: '#1a56fe',
              fontWeight: 500,
              appearance: 'none',
              cursor: branch ? 'pointer' : 'not-allowed',
              paddingRight: '28px',
              opacity: branch ? 1 : 0.5,
            }}
          >
            <option value="">All CAs</option>
            {getCAOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '16px', height: '16px', color: '#1a56fe' }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
          </svg>
        </div>

        {/* Date range pill with period dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #efeff1', borderRadius: '8px', padding: '8px 14px' }}>
          <span style={{ color: '#192744', fontSize: '14px', fontWeight: 400 }}>Jan 2023 - Dec 2023</span>
          <div style={{ width: '1px', height: '20px', background: '#efeff1', margin: '0 12px' }}></div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1a56fe',
              fontSize: '14px',
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              paddingRight: '20px',
            }}
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
            <option value="Custom">Custom Range</option>
          </select>
          <svg
            style={{ position: 'absolute', right: '18px', width: '16px', height: '16px', color: '#1a56fe', pointerEvents: 'none' }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
          </svg>
        </div>

        {/* Bill Category pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #efeff1', borderRadius: '8px', padding: '8px 14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#192744' }}>Bill Category</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a56fe' }}>|</span>
          <select
            value={billCategory}
            onChange={(e) => setBillCategory(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1a56fe',
              fontSize: '14px',
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              paddingRight: '4px',
            }}
          >
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        {/* Apply Filter button */}
        <button
          onClick={handleApplyFilter}
          style={{
            background: '#1a56fe',
            color: '#ffffff',
            height: '40px',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            padding: '0 24px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#1b5af4';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#1a56fe';
          }}
        >
          Apply Filter
        </button>
      </div>

      {/* Row 3: Section Pills - only visible for Bill Payment */}
      {showSectionPills && (
        <div style={{ background: '#ffffff', padding: '10px 20px', borderBottom: '1px solid #efeff1', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                background: activeSection === section.id ? '#e6f1fb' : 'transparent',
                color: activeSection === section.id ? '#0C447C' : '#858ea2',
                fontWeight: activeSection === section.id ? 500 : 400,
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
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
