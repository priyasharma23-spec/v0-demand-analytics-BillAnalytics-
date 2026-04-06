'use client';

import React, { useState } from 'react';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';

interface DashboardNavProps {
  activeProduct: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst';
  onProductChange: (product: 'bill-payment' | 'vendor-payment' | 'rental-payment' | 'gst') => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function DashboardNav({
  activeProduct,
  onProductChange,
  activeSection,
  onSectionChange,
}: DashboardNavProps) {
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

  const showSectionPills = activeProduct === 'bill-payment';

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
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeProduct === p.value ? '2px solid #2500D7' : '2px solid transparent',
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
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setBranch('');
              setCA('');
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
            <option value="">All States</option>
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
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setCA('');
            }}
            disabled={!state}
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
              cursor: state ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
              opacity: state ? 1 : 0.5,
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
            }}
            onMouseEnter={(e) => {
              if (state) {
                (e.target as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#F3F4F6';
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
            value={ca}
            onChange={(e) => setCA(e.target.value)}
            disabled={!branch}
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
              cursor: branch ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
              opacity: branch ? 1 : 0.5,
              transition: 'border-color 0.2s',
              fontFamily: '"Inter", sans-serif',
            }}
            onMouseEnter={(e) => {
              if (branch) {
                (e.target as HTMLSelectElement).style.borderBottomColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLSelectElement).style.borderBottomColor = '#F3F4F6';
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
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', background: '#ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #F3F4F6', borderRadius: '8px', padding: '0 14px', fontFamily: '"Inter", sans-serif' }}>
          <span style={{ fontSize: '14px', color: '#192744', fontWeight: 400, paddingRight: '12px', whiteSpace: 'nowrap' }}>Jan 2023 - Dec 2023</span>
          <div style={{ width: '1px', height: '18px', background: '#F3F4F6', margin: '0 12px' }}></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
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
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', background: '#ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #F3F4F6', borderRadius: '8px', padding: '0 14px', gap: '8px', fontFamily: '"Inter", sans-serif' }}>
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#858EA2', whiteSpace: 'nowrap' }}>Bill Category</span>
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#858EA2' }}>|</span>
          <select
            value={billCategory}
            onChange={(e) => setBillCategory(e.target.value)}
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
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
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
