import React, { useState } from 'react';
import { Trash2, Download, Search, Calendar, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Layers, HardDrive } from 'lucide-react';
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

  const handleExportData = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'netpulse_history_report.json');
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
    <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-3 pb-24 md:pb-0 flex-1 min-h-0 h-full select-none animate-fade-in" id="history-section">
      
      {/* 1. MODERN ANALYTICS 4-BENTO CARDS (Compact) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        
        {/* CARD 1: Total Runs (Blue / Slate) */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">Total Tests</span>
              <span className="text-[9px] text-slate-400 font-medium">Logged Runs</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-2xl font-black text-slate-900 tracking-tight">{totalTests}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Runs</span>
          </div>
        </div>

        {/* CARD 2: Peak Download (Emerald) */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Peak Download</span>
              <span className="text-[9px] text-slate-400 font-medium">Fastest Inbound</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-2xl font-black text-slate-900 tracking-tight">{bestDownload}</span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{unit}</span>
          </div>
        </div>

        {/* CARD 3: Avg Download (Teal / Cyan) */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">Avg Download</span>
              <span className="text-[9px] text-slate-400 font-medium">Overall Inbound</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-2xl font-black text-slate-900 tracking-tight">{avgDownload}</span>
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{unit}</span>
          </div>
        </div>

        {/* CARD 4: Avg Latency (Amber) */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Avg Latency</span>
              <span className="text-[9px] text-slate-400 font-medium">Response Time</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-2xl font-black text-slate-900 tracking-tight">{avgPing}</span>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">ms</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CONTROL TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search test logs by server..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
          />
        </div>

        {totalTests > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="export-csv-btn"
              onClick={handleExportData}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export</span>
            </button>
            
            {!showConfirmClear ? (
              <button
                id="clear-all-trigger"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200/80 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 animate-fade-in bg-white border border-rose-200 p-0.5 rounded-lg shadow-sm">
                <span className="text-[10px] text-rose-600 font-semibold px-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" /> Clear?
                </span>
                <button
                  id="confirm-clear-btn"
                  onClick={() => {
                    onClearAll();
                    setShowConfirmClear(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. SCROLLABLE DATA TABLE WITH FROZEN STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm flex-1 min-h-0 flex flex-col border border-slate-200 overflow-hidden" id="history-list-container">
        {filteredResults.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80 text-blue-600 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-sm text-slate-800">No test records found</h3>
            <p className="font-sans text-xs max-w-xs text-slate-400 leading-relaxed">
              {searchTerm 
                ? 'No logs matched your search. Clear your search term to view all results.' 
                : 'Perform speed tests on the Speed Test tab to log your connection performance here.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[calc(100vh-270px)]">
            {/* Desktop Table View */}
            <table className="w-full text-left font-sans border-collapse hidden md:table">
              <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-xs">
                <tr className="text-[10px] tracking-wider text-slate-600 uppercase font-black">
                  <th className="px-5 py-2.5 bg-slate-100">Timestamp</th>
                  <th className="px-5 py-2.5 bg-slate-100">Server Node</th>
                  <th className="px-5 py-2.5 bg-slate-100 text-right">Download</th>
                  <th className="px-5 py-2.5 bg-slate-100 text-right">Upload</th>
                  <th className="px-5 py-2.5 bg-slate-100 text-right">Ping / Jitter</th>
                  <th className="px-4 py-2.5 bg-slate-100 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => {
                  const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <tr key={result.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Timestamp */}
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold text-xs">{localDateStr}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{localFullDate}</span>
                        </div>
                      </td>

                      {/* Server Node */}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Zap className="w-3 h-3" />
                          </div>
                          <span className="text-xs text-slate-800 font-bold truncate max-w-[220px]">{result.serverName}</span>
                        </div>
                      </td>

                      {/* Download */}
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-sm text-emerald-600">{(result.downloadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Upload */}
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-sm text-violet-600">{(result.uploadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-violet-600 font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Ping & Jitter */}
                      <td className="px-5 py-2.5 text-right font-mono">
                        <div className="flex flex-col text-xs gap-0.5">
                          <span className="font-bold text-amber-700">{result.pingMs} ms</span>
                          <span className="text-indigo-700 text-[10px]">{result.jitterMs} ms jitter</span>
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td className="px-4 py-2.5 text-center">
                        <button
                          id={`history-delete-${result.id}`}
                          onClick={() => onDeleteResult(result.id)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards Stack */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:hidden">
              {filteredResults.map((result) => {
                const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={result.id} className="p-3 flex flex-col gap-2.5 hover:bg-slate-50/50">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Zap className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-slate-900 font-bold text-xs">{localDateStr} • {localFullDate}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">{result.serverName}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onDeleteResult(result.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-md cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-emerald-800 font-bold uppercase">Download</span>
                        <span className="font-sans font-black text-emerald-600 text-xs mt-0.5">
                          {(result.downloadMbps / factor).toFixed(1)} <span className="text-[9px] font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-violet-800 font-bold uppercase">Upload</span>
                        <span className="font-sans font-black text-violet-600 text-xs mt-0.5">
                          {(result.uploadMbps / factor).toFixed(1)} <span className="text-[9px] font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col font-mono">
                        <span className="text-[9px] text-amber-800 font-bold uppercase">Latency</span>
                        <span className="text-xs text-amber-700 font-bold mt-0.5">
                          {result.pingMs}ms
                        </span>
                        <span className="text-[9px] text-indigo-700">
                          ±{result.jitterMs}ms
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
