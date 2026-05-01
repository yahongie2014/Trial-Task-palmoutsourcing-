import React from 'react';
import type { FilterState } from '../types';
import { PriceSlider } from './PriceSlider';

interface FilterBarProps {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string) => void;
  propertyTypes: string[];
  minPriceBound: number;
  maxPriceBound: number;
  totalRecords: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  filters, 
  updateFilter, 
  propertyTypes,
  minPriceBound,
  maxPriceBound,
  totalRecords
}) => {
  return (
    <div className="bg-surface-900/50 backdrop-blur-sm border-b border-surface-800 p-4 sticky top-0 z-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 max-w-[1600px] mx-auto items-end">
        
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Search</label>
          <input
            type="text"
            placeholder="Search location, title..."
            className="bg-surface-950 border-surface-800 rounded-lg text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Price Range</label>
          <PriceSlider 
            min={minPriceBound}
            max={maxPriceBound}
            currentMin={Number(filters.minPrice) || minPriceBound}
            currentMax={Number(filters.maxPrice) || maxPriceBound}
            onChange={(min, max) => {
              updateFilter('minPrice', String(min));
              updateFilter('maxPrice', String(max));
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bedrooms</label>
          <select
            className="bg-surface-950 border-surface-800 rounded-lg text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={filters.bedrooms}
            onChange={(e) => updateFilter('bedrooms', e.target.value)}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Bedrooms</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Property Type</label>
          <select
            className="bg-surface-950 border-surface-800 rounded-lg text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={filters.propertyType}
            onChange={(e) => updateFilter('propertyType', e.target.value)}
          >
            <option value="">All Types</option>
            {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 lg:col-span-1 pb-1">
          <button 
            onClick={() => {
              updateFilter('search', '');
              updateFilter('minPrice', '');
              updateFilter('maxPrice', '');
              updateFilter('bedrooms', '');
              updateFilter('propertyType', '');
            }}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
          >
            Clear All
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Records</span>
            <span className="text-sm font-bold text-white leading-none mt-1">{totalRecords}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
