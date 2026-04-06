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
  const [product, setProduct] = useState('PRODUCT_A');
  const [state, setState] = useState('');
  const [branch, setBranch] = useState('');
  const [ca, setCA] = useState('');
  const [billCategory, setBillCategory] = useState('');
  const [period, setPeriod] = useState('1M');

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
    <div className="w-full bg-background border-b border-border">
      {/* Row 1: Product Selector */}
      <div className="px-6 py-4 border-b border-border">
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
        >
          <option value="PRODUCT_A">PRODUCT_A</option>
          <option value="PRODUCT_B">PRODUCT_B</option>
        </select>
      </div>

      {/* Row 2: Filters */}
      <div className="px-6 py-4 border-b border-border">
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

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-background-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-action"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Section Pills */}
      <div className="px-6 py-4 flex gap-2 flex-wrap">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-primary-action text-white'
                : 'bg-background-secondary text-foreground border border-border hover:border-primary-action'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
