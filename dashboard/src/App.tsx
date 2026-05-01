import React from 'react';
import { useDashboard } from './hooks/useDashboard';
import { StatsCard } from './components/StatsCard';
import { FilterBar } from './components/FilterBar';
import { ListingTable } from './components/ListingTable';
import { compactPrice } from './utils/price';
import './index.css';

const App: React.FC = () => {
  const { 
    listings, 
    loading, 
    error, 
    filters, 
    updateFilter, 
    sort, 
    toggleSort, 
    page, 
    setPage, 
    totalPages, 
    stats,
    propertyTypes,
    totalFiltered
  } = useDashboard();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-950 p-8 text-center">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-200 mb-2">Something went wrong</h2>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="bg-surface-900 border-b border-surface-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">Hidden Deals</h1>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1 inline-block">Ops Dashboard v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-500">Live API</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 pt-6 bg-surface-950">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            label="Filtered Listings" 
            value={loading ? '...' : totalFiltered} 
            color="indigo"
            trend={loading ? undefined : `from ${stats.total} total`}
          />
          <StatsCard 
            label="Avg. Property Price" 
            value={loading ? '...' : compactPrice(stats.avgPrice)} 
            color="emerald"
            trend={loading ? undefined : 'Current market average'}
          />
          <StatsCard 
            label="Most Affordable" 
            value={loading || !stats.cheapest ? '...' : compactPrice(parsePrice(stats.cheapest.price))} 
            color="amber"
            trend={stats.cheapest?.location || 'Lowest entry point'}
          />
          <StatsCard 
            label="Prime Property" 
            value={loading || !stats.mostExpensive ? '...' : compactPrice(parsePrice(stats.mostExpensive.price))} 
            color="rose"
            trend={stats.mostExpensive?.location || 'Premium listing'}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto">
        
        {/* Sticky Filters */}
        <FilterBar 
          filters={filters} 
          updateFilter={updateFilter} 
          propertyTypes={propertyTypes} 
          minPriceBound={stats.dataMinPrice}
          maxPriceBound={stats.dataMaxPrice}
          totalRecords={stats.total}
        />

        {/* Listings Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
              <div className="w-12 h-12 border-4 border-surface-800 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <span className="text-slate-500 font-medium">Crunching data...</span>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
              <div className="text-6xl mb-4 grayscale opacity-20">🔍</div>
              <span className="text-slate-500 font-medium">No listings found matching your criteria.</span>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-indigo-400 font-semibold hover:text-indigo-300"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="animate-slide-up">
              <ListingTable 
                listings={listings} 
                sort={sort} 
                toggleSort={toggleSort} 
              />

              {/* Pagination */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pb-12">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-900 border border-surface-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-800 transition-colors"
                  >
                    «
                  </button>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-900 border border-surface-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-800 transition-colors"
                  >
                    ‹
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const range = 2; // How many pages to show around the current page
                      
                      for (let i = 1; i <= totalPages; i++) {
                        if (
                          i === 1 || // Always show first
                          i === totalPages || // Always show last
                          (i >= page - range && i <= page + range) // Show pages around current
                        ) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                                i === page
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                  : "bg-surface-900 border-surface-800 text-slate-400 hover:bg-surface-800 hover:text-white"
                              }`}
                            >
                              {i}
                            </button>
                          );
                        } else if (
                          i === page - range - 1 ||
                          i === page + range + 1
                        ) {
                          pages.push(
                            <span key={`ell-${i}`} className="w-8 text-center text-slate-600 font-bold">
                              ...
                            </span>
                          );
                        }
                      }
                      return pages;
                    })()}
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-900 border border-surface-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-800 transition-colors"
                  >
                    ›
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-900 border border-surface-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-800 transition-colors"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default App;

function parsePrice(str: string | undefined | null): number {
  if (!str) return 0;
  return Number(str.replace(/[£,\s]/g, "")) || 0;
}
