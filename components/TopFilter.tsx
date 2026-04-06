'use client';

import React, { useState } from 'react';

interface Entity {
  name: string;
  type: 'state' | 'branch' | 'ca';
}

interface TopFilterProps {
  pinnedEntities?: Entity[];
  recentEntities?: Entity[];
  onSearch?: (query: string) => void;
  onDateRangeChange?: (range: string) => void;
  onApply?: () => void;
}

export default function TopFilter({
  pinnedEntities = [
    { name: 'Maharashtra', type: 'state' },
    { name: 'Mumbai North', type: 'branch' },
    { name: 'MH-MN-0101', type: 'ca' },
    { name: 'DI-DS-4202', type: 'ca' },
  ],
  recentEntities = [
    { name: 'Delhi South', type: 'branch' },
    { name: 'Gujarat', type: 'state' },
    { name: 'KA-BE-1103', type: 'ca' },
  ],
  onSearch,
  onDateRangeChange,
  onApply,
}: TopFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('1Y');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleDateChange = (value: string) => {
    setDateRange(value);
    onDateRangeChange?.(value);
  };

  const handleApply = () => {
    onApply?.();
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'state':
        return '#1755C8';
      case 'branch':
        return '#1755C8';
      case 'ca':
        return '#192744';
      default:
        return '#1755C8';
    }
  };

  const EntityChip = ({ entity }: { entity: Entity }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: '#fff',
        borderRadius: '16px',
        fontSize: '11px',
        color: '#192744',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '0.5px solid rgba(0,0,0,0.08)',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1755C8'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)'}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getEntityColor(entity.type),
        }}
      />
      {entity.name}
    </div>
  );

  return (
    <div style={{ background: '#fff', padding: '16px 24px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
      {/* Search, date range, and apply button row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            border: '0.5px solid rgba(0,0,0,0.15)',
            borderRadius: '8px',
            flex: 1,
            background: '#f9f9f9',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#858ea2', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search state, branch, or CA number..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: '#192744',
              outline: 'none',
            }}
          />
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '13px', color: '#192744', fontWeight: 500 }}>Apr 2024 – Mar 2025</span>
          <select
            value={dateRange}
            onChange={e => handleDateChange(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '0.5px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#192744',
              background: '#fff',
              cursor: 'pointer',
              appearance: 'none',
              paddingRight: '22px',
            }}
          >
            <option value="1M">1M</option>
            <option value="3M">3M</option>
            <option value="6M">6M</option>
            <option value="1Y">1Y</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Apply button */}
        <button
          onClick={handleApply}
          style={{
            padding: '8px 20px',
            background: '#2500D7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a00a8'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#2500D7'}
        >
          Apply
        </button>
      </div>

      {/* Pinned and recent entities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Pinned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#9b9b96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pinned
          </span>
          {pinnedEntities.map(entity => (
            <EntityChip key={`${entity.type}-${entity.name}`} entity={entity} />
          ))}
        </div>

        {/* Recent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#9b9b96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recent
          </span>
          {recentEntities.map(entity => (
            <EntityChip key={`${entity.type}-${entity.name}`} entity={entity} />
          ))}
        </div>
      </div>
    </div>
  );
}
