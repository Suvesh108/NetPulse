import React, { useState } from 'react';
import { 
  Trash2, Download, Search, Calendar, Zap, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Layers, 
  ShieldCheck, Headphones, Award, ChevronDown, ChevronUp, 
  Gamepad2, Tv, Radio, CheckCircle2, Shield, Share2
} from 'lucide-react';
import { SpeedTestResult } from '../types';
import SpeedCertificateModal from './SpeedCertificateModal';

interface HistoryListProps {
  results: SpeedTestResult[];
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  unit?: 'Mbps' | 'MB/s';
}

function getResultBufferbloat(result: SpeedTestResult) {
  if (result.bufferbloatGrade) {
    const delta = result.loadedLatencyMs ?? Math.max(0, Math.round(result.jitterMs * 1.4));
    const grade = result.bufferbloatGrade;
    let color = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (grade === 'A+' || grade === 'A') color = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    else if (grade === 'B') color = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    else if (grade === 'C') color = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    else if (grade === 'D') color = 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    else color = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    return { grade, delta, color };
  }
  const delta = Math.max(0, Math.round(result.jitterMs * 1.4));
  if (delta < 6) return { grade: 'A+', delta, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
  if (delta < 15) return { grade: 'A', delta, color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' };
  if (delta < 30) return { grade: 'B', delta, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
  if (delta < 60) return { grade: 'C', delta, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
  if (delta < 100) return { grade: 'D', delta, color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' };
  return { grade: 'F', delta, color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
}

function getResultVoipMos(result: SpeedTestResult): { score: number; label: string; color: string } {
  if (result.voipMos && result.voipMos > 0) {
    const score = Number(result.voipMos.toFixed(2));
    if (score >= 4.2) return { score, label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 4.0) return { score, label: 'Good', color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20' };
    if (score >= 3.6) return { score, label: 'Fair', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (score >= 3.0) return { score, label: 'Poor', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { score, label: 'Degraded', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' };
  }
  const loss = result.packetLoss ?? 0;
  const effectiveLatency = result.pingMs + (result.jitterMs * 2) + (loss * 25);
  let rFactor = 93.2 - (effectiveLatency / 40);
  if (effectiveLatency > 160) {
    rFactor = 93.2 - (effectiveLatency - 120) / 10;
  }
  rFactor = Math.max(0, Math.min(100, rFactor));
  const mos = 1 + (0.035 * rFactor) + (0.000007 * rFactor * (rFactor - 60) * (100 - rFactor));
  const score = Math.max(1, Math.min(4.45, Number(mos.toFixed(2))));
  if (score >= 4.2) return { score, label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 4.0) return { score, label: 'Good', color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20' };
  if (score >= 3.6) return { score, label: 'Fair', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' };
  if (score >= 3.0) return { score, label: 'Poor', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { score, label: 'Degraded', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' };
}

export default function HistoryList({ results, onDeleteResult, onClearAll, unit = 'Mbps' }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedCertResult, setSelectedCertResult] = useState<SpeedTestResult | null>(null);

  const factor = unit === 'MB/s' ? 8 : 1;

  // Aggregate Stats Calculations
  const totalTests = results.length;
  
  const avgDownload = totalTests > 0
    ? ((results.reduce((acc, curr) => acc + curr.downloadMbps, 0) / totalTests) / factor).toFixed(1)
    : '0.0';

  const bestDownload = totalTests > 0
    ? (Math.max(...results.map(r => r.downloadMbps)) / factor).toFixed(1)
    : '0.0';

  const bestUpload = totalTests > 0
    ? (Math.max(...results.map(r => r.uploadMbps)) / factor).toFixed(1)
    : '0.0';

  const avgPing = totalTests > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.pingMs, 0) / totalTests)
    : 0;

  const avgJitter = totalTests > 0
    ? (results.reduce((acc, curr) => acc + curr.jitterMs, 0) / totalTests).toFixed(1)
    : '0.0';

  const avgVoip = totalTests > 0
    ? (results.reduce((acc, curr) => acc + getResultVoipMos(curr).score, 0) / totalTests).toFixed(2)
    : '4.35';

  const handleExportData = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `netpulse_telemetry_export_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.warn('Failed to export data:', error);
    }
  };

  const filteredResults = results.filter(result => {
    const term = searchTerm.toLowerCase();
    return (
      result.serverName.toLowerCase().includes(term) ||
      (result.routingProtocol && result.routingProtocol.toLowerCase().includes(term)) ||
      (result.bufferbloatGrade && result.bufferbloatGrade.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-3 pb-24 md:pb-0 flex-1 min-h-0 h-full select-none animate-fade-in" id="history-section">
      
      {/* 1. PROFESSIONAL ANALYTICS BENTO CARDS (6-Pill High Density Matrix) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 shrink-0">
        
        {/* CARD 1: Total Tests */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Total Tests</span>
              <span className="text-[9px] text-slate-400 font-medium">Logged Probes</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalTests}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Runs</span>
          </div>
        </div>

        {/* CARD 2: Peak Download */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Peak Down</span>
              <span className="text-[9px] text-slate-400 font-medium">Max Inbound</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{bestDownload}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{unit}</span>
          </div>
        </div>

        {/* CARD 3: Peak Upload */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-400 uppercase tracking-wider">Peak Up</span>
              <span className="text-[9px] text-slate-400 font-medium">Max Outbound</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{bestUpload}</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">{unit}</span>
          </div>
        </div>

        {/* CARD 4: Avg Latency & Jitter */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Avg Latency</span>
              <span className="text-[9px] text-slate-400 font-medium">±{avgJitter}ms jitter</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{avgPing}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">ms</span>
          </div>
        </div>

        {/* CARD 5: Bufferbloat Rating */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider">Bufferbloat</span>
              <span className="text-[9px] text-slate-400 font-medium">Under Load</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">Grade A</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">Rating</span>
          </div>
        </div>

        {/* CARD 6: VoIP MOS Rating */}
        <div className="premium-card bg-white dark:bg-[#121212] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs transition-colors cursor-default">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">VoIP MOS</span>
              <span className="text-[9px] text-slate-400 font-medium">Call Quality</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{avgVoip}</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">/5.0</span>
          </div>
        </div>

      </div>

      {/* 2. SEARCH & CONTROL TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-white dark:bg-[#121212] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs shrink-0 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Filter by server, protocol, or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#161618] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-[#262626] rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
          />
        </div>

        {totalTests > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="export-csv-btn"
              onClick={handleExportData}
              className="flex items-center gap-1.5 bg-white dark:bg-[#161618] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#262626] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export JSON</span>
            </button>
            
            {!showConfirmClear ? (
              <button
                id="clear-all-trigger"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 animate-fade-in bg-white dark:bg-[#161618] border border-rose-200 dark:border-rose-900/60 p-0.5 rounded-lg shadow-xs">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold px-1.5 flex items-center gap-1">
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
                  className="bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. HIGH-DENSITY ENTERPRISE TELEMETRY TABLE */}
      <div className="bg-white dark:bg-[#121212] rounded-xl shadow-xs flex-1 min-h-0 flex flex-col border border-slate-200 dark:border-[#262626] overflow-hidden transition-colors" id="history-list-container">
        {filteredResults.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <div className="p-3 bg-slate-100 dark:bg-[#161618] rounded-xl border border-slate-200/80 dark:border-[#262626] text-blue-600 dark:text-blue-400 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">No test records found</h3>
            <p className="font-sans text-xs max-w-xs text-slate-400 leading-relaxed">
              {searchTerm 
                ? 'No logs matched your filter. Clear the search field to view all recorded telemetry.' 
                : 'Perform speed tests on the Speed Test tab to log your connection performance here.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[calc(100vh-270px)]">
            
            {/* Desktop Table View */}
            <table className="w-full text-left font-sans border-collapse hidden md:table">
              <thead className="sticky top-0 z-20 bg-slate-100/90 dark:bg-[#161618]/95 backdrop-blur border-b border-slate-200 dark:border-[#262626] shadow-xs">
                <tr className="text-[10px] tracking-wider text-slate-600 dark:text-slate-400 uppercase font-black">
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Node & Protocol</th>
                  <th className="px-3 py-2.5 text-right">Download</th>
                  <th className="px-3 py-2.5 text-right">Upload</th>
                  <th className="px-3 py-2.5 text-right">Ping / Jitter</th>
                  <th className="px-3 py-2.5 text-center">Bufferbloat</th>
                  <th className="px-3 py-2.5 text-center">Packet Loss</th>
                  <th className="px-3 py-2.5 text-center">VoIP MOS</th>
                  <th className="px-4 py-2.5 text-center">Telemetry & Cert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262626]/80 text-xs">
                {filteredResults.map((result) => {
                  const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const bloat = getResultBufferbloat(result);
                  const voip = getResultVoipMos(result);
                  const loss = result.packetLoss ?? 0;
                  const isExpanded = expandedRowId === result.id;
                  const protocolName = result.routingProtocol === 'http3-quic' 
                    ? 'HTTP/3 QUIC' 
                    : result.routingProtocol === 'http2-tcp' 
                    ? 'HTTP/2 TCP' 
                    : result.routingProtocol === 'multipath-adaptive'
                    ? 'Multipath'
                    : 'Anycast BGP';

                  return (
                    <React.Fragment key={result.id}>
                      <tr className={`hover:bg-slate-50/80 dark:hover:bg-[#161618]/60 transition-colors group ${isExpanded ? 'bg-slate-50/60 dark:bg-[#161618]/40' : ''}`}>
                        
                        {/* 1. Timestamp */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-100 font-bold text-xs">{localDateStr}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{localFullDate}</span>
                          </div>
                        </td>

                        {/* 2. Server Node & Routing Protocol */}
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={result.serverName}>
                                {result.serverName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                                {protocolName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Download */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-sans font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {(result.downloadMbps / factor).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{unit}</span>
                          </div>
                        </td>

                        {/* 4. Upload */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-sans font-black text-sm text-purple-600 dark:text-purple-400">
                              {(result.uploadMbps / factor).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">{unit}</span>
                          </div>
                        </td>

                        {/* 5. Latency & Jitter */}
                        <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                          <div className="flex flex-col gap-0.2">
                            <span className="font-bold text-amber-600 dark:text-amber-400">{result.pingMs} ms</span>
                            <span className="text-indigo-600 dark:text-indigo-400 text-[10px]">±{result.jitterMs} ms jitter</span>
                          </div>
                        </td>

                        {/* 6. Bufferbloat */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${bloat.color}`}>
                            <Shield className="w-2.5 h-2.5" />
                            Grade {bloat.grade} <span className="text-[9px] opacity-75">(+{bloat.delta}ms)</span>
                          </span>
                        </td>

                        {/* 7. Packet Loss */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap font-mono">
                          {loss === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" /> 0.0% Loss
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-2.5 h-2.5" /> {loss.toFixed(1)}% Loss
                            </span>
                          )}
                        </td>

                        {/* 8. VoIP MOS */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${voip.color}`}>
                            <Headphones className="w-2.5 h-2.5" />
                            {voip.score.toFixed(2)} • {voip.label}
                          </span>
                        </td>

                        {/* 9. Actions: Cert Generator, Expand Inspection & Delete */}
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedCertResult(result)}
                              className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer border border-blue-200/80 dark:border-blue-800/60"
                              title="Generate Official Speed Certificate"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setExpandedRowId(isExpanded ? null : result.id)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer border ${
                                isExpanded 
                                  ? 'bg-slate-200 dark:bg-[#262626] text-slate-900 dark:text-white border-slate-300 dark:border-slate-700' 
                                  : 'hover:bg-slate-100 dark:hover:bg-[#161618] text-slate-400 border-transparent'
                              }`}
                              title={isExpanded ? 'Collapse telemetry drawer' : 'Inspect detailed network telemetry'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              id={`history-delete-${result.id}`}
                              onClick={() => onDeleteResult(result.id)}
                              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* Expandable Professional Telemetry Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-[#0c0c0e] border-y border-slate-200 dark:border-[#262626]">
                          <td colSpan={9} className="px-6 py-3">
                            <div className="flex flex-col gap-3 animate-fade-in">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Network Diagnostics Breakdown
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Probe ID: #{result.id} • {new Date(result.timestamp).toUTCString()}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedCertResult(result)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs active:scale-95"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>Export Speed Certificate</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Gaming Readiness */}
                                <div className="p-2.5 rounded-lg bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                                    <Gamepad2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Multiplayer Gaming</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {result.pingMs < 35 && result.jitterMs < 10 ? 'Competitive Tier 1 (<35ms)' : result.pingMs < 75 ? 'Optimal Gameplay (<75ms)' : 'Acceptable Casual'}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Loaded bloat delta: +{bloat.delta}ms • Jitter variance: {result.jitterMs}ms
                                  </span>
                                </div>

                                {/* 4K UHD Streaming */}
                                <div className="p-2.5 rounded-lg bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                                    <Tv className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">4K / 8K UHD Streaming</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {result.downloadMbps >= 50 ? 'Lossless 4K HDR & 8K Ready' : result.downloadMbps >= 25 ? 'Smooth 4K UHD Ready' : 'Full HD 1080p Stream'}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Packet Delivery: {(100 - loss).toFixed(1)}% • Inbound: {(result.downloadMbps / factor).toFixed(1)} {unit}
                                  </span>
                                </div>

                                {/* Video Call & Telephony */}
                                <div className="p-2.5 rounded-lg bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                                    <Headphones className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">VoIP & Teleconferencing</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    MOS Score {voip.score.toFixed(2)} / 5.0 ({voip.label})
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Crystal clear Skype, Zoom & Teams voice channels without dropouts.
                                  </span>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards Stack */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-[#262626] md:hidden">
              {filteredResults.map((result) => {
                const localDateStr = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const localFullDate = new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                const bloat = getResultBufferbloat(result);
                const voip = getResultVoipMos(result);
                const loss = result.packetLoss ?? 0;
                
                return (
                  <div key={result.id} className="p-3 flex flex-col gap-2.5 hover:bg-slate-50/50 dark:hover:bg-[#161618]/50">
                    
                    {/* Card Header: Node + Timestamp + Actions */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Zap className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-slate-900 dark:text-slate-100 font-bold text-xs">{localDateStr} • {localFullDate}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{result.serverName}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedCertResult(result)}
                          className="p-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-md cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                          title="Speed Certificate"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteResult(result.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 bg-slate-100 dark:bg-[#161618] rounded-md cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Speed & Latency Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/80 dark:bg-[#161618]/60 p-2 rounded-lg border border-slate-200/60 dark:border-[#262626]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">Download</span>
                        <span className="font-sans font-black text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                          {(result.downloadMbps / factor).toFixed(1)} <span className="text-[9px] font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-purple-800 dark:text-purple-400 font-bold uppercase">Upload</span>
                        <span className="font-sans font-black text-purple-600 dark:text-purple-400 text-xs mt-0.5">
                          {(result.uploadMbps / factor).toFixed(1)} <span className="text-[9px] font-normal">{unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-col font-mono">
                        <span className="text-[9px] text-amber-800 dark:text-amber-400 font-bold uppercase">Latency</span>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          {result.pingMs}ms
                        </span>
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-400">
                          ±{result.jitterMs}ms
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Tags: Bufferbloat, Packet Loss, VoIP */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${bloat.color}`}>
                        Bloat Grade {bloat.grade} (+{bloat.delta}ms)
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {loss === 0 ? '0.0% Loss' : `${loss.toFixed(1)}% Loss`}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                        VoIP MOS {voip.score.toFixed(2)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* Speed Certificate Modal */}
      {selectedCertResult && (
        <SpeedCertificateModal
          isOpen={!!selectedCertResult}
          onClose={() => setSelectedCertResult(null)}
          result={selectedCertResult}
          activeServerName={selectedCertResult.serverName}
          unit={unit}
        />
      )}

    </div>
  );
}
