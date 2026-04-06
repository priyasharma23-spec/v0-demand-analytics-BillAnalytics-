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
    <div className="w-full" style={{ backgroundColor: '#ffffff' }}>
      {/* Row 1: Product Selector */}
      <div className="px-6 py-4" style={{ backgroundColor: '#ffffff', borderBottom: '0.5px solid rgba(0,0,0,0.15)' }}>
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
        >
          <option value="bill-payments">Bill payments</option>
          <option value="invoice-payments">Invoice payments</option>
          <option value="gst">GST</option>
        </select>
      </div>

      {/* Row 2: Filters */}
      <div className="px-6 py-4" style={{ backgroundColor: '#ffffff', borderBottom: '0.5px solid rgba(0,0,0,0.15)' }}>
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setBranch('');
              setCA('');
            }}
            className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
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
            className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action disabled:opacity-50"
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
            className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action disabled:opacity-50"
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
            className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
          >
            <option value="">All Bills</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {/* Period Picker */}
          <div className="flex gap-2 items-center" style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '6px' }}>
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
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
              />
              <span className="text-foreground text-sm">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
              />
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Section Pills */}
      <div className="px-6 py-4 flex gap-2 flex-wrap" style={{ backgroundColor: '#ffffff' }}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: activeSection === section.id ? 500 : 400,
              backgroundColor: activeSection === section.id ? '#e6f1fb' : 'transparent',
              color: activeSection === section.id ? '#0C447C' : '#666666',
              border: activeSection === section.id ? 'none' : '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
  
  return null;
}
