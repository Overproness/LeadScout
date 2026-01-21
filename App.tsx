import React, { useState, useEffect } from 'react';
import { SearchIcon, MapIcon, GlobeIcon, Spinner, DownloadIcon } from './components/Icons';
import { LeadCard } from './components/LeadCard';
import { searchMapLeads, searchWebLeads } from './services/geminiService';
import { Lead, SearchState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    isSearching: false,
    query: '',
    location: '',
    mode: 'web', // default
    results: [],
  });
  
  const [targetCount, setTargetCount] = useState<number>(10);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Attempt to get location on mount for better Maps experience
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.debug("Geolocation denied or error:", err);
        }
      );
    }
  }, []);

  const searchLoop = async (
    query: string, 
    initialResults: Lead[], 
    targetTotal: number, 
    mode: 'web' | 'maps', 
    location: string
  ) => {
    let currentResults = [...initialResults];
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    setState(prev => ({ 
      ...prev, 
      isSearching: true, 
      results: currentResults, 
      error: undefined 
    }));

    while (currentResults.length < targetTotal && consecutiveFailures < MAX_FAILURES) {
      try {
        const excludeNames = currentResults.map(r => r.name);
        let newLeads: Lead[] = [];

        if (mode === 'web') {
          newLeads = await searchWebLeads(query, excludeNames);
        } else {
          const searchQuery = location ? `${query} in ${location}` : query;
          newLeads = await searchMapLeads(searchQuery, userLocation?.lat, userLocation?.lng, excludeNames);
        }

        // Client-side deduplication (in case API returns duplicates despite prompt)
        const uniqueNewLeads = newLeads.filter(
          nl => !currentResults.some(
            ex => ex.name.toLowerCase() === nl.name.toLowerCase()
          )
        );

        if (uniqueNewLeads.length === 0) {
          consecutiveFailures++;
          // Small delay to let API breathe if we are hitting limits or empty results
          await new Promise(r => setTimeout(r, 1000));
        } else {
          consecutiveFailures = 0; // Reset failure counter if we found something
          currentResults = [...currentResults, ...uniqueNewLeads];
          
          // Update state immediately to show progress
          setState(prev => ({
            ...prev,
            results: currentResults
          }));
        }

      } catch (err: any) {
        console.error("Loop iteration error:", err);
        consecutiveFailures++;
        // If it's a critical error we might want to stop, but for now we try a few times
      }
    }

    setState(prev => ({ ...prev, isSearching: false }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.query.trim()) return;
    
    // Start a new search
    searchLoop(state.query, [], targetCount, state.mode, state.location);
  };

  const handleLoadMore = () => {
    // Continue searching to add more to existing
    const newTarget = state.results.length + targetCount; // Try to find X more
    searchLoop(state.query, state.results, newTarget, state.mode, state.location);
  };

  const exportToCSV = () => {
    if (state.results.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'Description', 'Source'];
    const rows = state.results.map(lead => [
      lead.name,
      lead.email || '',
      lead.phone || '',
      lead.website || '',
      lead.address || '',
      lead.description || '',
      lead.sourceUrl || ''
    ].map(field => `"${field?.replace(/"/g, '""')}"`).join(',')); // Escape quotes

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${state.mode}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <SearchIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              LeadScout AI
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">
              Powered by Gemini
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Search Control Panel */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Mode Selector */}
            <div className="flex md:flex-col gap-2 min-w-[160px]">
               <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 hidden md:block">Search Mode</label>
               <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, mode: 'web' }))}
                className={`flex-1 md:flex-none flex items-center px-4 py-3 rounded-xl border transition-all duration-200 ${
                  state.mode === 'web' 
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:border-gray-600'
                }`}
               >
                 <GlobeIcon className="w-5 h-5 mr-3" />
                 <div className="text-left">
                   <div className="font-semibold text-sm">Web Search</div>
                   <div className="text-[10px] opacity-70">Broad categories & emails</div>
                 </div>
               </button>

               <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, mode: 'maps' }))}
                className={`flex-1 md:flex-none flex items-center px-4 py-3 rounded-xl border transition-all duration-200 ${
                  state.mode === 'maps' 
                    ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:border-gray-600'
                }`}
               >
                 <MapIcon className="w-5 h-5 mr-3" />
                 <div className="text-left">
                   <div className="font-semibold text-sm">Local Maps</div>
                   <div className="text-[10px] opacity-70">Physical businesses</div>
                 </div>
               </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Target Criteria
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={state.query}
                    onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                    placeholder={state.mode === 'web' ? "e.g., Marketing Agencies in London" : "e.g., Plumbers"}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    required
                  />
                  <SearchIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-600" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {state.mode === 'maps' ? "Location (Optional)" : "Location Hint (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={state.location}
                    onChange={(e) => setState(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={state.mode === 'maps' ? "e.g., Chicago" : "Added to query"}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-center text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={state.isSearching}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center ${
                    state.mode === 'web'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {state.isSearching ? (
                    <>
                      <Spinner className="w-5 h-5 mr-2" />
                      FETCHING LEADS ({state.results.length})
                    </>
                  ) : (
                    <>
                      FIND {targetCount} LEADS
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="space-y-6 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-mono text-gray-400">
                {state.results.length}
              </span>
              Found Leads
            </h2>

            {state.results.length > 0 && (
              <button 
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>

          {state.error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-200 text-sm">
              Error: {state.error}
            </div>
          )}
          
          {state.isSearching && state.results.length > 0 && (
             <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden">
                <div 
                   className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 animate-pulse" 
                   style={{ width: '100%' }}
                ></div>
             </div>
          )}

          {state.results.length === 0 && !state.isSearching && !state.error && (
            <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
              <div className="mx-auto w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 text-gray-700">
                <SearchIcon className="w-8 h-8" />
              </div>
              <h3 className="text-gray-400 font-medium">No leads found yet</h3>
              <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                Enter a job category or business type above to start extracting leads with Gemini.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.results.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>

          {/* Load More Button */}
          {state.results.length > 0 && (
            <div className="flex justify-center pt-8">
               <button
                  onClick={handleLoadMore}
                  disabled={state.isSearching}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
               >
                  {state.isSearching ? (
                     <>
                        <Spinner className="w-5 h-5 mr-3" />
                        Scanning for more...
                     </>
                  ) : (
                     <>
                        Find {targetCount} More
                     </>
                  )}
               </button>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 pt-6 border-t border-gray-900 text-center text-xs text-gray-600 max-w-2xl mx-auto">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This tool uses AI to aggregate public information from Google Search and Maps. 
          </p>
          <p>
             It does not scrape private databases. Email extraction depends on public availability. 
             Always verify contact information before outreach.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;