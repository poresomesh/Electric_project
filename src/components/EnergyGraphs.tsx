import React, { useState, useMemo, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr, getCurrentYear, formatMonthYear } from '../utils/dateUtils';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Building, 
  Layers, 
  Clock, 
  Activity, 
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface EnergyGraphsProps {
  initialBlockId?: string;
  weeklyLineOnly?: boolean;
}

export const EnergyGraphs: React.FC<EnergyGraphsProps> = ({ initialBlockId, weeklyLineOnly = false }) => {
  const {
    blocks,
    currentUser,
    isAdmin,
    isBlockIncharge,
    userAssignedBlock,
    tariff,
    isDarkMode,
    getDayWiseData,
    getWeekWiseData,
    getMonthWiseData,
    getYearWiseData,
  } = useEnergy();

  const gridStroke = isDarkMode ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDarkMode ? '#64748b' : '#94a3b8';

  // ब्लॉक आयडी किंवा कोडचे अक्षर शोधणारे हेल्पर (उदा. 'block-b' -> 'b', 'blk-c' -> 'c')
  const normalizeBlock = (val?: string) => {
    if (!val) return '';
    return val.toLowerCase().replace(/^(block|blk)[_-]/, '').trim();
  };

  // १. इनचार्ज युझरचा अचूक ब्लॉक शोधणे (A, B, C, D कडक आयसोलेशन)
  const resolvedInchargeBlockId = useMemo(() => {
    if (isAdmin) return null;
    if (userAssignedBlock?.id) return userAssignedBlock.id;

    const uBlockId = (currentUser?.assignedBlockId || '').trim().toLowerCase();
    const uname = (currentUser?.username || '').trim().toLowerCase();

    let targetLetter = '';
    const match = uname.match(/incharge[_-]([a-z0-9]+)/) || uname.match(/block[_-]([a-z0-9]+)/);
    if (match) {
      targetLetter = match[1].toLowerCase();
    } else if (uBlockId && uBlockId !== 'all') {
      targetLetter = normalizeBlock(uBlockId);
    }

    if (blocks && blocks.length > 0) {
      const found = blocks.find((b) => {
        const bId = (b.id || '').toLowerCase();
        const bCode = (b.code || '').toLowerCase();
        return (
          bId === uBlockId ||
          bCode === uBlockId ||
          (targetLetter && (normalizeBlock(bId) === targetLetter || normalizeBlock(bCode) === targetLetter))
        );
      });
      if (found) return found.id;
    }

    if (initialBlockId && initialBlockId !== 'ALL') return initialBlockId;
    if (targetLetter) return `block-${targetLetter}`;

    return null;
  }, [isAdmin, userAssignedBlock, currentUser, blocks, initialBlockId]);

  // २. इफेक्टिव्ह ब्लॉक आयडी: इनचार्जसाठी सक्तीने त्याचाच ब्लॉक, ॲडमिनसाठी ड्रॉपडाउन
  const [selectedBlockId, setSelectedBlockId] = useState<string>(() => {
    if (!isAdmin && resolvedInchargeBlockId) return resolvedInchargeBlockId;
    return initialBlockId || 'ALL';
  });

  useEffect(() => {
    if (!isAdmin && resolvedInchargeBlockId) {
      setSelectedBlockId(resolvedInchargeBlockId);
    } else if (initialBlockId) {
      setSelectedBlockId(initialBlockId);
    }
  }, [isAdmin, resolvedInchargeBlockId, initialBlockId]);

 // 🔴 अचूक ब्लॉक आयसोलेशन: इनचार्ज असेल तर सक्तीने त्याचा ब्लॉक लॉक राहील, ॲडमिन असेल तर निवडलेला ब्लॉक येईल
  const effectiveBlockId = useMemo(() => {
    if (!isAdmin) {
      if (resolvedInchargeBlockId) return resolvedInchargeBlockId;
      if (userAssignedBlock?.id) return userAssignedBlock.id;
      if (currentUser?.assignedBlockId && currentUser.assignedBlockId !== 'ALL') {
        return currentUser.assignedBlockId;
      }
    }
    return selectedBlockId || initialBlockId || 'ALL';
  }, [isAdmin, resolvedInchargeBlockId, userAssignedBlock, currentUser, selectedBlockId, initialBlockId]);

  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>(weeklyLineOnly ? 'line' : 'bar');

  const activeBlock = useMemo(() => {
    if (effectiveBlockId === 'ALL') return null;
    const targetNorm = normalizeBlock(effectiveBlockId);
    return blocks.find((b) => b.id === effectiveBlockId || normalizeBlock(b.id) === targetNorm || normalizeBlock(b.code) === targetNorm) || null;
  }, [effectiveBlockId, blocks]);

  // Compute graph dataset based on chosen granularity
  const graphData = useMemo(() => {
    const todayStr = getTodayDateStr();
    const curYear = getCurrentYear();
    if (timeframe === 'day') {
      return getDayWiseData(effectiveBlockId, todayStr);
    } else if (timeframe === 'week') {
      return getWeekWiseData(effectiveBlockId, todayStr);
    } else if (timeframe === 'month') {
      return getMonthWiseData(effectiveBlockId, todayStr);
    } else {
      return getYearWiseData(effectiveBlockId, curYear);
    }
  }, [timeframe, effectiveBlockId, getDayWiseData, getWeekWiseData, getMonthWiseData, getYearWiseData]);

  // Summary statistics for the chart
  const summaryStats = useMemo(() => {
    if (!graphData || graphData.length === 0) return { totalUnits: 0, peakUnits: 0, peakLabel: '-', avgUnits: 0, totalCost: 0 };
    
    let total = 0;
    let max = -1;
    let maxLabel = '-';

    graphData.forEach((item: any) => {
      const u = item.units || item.bill || 0;
      total += u;
      if (u > max) {
        max = u;
        maxLabel = item.time || item.day || item.period || item.shortMonth || item.month || '-';
      }
    });

    const avg = +(total / graphData.length).toFixed(1);

    return {
      totalUnits: total,
      peakUnits: Math.max(0, max),
      peakLabel: maxLabel,
      avgUnits: avg,
      totalCost: total * tariff.baseRatePerUnit,
    };
  }, [graphData, tariff]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const units = data.units ?? data.bill ?? 0;
      const cost = data.cost ?? (timeframe === 'year' ? data.bill : units * tariff.baseRatePerUnit);

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-44">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label || data.time || data.day || data.period || data.month}</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {activeBlock ? activeBlock.code : 'ALL'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Energy Consumption:</span>
            <span className="font-mono font-bold text-white text-sm">
              {units.toLocaleString()} <span className="text-[10px] text-cyan-400">kWh</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Estimated Cost:</span>
            <span className="font-mono font-bold text-amber-400">
              {tariff.currencySymbol} {cost.toLocaleString()}
            </span>
          </div>

          {data.kw && (
            <div className="flex justify-between items-center text-slate-400 text-[11px] pt-0.5">
              <span>Peak Demand:</span>
              <span className="font-mono text-slate-300">{data.kw} kW</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getPrimaryColor = () => {
    if (activeBlock) return activeBlock.color;
    return '#06b6d4';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Analytics
            </span>
            <span className="text-xs text-slate-400">Granular load patterns</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Energy Consumption Graphs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Analyze Day-Wise, Week-Wise, Month-Wise & Year-Wise consumption profiles
          </p>
        </div>

        {/* Filters Controls Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Block Selection (फक्त ॲडमिनसाठी खुला, इनचार्जसाठी ब्लॉक लॉक) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 px-2">Block:</span>
              <select
                id="select-graph-block"
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Blocks (Combined)</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Granularity Tabs (Day / Week / Month / Year) */}
          {!weeklyLineOnly && (
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                id="tab-graph-day"
                onClick={() => setTimeframe('day')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'day'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Day Wise
              </button>
              <button
                id="tab-graph-week"
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'week'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Week Wise
              </button>
              <button
                id="tab-graph-month"
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'month'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Month Wise
              </button>
              <button
                id="tab-graph-year"
                onClick={() => setTimeframe('year')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'year'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Year Wise
              </button>
            </div>
          )}

          {/* Chart Style Switcher (Bar / Area / Line) */}
          {!weeklyLineOnly && (
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  chartType === 'bar' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  chartType === 'area' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  chartType === 'line' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Line
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
        {/* Chart Title & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>
                {timeframe === 'day' && 'Hourly Energy Load Profile (24 Hours)'}
                {timeframe === 'week' && 'Weekly Consumption Trend (Last 7 Days)'}
                {timeframe === 'month' && `${formatMonthYear(getTodayDateStr().slice(0, 7))} Consumption by Week (W1 - W4)`}
                {timeframe === 'year' && `Annual Energy Trend (Jan - Dec ${getCurrentYear()})`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Active Scope: <strong className="text-slate-200">{activeBlock ? activeBlock.name : 'All Company Blocks Combined'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-cyan-400 inline-block"></span>
              Energy Units (kWh)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
              Tariff @ {tariff.currencySymbol}{tariff.baseRatePerUnit}/kWh
            </span>
          </div>
        </div>

        {/* Dynamic Recharts Area */}
        <div className="h-[360px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getPrimaryColor()} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={getPrimaryColor()} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey={timeframe === 'day' ? 'time' : timeframe === 'week' ? 'day' : timeframe === 'month' ? 'period' : 'shortMonth'}
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={timeframe === 'year' ? 'bill' : 'units'}
                  name="Energy Units (kWh)"
                  fill="url(#energyBarGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : chartType === 'area' ? (
              <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getPrimaryColor()} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={getPrimaryColor()} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey={timeframe === 'day' ? 'time' : timeframe === 'week' ? 'day' : timeframe === 'month' ? 'period' : 'shortMonth'}
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={timeframe === 'year' ? 'bill' : 'units'}
                  stroke={getPrimaryColor()}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#energyAreaGrad)"
                />
              </AreaChart>
            ) : (
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey={timeframe === 'day' ? 'time' : timeframe === 'week' ? 'day' : timeframe === 'month' ? 'period' : 'shortMonth'}
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={timeframe === 'year' ? 'bill' : 'units'}
                  stroke={getPrimaryColor()}
                  strokeWidth={3}
                  dot={{ r: 4, fill: getPrimaryColor() }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Insight Summary Tiles Below Graph */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Total In Period</span>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {summaryStats.totalUnits.toLocaleString()} <span className="text-xs font-normal text-cyan-400">kWh</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Peak Interval</span>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {summaryStats.peakLabel}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{summaryStats.peakUnits.toLocaleString()} kWh high</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Average Interval Load</span>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
              {summaryStats.avgUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">kWh/int</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Calculated Period Cost</span>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {tariff.currencySymbol} {summaryStats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};