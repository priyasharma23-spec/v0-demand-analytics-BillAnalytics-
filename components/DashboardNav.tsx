'use client';

import React, { useState } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { STATES, BRANCHES, CAS } from '@/lib/calculations';

interface DashboardNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function DashboardNav({
  activeSection,
  onSectionChange,
}: DashboardNavProps) {
  const [product, setProduct] = useState('bill-payments');
  const [state, setState] = useState('');
  const [branch, setBranch] = useState('');
  const [ca, setCA] = useState('');
  const [billCategory, setBillCategory] = useState('');
  const [period, setPeriod] = useState('1Y');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'excess-demand', label: 'Excess demand' },
    { id: 'consumption', label: 'Consumption' },
    { id: 'leakages', label: 'Leakages' },
    { id: 'savings', label: 'Savings' },
    { id: 'optimization', label: 'Optimization' },
  ];

  const periods = ['1M', '3M', '6M', '1Y', 'Custom'];

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
    const caMap = CAS[branch as keyof typeof CAS] || {};
    return Object.entries(caMap).map(([key, name]) => ({
      value: key,
      label: name,
    }));
  };

  return (
    <nav>
      {/* Row 1: Product Selector */}
      <div className="product-bar">
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        >
          <option value="bill-payments">Bill payments</option>
          <option value="invoice-payments">Invoice payments</option>
          <option value="gst">GST</option>
        </select>
      </div>

      {/* Row 2: Filters */}
      <div className="filter-bar">
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setBranch('');
            setCA('');
          }}
        >
          <option value="">All States</option>
          {getStateOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            setCA('');
          }}
          disabled={!state}
        >
          <option value="">All Branches</option>
          {getBranchOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={ca}
          onChange={(e) => setCA(e.target.value)}
          disabled={!branch}
        >
          <option value="">All CAs</option>
          {getCAOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={billCategory}
          onChange={(e) => setBillCategory(e.target.value)}
        >
          <option value="">All Bills</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        {/* Period Picker */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '6px', display: 'flex', gap: '4px', alignItems: 'center' }}>
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                if (p !== 'Custom') {
                  setShowCustomDate(false);
                } else {
                  setShowCustomDate(true);
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: period === p ? 500 : 400,
                backgroundColor: period === p ? '#ffffff' : 'transparent',
                color: period === p ? '#0C447C' : '#666666',
                border: period === p ? '1px solid #e0e0e0' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {showCustomDate && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                padding: '5px 26px 5px 9px',
                backgroundColor: '#f5f5f4',
                border: '0.5px solid rgba(0,0,0,0.30)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#1a1a18',
              }}
            />
            <span style={{ fontSize: '12px', color: '#1a1a18' }}>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                padding: '5px 26px 5px 9px',
                backgroundColor: '#f5f5f4',
                border: '0.5px solid rgba(0,0,0,0.30)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#1a1a18',
              }}
            />
          </div>
        )}
      </div>

      {/* Row 3: Section Pills */}
      <div className="section-bar">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={activeSection === section.id ? 'active' : ''}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
