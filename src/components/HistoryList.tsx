import React, { useState } from 'react';
import { Trash2, Download, Search, Info, TrendingUp, Calendar, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
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
      
      {/* HISTORICAL STATS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        {/* STAT 1 */}
        <div className="bg-[#080d19]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-[#94A3B8] uppercase">Total Tests</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-white">{totalTests}</span>
            <span className="text-xs text-[#94A3B8]/80 font-bold uppercase tracking-wider ml-1">Runs</span>
          </div>
        </div>

        {/* STAT 2 */}
        <div className="bg-[#080d19]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-[#94A3B8] uppercase">Peak Download</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-primary">{bestDownload}</span>
            <span className="text-xs text-primary/80 font-bold ml-1">{unit}</span>
          </div>
        </div>

        {/* STAT 3 */}
        <div className="bg-[#080d19]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-[#94A3B8] uppercase">Avg Download</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-white">{avgDownload}</span>
            <span className="text-xs text-[#94A3B8]/80 font-bold ml-1">{unit}</span>
          </div>
        </div>

        {/* STAT 4 */}
        <div className="bg-[#080d19]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-2xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <span className="font-sans font-extrabold text-[10px] tracking-[0.18em] text-[#94A3B8] uppercase">Avg Ping</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-3xl font-black text-secondary">{avgPing}</span>
            <span className="text-xs text-secondary/80 font-bold ml-1">ms</span>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL PANEL Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0d1325]/85 backdrop-blur-md p-4 rounded-xl border border-[#1e293b] shadow-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by server name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030508]/60 text-sm text-white placeholder:text-[#94A3B8]/40 border border-[#1e293b] rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
        </div>

        {totalTests > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              id="export-csv-btn"
              onClick={handleExportData}
              className="flex items-center gap-2 bg-[#05070c] hover:bg-[#0d1325] text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-[#1e293b] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export JSON Report</span>
            </button>
            
            {!showConfirmClear ? (
              <button
                id="clear-all-trigger"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-bold px-4 py-2.5 rounded-lg border border-rose-900/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History Logs</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in bg-[#05070c] border border-rose-900/40 p-1.5 rounded-lg">
                <span className="text-[11px] text-rose-400 font-semibold px-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Are you sure?
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
                  className="bg-[#111827] hover:bg-[#1e293b] text-[#94A3B8] text-[11px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILED SPEED LOG LIST & DATA TABLE */}
      <div className="bg-[#080d19]/80 backdrop-blur-xl rounded-2xl border border-[#1e293b] overflow-hidden shadow-2xl flex-1 min-h-0 flex flex-col" id="history-list-container">
        {filteredResults.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center gap-4 text-[#94A3B8]">
            <div className="p-4 bg-[#030508] rounded-full border border-[#1e293b]">
              <Calendar className="w-8 h-8 text-[#00F0FF]" />
            </div>
            <h3 className="font-sans font-extrabold tracking-wider text-base text-white">No Speed test history</h3>
            <p className="font-sans text-xs max-w-sm text-[#94A3B8]/80 leading-relaxed">
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
              <thead className="sticky top-0 z-10 bg-[#0d1325]">
                <tr className="border-b border-[#1e293b] bg-[#0d1325]/50 text-[10px] tracking-[0.18em] text-[#94A3B8] uppercase font-extrabold">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Test Server</th>
                  <th className="px-6 py-4 text-right">Download</th>
                  <th className="px-6 py-4 text-right">Upload</th>
                  <th className="px-6 py-4 text-right">Ping / Jitter</th>
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {filteredResults.map((result) => {
                  const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <tr key={result.id} className="hover:bg-[#00f0ff]/5 transition-colors group">
                      {/* Timestamp Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-black text-sm font-sans tracking-wide">{localDateStr}</span>
                          <span className="text-xs text-[#94A3B8] font-semibold">{localFullDate}</span>
                        </div>
                      </td>

                      {/* Test Server Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white text-sm font-extrabold flex items-center gap-1.5 flex-wrap">
                            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                            Live Speed Test
                          </span>
                          <span className="text-xs text-[#94A3B8] max-w-[200px] truncate">{result.serverName}</span>
                        </div>
                      </td>

                      {/* Download */}
                      <td className="px-6 py-4 text-right items-baseline">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-base text-primary">{(result.downloadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-[#94A3B8] font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Upload */}
                      <td className="px-6 py-4 text-right items-baseline">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-sans font-black text-base text-secondary">{(result.uploadMbps / factor).toFixed(1)}</span>
                          <span className="text-[10px] text-[#94A3B8] font-bold">{unit}</span>
                        </div>
                      </td>

                      {/* Ping and Jitter */}
                      <td className="px-6 py-4 text-right font-mono">
                        <div className="flex flex-col text-xs text-white gap-0.5">
                          <span className="font-semibold">{result.pingMs} ms ping</span>
                          <span className="text-[#94A3B8] text-[11px]">{result.jitterMs} ms jitter</span>
                        </div>
                      </td>

                      {/* Single Trash Action */}
                      <td className="px-4 py-4 text-center">
                        <button
                          id={`history-delete-${result.id}`}
                          onClick={() => onDeleteResult(result.id)}
                          className="p-1 px-2.5 rounded bg-transparent hover:bg-rose-950/40 text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
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
            <div className="grid grid-cols-1 divide-y divide-[#1e293b]/50 md:hidden">
              {filteredResults.map((result) => {
                const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={result.id} className="p-4 flex flex-col gap-4 hover:bg-[#00f0ff]/5">
                    
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm font-sans">{localDateStr}</span>
                          <span className="text-[#94A3B8] text-xs">• {localFullDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[#94A3B8] text-xs truncate max-w-[200px]">
                            {result.serverName}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onDeleteResult(result.id)}
                        className="p-2 -mr-2 text-[#94A3B8] hover:text-rose-400 bg-[#0c1223] rounded-full cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Speeds Metric block */}
                    <div className="grid grid-cols-3 gap-2 bg-[#05070c] p-3 rounded-xl border border-[#1e293b]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Download</span>
                        <span className="font-sans font-black text-primary text-sm mt-1">
                          {(result.downloadMbps / factor).toFixed(1)} <span className="text-[9px] text-[#94A3B8]/80 font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Upload</span>
                        <span className="font-sans font-black text-secondary text-sm mt-1">
                          {(result.uploadMbps / factor).toFixed(1)} <span className="text-[9px] text-[#94A3B8]/80 font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col font-mono">
                        <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Latency</span>
                        <span className="text-xs text-white mt-1 font-semibold">
                          {result.pingMs}ms P
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
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
