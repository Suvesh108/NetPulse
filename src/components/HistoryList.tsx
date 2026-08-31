import React, { useState } from 'react';
import { Trash2, Download, Search, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { SpeedTestResult } from '../types';

interface HistoryListProps {
  results: SpeedTestResult[];
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  unit?: 'Mbps' | 'MB/s';
}

export default function HistoryList({ results, onDeleteResult, onClearAll, unit = 'Mbps' }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const factor = unit === 'MB/s' ? 8 : 1;

  // Stats Calculations
  const totalTests = results.length;
  
  const avgDownload = totalTests > 0
    ? ((results.reduce((acc, curr) => acc + curr.downloadMbps, 0) / totalTests) / factor).toFixed(1)
    : '0.0';
    
  const avgUpload = totalTests > 0
    ? ((results.reduce((acc, curr) => acc + curr.uploadMbps, 0) / totalTests) / factor).toFixed(1)
    : '0.0';

  const bestDownload = totalTests > 0
    ? (Math.max(...results.map(r => r.downloadMbps)) / factor).toFixed(1)
    : '0.0';

  const avgPing = totalTests > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.pingMs, 0) / totalTests)
    : '0';

  // Export results as structured JSON report
  const handleExportData = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'netpulse_speedtests_history.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.warn('Failed to export data:', error);
    }
  };

  const filteredResults = results.filter(result => {
    return result.serverName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 flex-1 min-h-0 overflow-hidden h-full" id="history-section">
      
      {/* HISTORICAL STATS DASHBOARD (Distinct accent color per card) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        {/* STAT 1: Total Tests (Monochrome Slate) */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800"></div>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-zinc-600 uppercase">Total Tests</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-[#09090B]">{totalTests}</span>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider ml-1">Runs</span>
          </div>
        </div>

        {/* STAT 2: Peak Download (Emerald) */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-emerald-700 uppercase">Peak Download</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-emerald-600">{bestDownload}</span>
            <span className="text-xs text-emerald-600 font-bold ml-1">{unit}</span>
          </div>
        </div>

        {/* STAT 3: Avg Download (Teal / Sky) */}
        <div className="bg-white border border-teal-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-teal-700 uppercase">Avg Download</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-teal-600">{avgDownload}</span>
            <span className="text-xs text-teal-600 font-bold ml-1">{unit}</span>
          </div>
        </div>

        {/* STAT 4: Avg Ping (Amber) */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-amber-700 uppercase">Avg Ping</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-amber-600">{avgPing}</span>
            <span className="text-xs text-amber-600 font-bold ml-1">ms</span>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL PANEL Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by server name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F4F4F5] text-sm text-[#09090B] placeholder:text-zinc-400 border border-[#E4E4E7] rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
          />
        </div>

        {totalTests > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              id="export-csv-btn"
              onClick={handleExportData}
              className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-[#09090B] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#E4E4E7] transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export JSON Report</span>
            </button>
            
            {!showConfirmClear ? (
              <button
                id="clear-all-trigger"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History Logs</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in bg-white border border-rose-200 p-1.5 rounded-lg shadow-sm">
                <span className="text-[11px] text-rose-600 font-semibold px-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" /> Are you sure?
                </span>
                <button
                  id="confirm-clear-btn"
                  onClick={() => {
                    onClearAll();
                    setShowConfirmClear(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-[#09090B] text-[11px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILED SPEED LOG LIST & DATA TABLE */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col" id="history-list-container">
        {filteredResults.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center gap-4 text-zinc-500">
            <div className="p-4 bg-zinc-100 rounded-full border border-[#E4E4E7]">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-sans font-extrabold tracking-wider text-base text-[#09090B]">No Speed test history</h3>
            <p className="font-sans text-xs max-w-sm text-zinc-500 leading-relaxed">
              {searchTerm 
                ? 'No records match your active search filter. Clear the search term to show elements.' 
                : 'Perform speed tests on the Speed tab first. Your results will be cataloged here securely.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
            {/* Desktop Table View */}
            <table className="w-full text-left font-sans border-collapse hidden md:table">
              <thead className="sticky top-0 z-10 bg-[#F4F4F5]">
                <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[10px] tracking-[0.18em] text-zinc-600 uppercase font-extrabold">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Test Server</th>
                  <th className="px-6 py-4 text-right">Download</th>
                  <th className="px-6 py-4 text-right">Upload</th>
                  <th className="px-6 py-4 text-right">Ping / Jitter</th>
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {filteredResults.map((result) => {
                  const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <tr key={result.id} className="hover:bg-zinc-50 transition-colors group">
                      {/* Timestamp Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[#09090B] font-black text-sm font-sans tracking-wide">{localDateStr}</span>
                          <span className="text-xs text-zinc-500 font-semibold">{localFullDate}</span>
                        </div>
                      </td>

                      {/* Test Server Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#09090B] text-sm font-extrabold flex items-center gap-1.5 flex-wrap">
                            <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Live Speed Test
                          </span>
                          <span className="text-xs text-zinc-500 max-w-[200px] truncate">{result.serverName}</span>
                        </div>
                      </td>

                      {/* Download (Emerald) */}
                      <td className="px-6 py-4 text-right items-baseline">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-base text-emerald-600">{(result.downloadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Upload (Violet) */}
                      <td className="px-6 py-4 text-right items-baseline">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-base text-violet-600">{(result.uploadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-violet-600 font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Ping (Amber) and Jitter (Indigo) */}
                      <td className="px-6 py-4 text-right font-mono">
                        <div className="flex flex-col text-xs gap-0.5">
                          <span className="font-semibold text-amber-700">{result.pingMs} ms ping</span>
                          <span className="text-indigo-700 text-[11px]">{result.jitterMs} ms jitter</span>
                        </div>
                      </td>

                      {/* Single Trash Action */}
                      <td className="px-4 py-4 text-center">
                        <button
                          id={`history-delete-${result.id}`}
                          onClick={() => onDeleteResult(result.id)}
                          className="p-1 px-2.5 rounded bg-transparent hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete test metrics log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards Stack */}
            <div className="grid grid-cols-1 divide-y divide-[#E4E4E7] md:hidden">
              {filteredResults.map((result) => {
                const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={result.id} className="p-4 flex flex-col gap-4 hover:bg-zinc-50">
                    
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#09090B] font-bold text-sm font-sans">{localDateStr}</span>
                          <span className="text-zinc-500 text-xs">• {localFullDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-zinc-500 text-xs truncate max-w-[200px]">
                            {result.serverName}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onDeleteResult(result.id)}
                        className="p-2 -mr-2 text-zinc-400 hover:text-rose-600 bg-zinc-100 rounded-full cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Speeds Metric block with distinct colors */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F4F4F5] p-3 rounded-xl border border-[#E4E4E7]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Download</span>
                        <span className="font-sans font-black text-emerald-600 text-sm mt-1">
                          {(result.downloadMbps / factor).toFixed(1)} <span className="text-[9px] text-emerald-600 font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-violet-700 font-bold uppercase tracking-wider">Upload</span>
                        <span className="font-sans font-black text-violet-600 text-sm mt-1">
                          {(result.uploadMbps / factor).toFixed(1)} <span className="text-[9px] text-violet-600 font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col font-mono">
                        <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Latency</span>
                        <span className="text-xs text-amber-800 mt-1 font-semibold">
                          {result.pingMs}ms P
                        </span>
                        <span className="text-[10px] text-indigo-700">
                          {result.jitterMs}ms J
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
