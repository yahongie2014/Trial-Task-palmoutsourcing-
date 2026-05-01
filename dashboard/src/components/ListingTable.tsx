import React from 'react';
import type { Listing, SortState } from '../types';
import { formatPrice } from '../utils/price';

interface ListingTableProps {
  listings: Listing[];
  sort: SortState;
  toggleSort: (key: SortState['key']) => void;
}

export const ListingTable: React.FC<ListingTableProps> = ({ listings, sort, toggleSort }) => {
  const SortIndicator = ({ column }: { column: SortState['key'] }) => {
    if (sort.key !== column) return <span className="ml-1 opacity-20 text-[10px]">↕</span>;
    return <span className="ml-1 text-indigo-400">{sort.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-surface-800 bg-surface-900/40">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-800/50">
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => toggleSort('title')}
            >
              Title <SortIndicator column="title" />
            </th>
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors w-32"
              onClick={() => toggleSort('price')}
            >
              Price <SortIndicator column="price" />
            </th>
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors w-32 text-center"
              onClick={() => toggleSort('bedrooms')}
            >
              Beds <SortIndicator column="bedrooms" />
            </th>
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => toggleSort('property_type')}
            >
              Type <SortIndicator column="property_type" />
            </th>
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => toggleSort('location')}
            >
              Location <SortIndicator column="location" />
            </th>
            <th 
              className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors w-32 text-right"
              onClick={() => toggleSort('added_date')}
            >
              Added <SortIndicator column="added_date" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-800/30">
          {listings.map((l) => (
            <tr key={l.property_id} className="hover:bg-indigo-500/5 transition-colors group">
              <td className="px-4 py-3">
                <a 
                  href={l.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1"
                >
                  {l.title}
                </a>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-emerald-400 font-bold">
                {formatPrice(l.price)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-400 text-center">
                {l.bedrooms ?? '—'}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-800 text-indigo-300 border border-surface-700">
                  {l.property_type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">
                {l.location || l.postcode}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 text-right font-mono">
                {l.added_date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
