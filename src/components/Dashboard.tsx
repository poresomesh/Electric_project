import React, { useState, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr, getYesterdayDateStr, getCurrentMonthStr, formatReadableDate } from '../utils/dateUtils';
import { 
  Zap, 
  TrendingUp, 
  Receipt, 
  Gauge, 
  Activity, 
  Calendar, 
  PlusCircle, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight, 
  Building, 
  Clock,
  Sparkles,
  FileSpreadsheet,
  Check,
  CalendarRange
} from 'lucide-react';
import { Block, MeterReading } from '../types';
import { EnergyGraphs } from './EnergyGraphs';

interface DashboardProps {
  onOpenEnterReading: (blockId?: string, mode?: 'single' | 'batch4m') => void;
  onNavigateToGraphs: (blockId?: string) => void;
  onNavigateToBilling: (blockId?: string) => void;
  onNavigateToDayWise?: (blockId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenEnterReading,
  onNavigateToGraphs,
  onNavigateToBilling,
  onNavigateToDayWise,
}) => {
  const {
    blocks,
    meters,
    readings,
    tariff,
    currentUser,
    isAdmin,
    isBlockIncharge,
    userAssignedBlock,
    canEnterReading,
    deleteReading,
    deleteAllReadings,
    calculateBill,
    isDarkMode,
  } = useEnergy();

  // Active block filter: in-charge is locked to their block, admin/viewer can switch
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>(() => {
    if (isBlockIncharge && currentUser.assignedBlockId) {
      return currentUser.assignedBlockId;
    }
    return 'ALL';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  
  // In-app modal for clearing all readings safely (replaces blocked window.confirm)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [toastFeedbackMsg, setToastFeedbackMsg] = useState<string>('');

  // Extract distinct months from readings
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    readings.forEach((r) => {
      if (r.readingDate && r.readingDate.length >= 7) {
        set.add(r.readingDate.substring(0, 7)); // e.g. '2026-08'
      }
    });
    // Ensure default months if none
    if (set.size === 0) {
      ['2026-05', '2026-06', '2026-07', '2026-08'].forEach((m) => set.add(m));
    }
    return Array.from(set).sort().reverse();
  }, [readings]);

  // Filtered readings list
  const activeBlockId = isBlockIncharge && currentUser.assignedBlockId ? currentUser.assignedBlockId : selectedBlockFilter;

  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Block filter
      if (activeBlockId !== 'ALL' && r.blockId !== activeBlockId) return false;
      
      // Date / Month filter
      if (selectedDateFilter === 'TODAY' && r.readingDate !== getTodayDateStr()) return false;
      if (selectedDateFilter.startsWith('MONTH_')) {
        const targetMo = selectedDateFilter.replace('MONTH_', '');
        if (!r.readingDate.startsWith(targetMo)) return false;
      }
      
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const blockName = blocks.find((b) => b.id === r.blockId)?.name.toLowerCase() || '';
        return (
          r.meterNumber.toLowerCase().includes(query) ||
          r.enteredByName.toLowerCase().includes(query) ||
          (r.notes && r.notes.toLowerCase().includes(query)) ||
          blockName.includes(query) ||
          r.readingDate.includes(query)
        );
      }
      return true;
    });
  }, [readings, activeBlockId, selectedDateFilter, searchTerm, blocks]);

  // Overall KPIs calculation
  const kpis = useMemo(() => {
    const todayDate = getTodayDateStr();
    const yesterdayDate = getYesterdayDateStr();
    const targetMonth = getCurrentMonthStr();

    let relevantReadings = readings;
    if (activeBlockId !== 'ALL') {
      relevantReadings = relevantReadings.filter((r) => r.blockId === activeBlockId);
    }

    const todayUnits = relevantReadings
      .filter((r) => r.readingDate === todayDate)
      .reduce((sum, r) => sum + r.unitsConsumed, 0);

    const yesterdayUnits = relevantReadings
      .filter((r) => r.readingDate === yesterdayDate)
      .reduce((sum, r) => sum + r.unitsConsumed, 0);

    const monthUnits = relevantReadings
      .filter((r) => r.readingDate.startsWith(targetMonth))
      .reduce((sum, r) => sum + r.unitsConsumed, 0);

    // Current total of all blocks combined for the current month
    const allBlocksMonthUnits = readings
      .filter((r) => r.readingDate.startsWith(targetMonth))
      .reduce((sum, r) => sum + r.unitsConsumed, 0);

    // Calculate month bill for the current selection
    const billData = calculateBill({
      blockId: activeBlockId,
      periodType: 'month',
      referenceDate: todayDate,
    });

    const activeMetersCount = meters.filter((m) => activeBlockId === 'ALL' || m.blockId === activeBlockId).length;
    const todayCost = todayUnits * tariff.baseRatePerUnit;

    // Daily Average Load calculation
    const distinctDates = new Set(relevantReadings.map((r) => r.readingDate)).size;
    const totalUnitsForAvg = relevantReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
    const averageDailyLoad = distinctDates > 0 ? (totalUnitsForAvg / distinctDates) : 0;

    return {
      todayUnits,
      yesterdayUnits,
      todayCost,
      monthUnits,
      allBlocksMonthUnits,
      estimatedBill: billData.totalBill,
      activeMetersCount,
      tariffRate: tariff.baseRatePerUnit,
      averageDailyLoad,
    };
  }, [readings, activeBlockId, meters, calculateBill, tariff]);

  // Export readings as CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Block', 'Meter No', 'Previous (kWh)', 'Current (kWh)', 'Units Consumed', 'Multiplier', 'Estimated Cost', 'Entered By', 'Notes'];
    const rows = filteredReadings.map((r) => {
      const bName = blocks.find((b) => b.id === r.blockId)?.name || r.blockId;
      const cost = (r.unitsConsumed * tariff.baseRatePerUnit).toFixed(2);
      return [
        r.readingDate,
        r.readingTime || '08:00',
        `"${bName}"`,
        r.meterNumber,
        r.previousReading,
        r.currentReading,
        r.unitsConsumed,
        r.multiplier,
        cost,
        `"${r.enteredByName}"`,
        `"${r.notes || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `energy_monitoring_readings_${activeBlockId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmClearAll = () => {
    deleteAllReadings();
    setShowClearConfirmModal(false);
    setToastFeedbackMsg('All meter readings have been wiped clean! You can now enter your custom 4-month data.');
  };

  const handleDeleteSingle = (id: string) => {
    deleteReading(id);
    setToastFeedbackMsg('Reading record deleted.');
  };

  // Helper for human month names
  const formatMonthName = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const moIdx = parseInt(m, 10) - 1;
    return `${months[moIdx] || m} ${y}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {isBlockIncharge && userAssignedBlock && (
        <EnergyGraphs initialBlockId={userAssignedBlock.id} weeklyLineOnly />
      )}
      {/* Top Banner & Block Filter Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isDarkMode 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live Grid Active
            </span>
            <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Date: {formatReadableDate(getTodayDateStr())}
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {isBlockIncharge && userAssignedBlock
              ? `${userAssignedBlock.name} Energy Monitoring`
              : selectedBlockFilter === 'ALL'
              ? 'Facility-Wide Energy Monitoring'
              : `${blocks.find((b) => b.id === selectedBlockFilter)?.name || 'Block'} Energy Dashboard`}
          </h1>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Real-time meter reading reconciliation, automated kWh difference computation & billing
          </p>
        </div>

        {/* Block Filter Buttons (for Admin / Auditor) */}
        {(!isBlockIncharge || !userAssignedBlock) && (
          <div className={`flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl border ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="filter-block-all"
              onClick={() => setSelectedBlockFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedBlockFilter === 'ALL'
                  ? isDarkMode 
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' 
                    : 'bg-cyan-600 text-white font-bold shadow-sm'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Blocks
            </button>
            {blocks.map((block) => (
              <button
                key={block.id}
                id={`filter-block-${block.id}`}
                onClick={() => setSelectedBlockFilter(block.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedBlockFilter === block.id
                    ? isDarkMode 
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' 
                      : 'bg-cyan-600 text-white font-bold shadow-sm'
                    : isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: block.color }}
                ></span>
                <span>{block.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toast Feedback Notification Banner */}
      {toastFeedbackMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
          isDarkMode 
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
            : 'bg-cyan-50 border-cyan-200 text-cyan-900'
        }`}>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>{toastFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setToastFeedbackMsg('')}
            className={`text-xs cursor-pointer ml-2 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Units of the Block */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Today's Units of the Block</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {kpis.todayUnits.toLocaleString()}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>kWh</span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Yesterday: {kpis.yesterdayUnits.toLocaleString()} kWh</span>
            <span className={`font-mono font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              {tariff.currencySymbol}{kpis.todayCost.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Card 2: Current Total of All Block */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Current Total of All Block</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {kpis.allBlocksMonthUnits.toLocaleString()}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>kWh</span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>All Blocks (This Month)</span>
            <button
              onClick={() => onNavigateToGraphs(undefined)}
              className={`hover:underline flex items-center gap-0.5 cursor-pointer font-medium ${
                isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              <span>View Trend</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Estimated Month Bill of the Block */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Estimated Month Bill of the Block</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-amber-400' : 'text-amber-700'
            }`}>
              {tariff.currencySymbol} {kpis.estimatedBill.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Rate: {tariff.currencySymbol}{kpis.tariffRate}/unit</span>
            <button
              onClick={() => onNavigateToBilling(activeBlockId !== 'ALL' ? activeBlockId : undefined)}
              className={`hover:underline flex items-center gap-0.5 cursor-pointer font-medium ${
                isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              <span>Detailed Bill</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Daily Average Load (Replaced Active Infrastructure) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Daily Average Load</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {kpis.averageDailyLoad.toFixed(1)}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>kWh/day</span>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Across Active Days</span>
            <span className={`font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Base Mean</span>
          </div>
        </div>
      </div>

      {/* Block Summaries Bento Grid */}
      {activeBlockId === 'ALL' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Building className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Campus Block Summary</span>
            </h2>
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Click any block card to enter data or filter</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {blocks.map((b) => {
              const bReadings = readings.filter((r) => r.blockId === b.id);
              const bUnits = bReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
              const bMeters = meters.filter((m) => m.blockId === b.id);
              const bCost = bUnits * tariff.baseRatePerUnit;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlockFilter(b.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm hover:shadow-md ${
                    isDarkMode 
                      ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900' 
                      : 'bg-white border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20" style={{ backgroundColor: b.color }}></span>
                      <span className={`font-bold text-sm transition-colors ${
                        isDarkMode 
                          ? 'text-white group-hover:text-cyan-400' 
                          : 'text-slate-900 group-hover:text-cyan-700'
                      }`}>
                        {b.name}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-xs ${
                      isDarkMode 
                        ? 'bg-slate-800 text-cyan-300 border-slate-700/80' 
                        : 'bg-slate-100 text-cyan-800 border-slate-200'
                    }`}>
                      {b.code}
                    </span>
                  </div>

                  <div className={`text-xs mb-3 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    In-Charge: <strong className={isDarkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{b.inchargeName || 'Unassigned'}</strong>
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div>
                      <div className={`text-[10px] uppercase font-semibold tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>Recorded Energy</div>
                      <div className={`text-sm font-extrabold font-mono ${
                        isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                      }`}>
                        {bUnits.toLocaleString()} <span className="text-[10px] font-normal">kWh</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] uppercase font-semibold tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>Est. Total Cost</div>
                      <div className={`text-xs font-bold font-mono ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-700'
                      }`}>
                        {tariff.currencySymbol}{bCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-3 flex items-center justify-between pt-2 border-t ${
                    isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{bMeters.length} Sub-Meters</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEnterReading(b.id, 'single');
                      }}
                      className={`text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer ${
                        isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      <span>+ Add Reading</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Day-Wise Consumption Access Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-700/80 shadow-lg hover:border-cyan-500/50' 
          : 'bg-white border-2 border-cyan-500/40 shadow-md hover:border-cyan-600 hover:shadow-lg'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
              isDarkMode 
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' 
                : 'bg-cyan-50 border-cyan-300 text-cyan-700'
            }`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Day-Wise Energy Consumption System
                </h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isDarkMode 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                    : 'bg-cyan-100 text-cyan-900 border-cyan-400'
                }`}>
                  Today: {kpis.todayUnits.toLocaleString()} kWh
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isDarkMode 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-blue-100 text-blue-900 border-blue-400'
                }`}>
                  Yesterday: {kpis.yesterdayUnits.toLocaleString()} kWh
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Day-by-day active energy consumption across each and every block, daily KPI trends, and detailed sub-meter reconciliations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-dashboard-open-daywise"
              onClick={() => onNavigateToDayWise?.(activeBlockId !== 'ALL' ? activeBlockId : undefined)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md ${
                isDarkMode 
                  ? 'text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/30' 
                  : 'text-white bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30 ring-1 ring-cyan-700'
              }`}
            >
              <span>Open Day-Wise System</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Readings Table & Controls Card */}
      <div className={`rounded-2xl overflow-hidden border shadow-lg transition-all ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Table Toolbar Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <FileSpreadsheet className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Energy Meter Readings & Automatic Calculations</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing {filteredReadings.length} reading records with automatic unit difference calculation
              </p>
              {selectedBlockFilter !== 'ALL' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  isDarkMode 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                    : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                }`}>
                  <span>Block: {blocks.find((b) => b.id === selectedBlockFilter)?.code || selectedBlockFilter}</span>
                  {(!isBlockIncharge || !userAssignedBlock) && (
                    <button
                      onClick={() => setSelectedBlockFilter('ALL')}
                      className={`ml-0.5 cursor-pointer ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}
                      title="Clear block filter"
                    >
                      ✕
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Block Selection Filter inside this section */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs ${
              isDarkMode 
                ? 'bg-slate-900 border-cyan-500/40 text-slate-200' 
                : 'bg-white border-cyan-300 text-slate-800'
            }`}>
              <Building className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <label htmlFor="select-table-block-filter" className={`text-[11px] font-bold uppercase hidden sm:inline ${
                isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
              }`}>
                Block:
              </label>
              <select
                id="select-table-block-filter"
                value={selectedBlockFilter}
                onChange={(e) => setSelectedBlockFilter(e.target.value)}
                disabled={isBlockIncharge && !!currentUser.assignedBlockId}
                className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 ${
                  isDarkMode ? 'text-white' : 'text-slate-800'
                }`}
                title="Filter readings by campus block"
              >
                <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>All Campus Blocks</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                placeholder="Search meter, date, worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none w-40 sm:w-48 ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                }`}
              />
            </div>

            {/* Dynamic Date & Month Filter */}
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className={`px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-slate-300 focus:border-cyan-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-cyan-600'
              }`}
            >
              <option value="ALL">All Recorded Dates</option>
              <option value="TODAY">Today (30 Aug 2026)</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={`MONTH_${ym}`}>
                  Month: {formatMonthName(ym)}
                </option>
              ))}
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              title="Download readings spreadsheet"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'text-slate-200 bg-slate-800 hover:bg-slate-750 border-slate-700' 
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-300'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Export CSV</span>
            </button>

            {/* Clear All Readings button if records exist */}
            {readings.length > 0 && (
              <button
                onClick={() => setShowClearConfirmModal(true)}
                title="Delete all recorded readings"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30' 
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            {/* Fast 4-Month Batch Button */}
            {canEnterReading() && (
              <button
                onClick={() => onOpenEnterReading(activeBlockId !== 'ALL' ? activeBlockId : undefined, 'batch4m')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-sm cursor-pointer ${
                  isDarkMode 
                    ? 'text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40' 
                    : 'text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
                }`}
              >
                <CalendarRange className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <span>4-Month Batch Log</span>
              </button>
            )}

            {/* Enter Single Reading CTA */}
            {canEnterReading() && (
              <button
                onClick={() => onOpenEnterReading(activeBlockId !== 'ALL' ? activeBlockId : undefined, 'single')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                  isDarkMode 
                    ? 'text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/20' 
                    : 'text-white bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Enter Reading</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State vs Table */}
        {readings.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              isDarkMode ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}>
              <Gauge className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No Meter Readings Recorded Yet</h3>
              <p className={`text-xs max-w-md mx-auto mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                All existing sample readings have been cleared. You can now manually fill your 4-month historical readings or enter individual meter logs for each block.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenEnterReading(undefined, 'batch4m')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer ${
                  isDarkMode 
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                <span>⚡ Fill 4-Month Historical Data</span>
              </button>
              <button
                onClick={() => onOpenEnterReading(undefined, 'single')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs border flex items-center gap-2 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <span>Enter Single Date Reading</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider font-semibold border-b text-[11px] ${
                isDarkMode 
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800' 
                  : 'bg-slate-100/90 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Block Name</th>
                  <th className="py-3 px-4">Meter No.</th>
                  <th className="py-3 px-4 text-right">Previous (kWh)</th>
                  <th className="py-3 px-4 text-right">Current (kWh)</th>
                  <th className={`py-3 px-3 text-center ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700 font-bold'}`}>MF (Multiplier)</th>
                  <th className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Units (Diff × MF)</th>
                  <th className="py-3 px-4 text-right">Est. Cost</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Remarks / Notes</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-sans ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {filteredReadings.map((reading) => {
                  const block = blocks.find((b) => b.id === reading.blockId);
                  const cost = reading.unitsConsumed * tariff.baseRatePerUnit;
                  const isSpecialExample = reading.notes && reading.notes.includes('09.08.26 reading 200');

                  return (
                    <tr
                      key={reading.id}
                      className={`transition-colors ${
                        isDarkMode 
                          ? `hover:bg-slate-800/40 ${isSpecialExample ? 'bg-cyan-950/25 border-l-2 border-cyan-400' : ''}` 
                          : `hover:bg-slate-50 ${isSpecialExample ? 'bg-cyan-50/60 border-l-2 border-cyan-600' : ''}`
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className={`font-mono font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{reading.readingDate}</div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{reading.readingTime || '08:00'}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: block?.color || '#3b82f6' }}
                          ></span>
                          <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{block?.name || reading.blockId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${
                          isDarkMode 
                            ? 'bg-slate-800 text-slate-300 border-slate-700' 
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {reading.meterNumber}
                        </span>
                      </td>

                      <td className={`py-3 px-4 text-right font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {reading.previousReading.toLocaleString()} kWh
                      </td>

                      <td className={`py-3 px-4 text-right font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {reading.currentReading.toLocaleString()} kWh
                      </td>

                      {/* Multiplying Factor (MF) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span 
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                            isDarkMode 
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25' 
                              : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                          }`}
                          title={`Multiplying Factor: ×${reading.multiplier || 1}`}
                        >
                          ×{reading.multiplier || 1}
                        </span>
                      </td>

                      {/* Automatic Difference & Units Highlight */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-mono font-extrabold text-xs ${
                            isDarkMode 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                          title={`(${reading.currentReading} - ${reading.previousReading}) × ${reading.multiplier || 1} = ${reading.unitsConsumed} kWh`}
                        >
                          +{reading.unitsConsumed.toLocaleString()} kWh
                        </span>
                      </td>

                      <td className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-700'
                      }`}>
                        {tariff.currencySymbol} {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{reading.enteredByName}</div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {reading.voltageRms ? `${reading.voltageRms}V` : 'Standard Feeder'}
                        </div>
                      </td>

                      <td className={`py-3 px-4 max-w-xs truncate text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {reading.notes || '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteSingle(reading.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDarkMode 
                              ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' 
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredReadings.length === 0 && (
                  <tr>
                    <td colSpan={12} className={`py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      No meter reading records match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear All In-App Safe Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Meter Readings?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Wipe data to start fresh</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              Are you sure you want to delete all <strong>{readings.length}</strong> recorded meter readings from the system?
              This will wipe all data and reset meter baselines so you can manually enter your last 4 months of records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Yes, Delete All Readings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};