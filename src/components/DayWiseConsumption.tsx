import React, { useState, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { 
  getTodayDateStr, 
  getYesterdayDateStr, 
  getCurrentMonthStr, 
  formatReadableDate 
} from '../utils/dateUtils';
import { 
  Calendar, 
  Zap, 
  TrendingUp, 
  Building, 
  PlusCircle, 
  Download, 
  Printer, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Clock, 
  FileSpreadsheet,
  BarChart3,
  ExternalLink,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  LabelList,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DayWiseConsumptionProps {
  onOpenEnterReading: (blockId?: string, mode?: 'single' | 'batch4m') => void;
  initialBlockId?: string;
}

interface DayAggregate {
  date: string;
  dayName: string;
  totalUnits: number;
  totalCost: number;
  avgPf: number;
  metersCount: number;
  blockUnits: Record<string, number>;
  readings: any[];
}

export const DayWiseConsumption: React.FC<DayWiseConsumptionProps> = ({
  onOpenEnterReading,
}) => {
  const {
    blocks,
    meters,
    readings,
    tariff,
    currentUser,
    canEnterReading,
    isDarkMode
  } = useEnergy();

  // Date Range Presets & Filter (Removed single campus block filter as requested)
  const [dateRangePreset, setDateRangePreset] = useState<
    'TODAY' | 'YESTERDAY' | 'LAST7' | 'LAST14' | 'LAST30' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'
  >('LAST7');
  
  const [customDate, setCustomDate] = useState<string>(getTodayDateStr());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [chartDisplayMode, setChartDisplayMode] = useState<'grouped' | 'stacked'>('grouped');

  // Selected Day Date specifically for the Day-Wise block cards and Day-Wise consumption graph
  const [selectedDayDate, setSelectedDayDate] = useState<string>(getTodayDateStr());
  // Toggle between Day-Wise Block Breakdown (selected day according to upper cards) and Multi-Day Timeline
  const [graphViewMode, setGraphViewMode] = useState<'day_blocks' | 'multi_day'>('day_blocks');

  // Distinct vibrant color palette for each and every block
  const BLOCK_DISTINCT_COLORS = [
    '#2563eb', // Royal Blue (Block A)
    '#059669', // Emerald Green (Block B)
    '#d97706', // Amber Gold (Block C)
    '#7c3aed', // Vivid Purple (Block D)
    '#db2777', // Vibrant Pink (Block E)
    '#0891b2', // Ocean Cyan (Block F)
    '#ea580c', // Flame Orange (Block G)
    '#4f46e5', // Deep Indigo (Block H)
  ];

  const getBlockColor = (block: any, index: number) => {
    if (block?.color) {
      return block.color;
    }
    return BLOCK_DISTINCT_COLORS[index % BLOCK_DISTINCT_COLORS.length];
  };

  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  const gridStroke = isDarkMode ? '#334155' : '#e2e8f0';
  const axisStroke = isDarkMode ? '#94a3b8' : '#64748b';

  // Helper date navigation
  const handlePrevDay = () => {
    const cur = new Date((selectedDayDate || todayStr) + 'T00:00:00');
    cur.setDate(cur.getDate() - 1);
    setSelectedDayDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date((selectedDayDate || todayStr) + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    setSelectedDayDate(cur.toISOString().split('T')[0]);
  };

  // Day-by-Day Aggregation of all readings across campus blocks
  const allDayAggregates = useMemo(() => {
    const map = new Map<string, DayAggregate>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    readings.forEach((r) => {
      const date = r.readingDate;
      if (!date) return;

      if (!map.has(date)) {
        const dObj = new Date(date + 'T00:00:00');
        const dayName = isNaN(dObj.getTime()) ? '-' : dayNames[dObj.getDay()];
        map.set(date, {
          date,
          dayName,
          totalUnits: 0,
          totalCost: 0,
          avgPf: 0,
          metersCount: 0,
          blockUnits: {},
          readings: [],
        });
      }

      const entry = map.get(date)!;
      entry.readings.push(r);
      entry.metersCount += 1;
      entry.totalUnits += r.unitsConsumed;
      entry.blockUnits[r.blockId] = (entry.blockUnits[r.blockId] || 0) + r.unitsConsumed;
    });

    // Compute costs and averages for each day
    map.forEach((entry) => {
      entry.totalCost = +(entry.totalUnits * tariff.baseRatePerUnit).toFixed(2);
      const pfReadings = entry.readings.filter((r) => r.powerFactor && r.powerFactor > 0);
      if (pfReadings.length > 0) {
        const sumPf = pfReadings.reduce((sum, r) => sum + r.powerFactor, 0);
        entry.avgPf = +(sumPf / pfReadings.length).toFixed(3);
      } else {
        entry.avgPf = 0.95;
      }
    });

    // Sort by date descending (newest first)
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [readings, tariff.baseRatePerUnit]);

  // Filtered Day Aggregates based on selected date presets & search
  const filteredDayAggregates = useMemo(() => {
    let list = allDayAggregates;

    if (dateRangePreset === 'TODAY') {
      list = list.filter((d) => d.date === todayStr);
    } else if (dateRangePreset === 'YESTERDAY') {
      list = list.filter((d) => d.date === yesterdayStr);
    } else if (dateRangePreset === 'LAST7') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const cutoff = d7.toISOString().split('T')[0];
      list = list.filter((d) => d.date >= cutoff);
    } else if (dateRangePreset === 'LAST14') {
      const d14 = new Date();
      d14.setDate(d14.getDate() - 14);
      const cutoff = d14.toISOString().split('T')[0];
      list = list.filter((d) => d.date >= cutoff);
    } else if (dateRangePreset === 'LAST30') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const cutoff = d30.toISOString().split('T')[0];
      list = list.filter((d) => d.date >= cutoff);
    } else if (dateRangePreset === 'THIS_MONTH') {
      const curMo = getCurrentMonthStr();
      list = list.filter((d) => d.date.startsWith(curMo));
    } else if (dateRangePreset === 'CUSTOM' && customDate) {
      list = list.filter((d) => d.date === customDate);
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) => 
        d.date.includes(q) || 
        d.dayName.toLowerCase().includes(q) ||
        formatReadableDate(d.date).toLowerCase().includes(q)
      );
    }

    return list;
  }, [allDayAggregates, dateRangePreset, customDate, todayStr, yesterdayStr, searchQuery]);

  // Campus-wide Daily KPIs across all blocks
  const kpis = useMemo(() => {
    const todayAgg = allDayAggregates.find((d) => d.date === todayStr);
    const yesterdayAgg = allDayAggregates.find((d) => d.date === yesterdayStr);

    const todayUnits = todayAgg ? todayAgg.totalUnits : 0;
    const yesterdayUnits = yesterdayAgg ? yesterdayAgg.totalUnits : 0;
    const todayCost = +(todayUnits * tariff.baseRatePerUnit).toFixed(0);

    // Difference between today and yesterday
    const diffUnits = todayUnits - yesterdayUnits;
    const diffPercent = yesterdayUnits > 0 ? ((diffUnits / yesterdayUnits) * 100).toFixed(1) : null;

    // Peak day calculation across all aggregates
    let peakDay = { date: '-', units: 0 };
    allDayAggregates.forEach((d) => {
      if (d.totalUnits > peakDay.units) {
        peakDay = { date: d.date, units: d.totalUnits };
      }
    });

    // Total and average consumption across filtered days
    const totalFilteredUnits = filteredDayAggregates.reduce((sum, d) => sum + d.totalUnits, 0);

    const avgDailyUnits = filteredDayAggregates.length > 0 
      ? Math.round(totalFilteredUnits / filteredDayAggregates.length) 
      : 0;

    return {
      todayUnits,
      yesterdayUnits,
      todayCost,
      diffUnits,
      diffPercent,
      peakDay,
      avgDailyUnits,
      totalDaysLogged: allDayAggregates.length,
      filteredDaysCount: filteredDayAggregates.length,
      filteredTotalUnits: totalFilteredUnits,
      filteredTotalCost: +(totalFilteredUnits * tariff.baseRatePerUnit).toFixed(0)
    };
  }, [allDayAggregates, filteredDayAggregates, todayStr, yesterdayStr, tariff.baseRatePerUnit]);

  // Block-wise statistics for Today or Selected Day (shared across upper cards & down-side graph)
  const blockDailyStats = useMemo(() => {
    // Target date is explicitly driven by selectedDayDate, with fallback to today
    const targetDate = selectedDayDate || todayStr;

    const targetAgg = allDayAggregates.find((d) => d.date === targetDate);
    const prevDateObj = new Date(targetDate + 'T00:00:00');
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];
    const prevAgg = allDayAggregates.find((d) => d.date === prevDateStr);

    const totalCampusUnits = targetAgg ? targetAgg.totalUnits : 0;

    return blocks.map((b) => {
      const units = targetAgg ? (targetAgg.blockUnits[b.id] || 0) : 0;
      const prevUnits = prevAgg ? (prevAgg.blockUnits[b.id] || 0) : 0;
      const cost = +(units * tariff.baseRatePerUnit).toFixed(0);
      const sharePercent = totalCampusUnits > 0 ? ((units / totalCampusUnits) * 100).toFixed(1) : '0';
      const blockMeters = meters.filter((m) => m.blockId === b.id);
      
      // Count how many meters of this block have logged on targetDate
      const loggedMetersCount = targetAgg 
        ? targetAgg.readings.filter((r) => r.blockId === b.id).length 
        : 0;

      const diff = units - prevUnits;

      return {
        block: b,
        targetDate,
        units,
        prevUnits,
        diff,
        cost,
        sharePercent,
        totalMeters: blockMeters.length,
        loggedMetersCount,
        isFullyLogged: loggedMetersCount >= blockMeters.length && blockMeters.length > 0
      };
    });
  }, [blocks, allDayAggregates, selectedDayDate, todayStr, tariff.baseRatePerUnit, meters]);

  // Chart Data for the Day-Wise Block Graph (according to upper side blocks data for selected day)
  const singleDayBlocksChartData = useMemo(() => {
    return blockDailyStats.map((item, idx) => {
      const color = getBlockColor(item.block, idx);
      return {
        id: item.block.id,
        name: item.block.name,
        code: item.block.code,
        units: item.units,
        cost: item.cost,
        sharePercent: item.sharePercent,
        prevUnits: item.prevUnits,
        diff: item.diff,
        loggedMetersCount: item.loggedMetersCount,
        totalMeters: item.totalMeters,
        color,
      };
    });
  }, [blockDailyStats]);

  // Chart Data: All Blocks chronologically ordered (oldest to newest)
  const chartData = useMemo(() => {
    const list = [...filteredDayAggregates].sort((a, b) => a.date.localeCompare(b.date));
    return list.map((d) => {
      const row: any = {
        date: d.date.slice(5), // MM-DD
        fullDate: d.date,
        day: d.dayName,
        total: d.totalUnits,
        totalCost: d.totalCost,
      };

      blocks.forEach((b) => {
        row[b.id] = d.blockUnits[b.id] || 0;
      });

      return row;
    });
  }, [filteredDayAggregates, blocks]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Total kWh', 'Total Cost (INR)', 'Power Factor', 'Meters Logged'];
    blocks.forEach((b) => headers.push(`"${b.name} (kWh)"`));

    const rows = filteredDayAggregates.map((d) => {
      const base = [
        d.date,
        d.dayName,
        d.totalUnits,
        d.totalCost,
        d.avgPf,
        d.metersCount
      ];
      blocks.forEach((b) => {
        base.push(d.blockUnits[b.id] || 0);
      });
      return base.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `day_wise_energy_consumption_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Standalone High-Resolution Printable HTML Document
  const generateDayWisePrintHtml = () => {
    const generatedOn = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const periodLabel = dateRangePreset === 'TODAY' 
      ? `Today (${formatReadableDate(todayStr)})`
      : dateRangePreset === 'YESTERDAY'
      ? `Yesterday (${formatReadableDate(yesterdayStr)})`
      : dateRangePreset === 'LAST7'
      ? 'Last 7 Days'
      : dateRangePreset === 'LAST14'
      ? 'Last 14 Days'
      : dateRangePreset === 'LAST30'
      ? 'Last 30 Days'
      : dateRangePreset === 'THIS_MONTH'
      ? 'This Month'
      : dateRangePreset === 'CUSTOM'
      ? `Selected Date (${formatReadableDate(customDate)})`
      : 'Complete System History';

    const blockRowsHtml = blockDailyStats.map((b) => `
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">${b.block.name} (${b.block.code})</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #475569;">${b.loggedMetersCount} / ${b.totalMeters} Meters</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${b.units.toLocaleString()} kWh</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; font-family: monospace; color: #b45309;">${tariff.currencySymbol} ${b.cost.toLocaleString()}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 600; color: #0369a1;">${b.sharePercent}%</td>
      </tr>
    `).join('');

    const dayRowsHtml = filteredDayAggregates.map((d) => `
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 600; color: #0f172a;">
          ${d.date} (${d.dayName})
        </td>
        ${blocks.map((b) => {
          const val = d.blockUnits[b.id] || 0;
          return `<td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: ${val > 0 ? '#0f172a' : '#94a3b8'};">${val > 0 ? val.toLocaleString() : '-'}</td>`;
        }).join('')}
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; font-family: monospace; color: #0369a1;">${d.totalUnits.toLocaleString()}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; font-family: monospace; color: #b45309;">${tariff.currencySymbol} ${d.totalCost.toLocaleString()}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #6b21a8;">${d.avgPf.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #047857; font-weight: 600;">${d.metersCount} Logged</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Day-Wise Energy Consumption Sheet - Campus Energy System</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
      line-height: 1.4;
    }
    .sheet-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-area h1 {
      font-size: 16px;
      font-weight: 900;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .title-area p {
      margin: 0;
      font-size: 11px;
      color: #475569;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #334155;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #475569;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
      text-transform: uppercase;
      font-size: 9px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      margin: 10px 0 6px 0;
      border-left: 3px solid #0284c7;
      padding-left: 6px;
    }
    .signatures-section {
      margin-top: 24px;
      border-top: 1px dashed #94a3b8;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      width: 180px;
    }
    .sig-line {
      border-bottom: 1px solid #475569;
      margin-top: 35px;
      margin-bottom: 4px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 10px;
      color: #0f172a;
    }
    .sig-role {
      font-size: 9px;
      color: #64748b;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="sheet-header">
    <div class="title-area">
      <h1>Campus Energy Management System</h1>
      <p>Day-Wise Energy Consumption & Departmental Reconciliation Audit Sheet</p>
    </div>
    <div class="meta-box">
      <div><strong>Report Scope:</strong> ${periodLabel}</div>
      <div><strong>Generated On:</strong> ${generatedOn}</div>
      <div><strong>Audited By:</strong> ${currentUser.name} (${currentUser.role})</div>
      <div><strong>Base Tariff:</strong> ${tariff.currencySymbol}${tariff.baseRatePerUnit}/kWh</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Today's Total Campus Load</div>
      <div class="kpi-val" style="color: #0284c7;">${kpis.todayUnits.toLocaleString()} kWh</div>
      <div class="kpi-sub">Est. Cost: ${tariff.currencySymbol}${kpis.todayCost.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Yesterday's Total Load</div>
      <div class="kpi-val">${kpis.yesterdayUnits.toLocaleString()} kWh</div>
      <div class="kpi-sub">${formatReadableDate(yesterdayStr)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Peak Daily Load</div>
      <div class="kpi-val" style="color: #b45309;">${kpis.peakDay.units.toLocaleString()} kWh</div>
      <div class="kpi-sub">On: ${formatReadableDate(kpis.peakDay.date)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Daily Average Load</div>
      <div class="kpi-val" style="color: #7e22ce;">${kpis.avgDailyUnits.toLocaleString()} kWh/day</div>
      <div class="kpi-sub">Across ${kpis.filteredDaysCount} active logged days</div>
    </div>
  </div>

  <div class="section-title">1. Block-Wise Energy Distribution & Status</div>
  <table>
    <thead>
      <tr>
        <th>Campus Block</th>
        <th style="text-align: center;">Meters Logged</th>
        <th style="text-align: right;">Energy Consumed (kWh)</th>
        <th style="text-align: right;">Day Cost (${tariff.currencySymbol})</th>
        <th style="text-align: center;">Load Share (%)</th>
      </tr>
    </thead>
    <tbody>
      ${blockRowsHtml}
    </tbody>
  </table>

  <div class="section-title">2. Master Day-by-Day Campus Energy Consumption Matrix</div>
  <table>
    <thead>
      <tr>
        <th>Date & Day</th>
        ${blocks.map((b) => `<th style="text-align: right;">${b.code} (kWh)</th>`).join('')}
        <th style="text-align: right; color: #0284c7;">Total (kWh)</th>
        <th style="text-align: right; color: #b45309;">Cost (${tariff.currencySymbol})</th>
        <th style="text-align: center;">Avg PF</th>
        <th style="text-align: center;">Meters</th>
      </tr>
    </thead>
    <tbody>
      ${dayRowsHtml}
    </tbody>
  </table>

  <div class="signatures-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">${currentUser.name}</div>
      <div class="sig-role">Operator / ${currentUser.role}</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">Electrical Supervisor</div>
      <div class="sig-role">Campus Substation Division</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">Chief Electrical Engineer</div>
      <div class="sig-role">Institutional Facility Director</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  // Direct Print & Robust Standalone Tab Handlers
  const handleOpenInNewTab = () => {
    try {
      const html = generateDayWisePrintHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Failed to open printable sheet in new tab:', e);
      handleDownloadPrintHtml();
    }
  };

  const handleDownloadPrintHtml = () => {
    try {
      const html = generateDayWisePrintHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Day_Wise_Energy_Consumption_${getTodayDateStr()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error('Failed to download report:', e);
    }
  };

  const handleDirectPrint = () => {
    try {
      const html = generateDayWisePrintHtml();
      // Use an isolated hidden iframe to guarantee clean printing in iframe sandbox
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (printErr) {
            console.warn('Iframe print failed, fallback to window.print():', printErr);
            window.print();
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }
        }, 350);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Direct print failed, downloading printable HTML report:', err);
      handleDownloadPrintHtml();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Title */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isDarkMode 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Daily Reconciliation Active
              </span>
              <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Today: {formatReadableDate(todayStr)}
              </span>
            </div>

            <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Day-Wise Energy Consumption System
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Day-by-day active energy tracking for each and every block. Any newly entered daily reading updates this section automatically in real time.
            </p>
          </div>

          {/* Quick Action Controls: Log Reading, Export, Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canEnterReading() && (
              <button
                id="btn-daywise-enter-reading"
                onClick={() => onOpenEnterReading(undefined, 'single')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Daily Reading</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Export CSV</span>
            </button>

            {/* Print Sheet Action Button: Opens dedicated Print Options Modal */}
            <button
              id="btn-daywise-print-sheet"
              onClick={() => setIsPrintModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              <Printer className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* Date Range Selector Toolbar (Campus Block selector removed as requested) */}
        <div className={`mt-5 pt-4 border-t flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Calendar className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Select Date Scope:</span>
            </span>
          </div>

          {/* Date Range Preset Selector & Custom Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'LAST7', label: 'Last 7D' },
                { id: 'LAST14', label: 'Last 14D' },
                { id: 'LAST30', label: 'Last 30D' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL', label: 'All History' },
                { id: 'CUSTOM', label: 'Custom Date' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setDateRangePreset(preset.id as any)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    dateRangePreset === preset.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {dateRangePreset === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={`px-2.5 py-1 text-xs rounded-xl border font-mono focus:outline-none focus:border-cyan-500 ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid (High contrast in Light & Dark Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Daily Consumption */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Today's Daily Consumption
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
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
            <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              kWh
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Est. Cost: <strong className={`font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-700 font-bold'}`}>{tariff.currencySymbol}{kpis.todayCost.toLocaleString()}</strong>
            </span>
            {kpis.diffPercent !== null && (
              <span className={`flex items-center gap-0.5 font-semibold ${
                +kpis.diffPercent >= 0 
                  ? isDarkMode ? 'text-rose-400' : 'text-rose-600'
                  : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {+kpis.diffPercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{Math.abs(+kpis.diffPercent)}% vs Y'day</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Yesterday's Daily Consumption */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Yesterday's Consumption
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {kpis.yesterdayUnits.toLocaleString()}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              kWh
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              {formatReadableDate(yesterdayStr)}
            </span>
            <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700 font-semibold'}`}>
              Recorded Cleanly
            </span>
          </div>
        </div>

        {/* Card 3: Highest / Peak Day Consumption */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Peak Daily Load
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-amber-400' : 'text-amber-600'
            }`}>
              {kpis.peakDay.units.toLocaleString()}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              kWh
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Highest on: <strong className={`font-mono ${isDarkMode ? 'text-white' : 'text-slate-900 font-bold'}`}>{formatReadableDate(kpis.peakDay.date)}</strong>
            </span>
            <span className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              Max Peak
            </span>
          </div>
        </div>

        {/* Card 4: Daily Average Consumption */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Daily Average Load
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {kpis.avgDailyUnits.toLocaleString()}
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              kWh / day
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Across {kpis.filteredDaysCount} active days
            </span>
            <span className={`font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-700 font-semibold'}`}>
              Base Mean
            </span>
          </div>
        </div>
      </div>

      {/* Each & Every Block Day-Wise KPI Cards Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Day-Wise Consumption of Each & Every Block
            </h2>
          </div>

          {/* Quick Selected Day Indicator & Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Selected Date:
            </span>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${
              isDarkMode 
                ? 'bg-slate-800 text-cyan-300 border-slate-700' 
                : 'bg-cyan-50 text-cyan-800 border-cyan-200'
            }`}>
              {formatReadableDate(selectedDayDate)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDayDate(todayStr)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedDayDate === todayStr
                    ? isDarkMode 
                      ? 'bg-cyan-500 text-slate-950 font-extrabold border-cyan-400' 
                      : 'bg-cyan-600 text-white font-extrabold border-cyan-600 shadow-2xs'
                    : isDarkMode 
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' 
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayDate(yesterdayStr)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedDayDate === yesterdayStr
                    ? isDarkMode 
                      ? 'bg-cyan-500 text-slate-950 font-extrabold border-cyan-400' 
                      : 'bg-cyan-600 text-white font-extrabold border-cyan-600 shadow-2xs'
                    : isDarkMode 
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' 
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {blockDailyStats.map((item) => {
            const { block, units, cost, sharePercent, totalMeters, loggedMetersCount, isFullyLogged } = item;

            return (
              <div
                key={block.id}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                  isDarkMode 
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Top header: Block badge and status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shadow-xs ring-1 ring-black/10" 
                      style={{ backgroundColor: block.color }}
                    ></span>
                    <h3 className={`font-extrabold text-sm ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {block.name}
                    </h3>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    isDarkMode 
                      ? 'bg-slate-800 text-cyan-300 border-slate-700' 
                      : 'bg-slate-100 text-cyan-800 border-slate-200'
                  }`}>
                    {block.code}
                  </span>
                </div>

                {/* Day Units Number */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Daily Energy
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-2xl font-black font-mono tracking-tight ${
                        isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                      }`}>
                        {units.toLocaleString()}
                      </span>
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        kWh
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Day Cost
                    </div>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      {tariff.currencySymbol}{cost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Meter status & percentage share */}
                <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
                  isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {isFullyLogged ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}>
                      {loggedMetersCount}/{totalMeters} Meters Logged
                    </span>
                  </div>

                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${
                    isDarkMode 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                      : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                  }`}>
                    {sharePercent}% Load
                  </span>
                </div>

                {/* Quick Add Reading button on hover / active */}
                {canEnterReading(block.id) && (
                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      In-Charge: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{block.inchargeName || 'Lead Tech'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEnterReading(block.id, 'single')}
                      className={`font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer ${
                        isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      <span>+ Enter Daily</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Day-Wise Consumption Records Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Table Header & Toolbar */}
        <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>Day-Wise Consumption Log & Block Breakdown Matrix</span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Showing {filteredDayAggregates.length} logged calendar days. Click any date row to expand individual sub-meter readings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search date or day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-cyan-500 w-44 sm:w-52 ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredDayAggregates.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Calendar className={`w-10 h-10 mx-auto mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No day-wise readings match your current filter
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Try selecting a broader date preset or enter daily readings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider font-semibold border-b text-[11px] ${
                isDarkMode 
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="py-3 px-4">Date & Day</th>
                  {blocks.map((b) => (
                    <th key={b.id} className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: b.color }}></span>
                        <span>{b.code}</span>
                      </span>
                    </th>
                  ))}
                  <th className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    Total (kWh)
                  </th>
                  <th className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    Day Cost
                  </th>
                  <th className="py-3 px-3 text-center">Avg PF</th>
                  <th className="py-3 px-3 text-center">Meters</th>
                  <th className="py-3 px-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-sans ${
                isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'
              }`}>
                {filteredDayAggregates.map((dayAgg) => {
                  const isExpanded = expandedDate === dayAgg.date;
                  const isToday = dayAgg.date === todayStr;

                  return (
                    <React.Fragment key={dayAgg.date}>
                      <tr 
                        onClick={() => setExpandedDate(isExpanded ? null : dayAgg.date)}
                        className={`transition-colors cursor-pointer ${
                          isExpanded 
                            ? isDarkMode ? 'bg-cyan-950/20' : 'bg-cyan-50/70'
                            : isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Date & Day */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              {formatReadableDate(dayAgg.date)}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {dayAgg.dayName}
                            </span>
                            {isToday && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                isDarkMode 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Each Block's kWh for this day */}
                        {blocks.map((b) => {
                          const units = dayAgg.blockUnits[b.id] || 0;
                          return (
                            <td key={b.id} className="py-3 px-3 text-right font-mono font-semibold">
                              {units > 0 ? (
                                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800 font-semibold'}>
                                  {units.toLocaleString()}
                                </span>
                              ) : (
                                <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Daily kWh */}
                        <td className={`py-3 px-4 text-right font-mono font-black text-sm ${
                          isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                        }`}>
                          {dayAgg.totalUnits.toLocaleString()}
                        </td>

                        {/* Total Day Cost */}
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          isDarkMode ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          {tariff.currencySymbol}{dayAgg.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </td>

                        {/* Avg PF */}
                        <td className={`py-3 px-3 text-center font-mono font-semibold ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-700'
                        }`}>
                          {dayAgg.avgPf.toFixed(2)}
                        </td>

                        {/* Meters Recorded */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            dayAgg.metersCount >= meters.length 
                              ? isDarkMode 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDarkMode 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {dayAgg.metersCount} Meters
                          </span>
                        </td>

                        {/* Expand Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-cyan-500 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-Meter Readings Details for this Date */}
                      {isExpanded && (
                        <tr className={isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50/80'}>
                          <td colSpan={6 + blocks.length} className="p-4">
                            <div className={`p-4 rounded-xl border ${
                              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                  <h4 className={`text-xs font-bold uppercase tracking-wider ${
                                    isDarkMode ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    Detailed Sub-Meter Logs for {formatReadableDate(dayAgg.date)}
                                  </h4>
                                </div>
                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Total {dayAgg.readings.length} Sub-Meter entries recorded
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className={`text-[10px] uppercase font-bold border-b ${
                                    isDarkMode 
                                      ? 'text-slate-400 border-slate-800' 
                                      : 'text-slate-700 border-slate-200 bg-slate-50'
                                  }`}>
                                    <tr>
                                      <th className="py-2 px-3">Block</th>
                                      <th className="py-2 px-3">Meter No.</th>
                                      <th className="py-2 px-3 text-right">Previous (kWh)</th>
                                      <th className="py-2 px-3 text-right">Current (kWh)</th>
                                      <th className="py-2 px-2 text-center">MF</th>
                                      <th className={`py-2 px-3 text-right font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Units Consumed</th>
                                      <th className={`py-2 px-3 text-right font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Est. Cost</th>
                                      <th className="py-2 px-3">Logged By</th>
                                      <th className="py-2 px-3">Notes / Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className={`divide-y font-mono ${
                                    isDarkMode ? 'divide-slate-800/60' : 'divide-slate-100'
                                  }`}>
                                    {dayAgg.readings.map((r: any) => {
                                      const blk = blocks.find((b) => b.id === r.blockId);
                                      const cost = (r.unitsConsumed * tariff.baseRatePerUnit).toFixed(2);
                                      return (
                                        <tr key={r.id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                                          <td className="py-2 px-3 font-sans">
                                            <span className="inline-flex items-center gap-1.5 font-bold">
                                              <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: blk?.color || '#06b6d4' }}></span>
                                              <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{blk?.name || r.blockId}</span>
                                            </span>
                                          </td>
                                          <td className={`py-2 px-3 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                                            {r.meterNumber}
                                          </td>
                                          <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {r.previousReading.toLocaleString()}
                                          </td>
                                          <td className={`py-2 px-3 text-right font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {r.currentReading.toLocaleString()}
                                          </td>
                                          <td className={`py-2 px-2 text-center font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                            ×{r.multiplier || 1}
                                          </td>
                                          <td className={`py-2 px-3 text-right font-black ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                            {r.unitsConsumed.toLocaleString()} kWh
                                          </td>
                                          <td className={`py-2 px-3 text-right font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                            {tariff.currencySymbol}{cost}
                                          </td>
                                          <td className={`py-2 px-3 font-sans ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                                            {r.enteredByName}
                                          </td>
                                          <td className={`py-2 px-3 font-sans italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {r.notes || 'Normal operation'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
          </div>
        )}
      </div>

      {/* Visual Day-Wise Consumption Graph (Down Side with Day/Date Selection and Direct Sync to Upper Side Blocks Data) */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Graph Header: Title & Day/Date Selection Options */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                isDarkMode 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                  : 'bg-cyan-50 text-cyan-700 border-cyan-300'
              }`}>
                {graphViewMode === 'day_blocks' ? 'Day-Wise Block Breakdown' : 'Historical Timeline'}
              </span>
              <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Date: {formatReadableDate(selectedDayDate)}
              </span>
            </div>
            <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 mt-1.5 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>
                {graphViewMode === 'day_blocks' 
                  ? `Day-Wise Block Consumption Graph (${formatReadableDate(selectedDayDate)})`
                  : 'Day-Wise Consumption Progression (Timeline)'}
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {graphViewMode === 'day_blocks'
                ? 'Showing each and every block consumption (kWh) directly corresponding to the upper side blocks data for the selected date.'
                : 'Showing chronological daily active kWh consumption per block across recorded dates.'}
            </p>
          </div>

          {/* Date Selection Options right on the Consumption Graph */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Day-Wise Blocks (default) vs Multi-Day Progression */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setGraphViewMode('day_blocks')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  graphViewMode === 'day_blocks'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Day-Wise (Selected Day)
              </button>
              <button
                type="button"
                onClick={() => setGraphViewMode('multi_day')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  graphViewMode === 'multi_day'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Multi-Day Timeline
              </button>
            </div>

            {/* Day / Date Selection Controls Available Right in the Graph */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isDarkMode 
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Date Select Dropdown of All Logged Dates */}
              <div className="relative">
                <select
                  id="graph-date-select"
                  value={selectedDayDate}
                  onChange={(e) => setSelectedDayDate(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer appearance-none pr-8 ${
                    isDarkMode 
                      ? 'bg-slate-950 text-cyan-300 border-slate-700 hover:border-cyan-500' 
                      : 'bg-white text-cyan-800 border-slate-300 hover:border-cyan-500 shadow-2xs'
                  }`}
                >
                  {allDayAggregates.map((d) => (
                    <option 
                      key={d.date} 
                      value={d.date} 
                      className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                    >
                      {d.date === todayStr ? `Today (${d.date} - ${d.dayName})` : d.date === yesterdayStr ? `Yesterday (${d.date} - ${d.dayName})` : `${d.date} (${d.dayName})`} — {d.totalUnits.toLocaleString()} kWh
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
              </div>

              {/* Date Picker Input for Calendar Date Selection */}
              <input
                id="graph-date-picker"
                type="date"
                value={selectedDayDate}
                onChange={(e) => setSelectedDayDate(e.target.value)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-950 text-slate-200 border-slate-700' 
                    : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                }`}
              />

              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isDarkMode 
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDayDate(todayStr)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  selectedDayDate === todayStr
                    ? isDarkMode ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Distinct Color Legend Badges for Each and Every Block (synchronized with Upper Side Cards) */}
        <div className={`flex flex-wrap items-center gap-2 mb-4 pb-3 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider mr-1 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Block Data:
          </span>
          {singleDayBlocksChartData.map((b) => (
            <div 
              key={b.id} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-800 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full shadow-xs shrink-0 ring-1 ring-black/10" 
                style={{ backgroundColor: b.color }} 
              />
              <span className="font-bold">{b.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {b.code}
              </span>
              <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                {b.units.toLocaleString()} kWh
              </span>
              <span className="text-[10px] opacity-70">
                ({b.sharePercent}%)
              </span>
            </div>
          ))}
        </div>

        {/* GRAPH VIEW 1: Day-Wise Block Graph for Selected Day (Matches Upper Side Blocks Data) */}
        {graphViewMode === 'day_blocks' ? (
          <div className="h-72 sm:h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={singleDayBlocksChartData} margin={{ top: 20, right: 15, left: 0, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={axisStroke} 
                  fontSize={12} 
                  tickLine={false} 
                  tick={{ fill: axisStroke, fontWeight: 600 }}
                  tickFormatter={(val) => {
                    const blk = blocks.find((b) => b.name === val);
                    return blk ? `${blk.code} - ${val}` : val;
                  }}
                />
                <YAxis 
                  stroke={axisStroke} 
                  fontSize={11} 
                  tickLine={false} 
                  tick={{ fill: axisStroke }}
                  tickFormatter={(val) => `${val} kWh`} 
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;

                    return (
                      <div className={`p-3.5 rounded-xl border shadow-xl text-xs min-w-[240px] ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white shadow-black/60' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                      }`}>
                        <div className={`pb-2 mb-2 border-b flex items-center justify-between ${
                          isDarkMode ? 'border-slate-800' : 'border-slate-100'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full ring-1 ring-black/10" 
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-bold text-sm">{data.name}</span>
                          </div>
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-cyan-800'
                          }`}>
                            {data.code}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Date:</span>
                            <span className="font-semibold">{formatReadableDate(selectedDayDate)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Daily Energy:</span>
                            <span className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                              {data.units.toLocaleString()} kWh
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Est. Day Cost:</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {tariff.currencySymbol}{data.cost.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Campus Share:</span>
                            <span className="font-semibold">{data.sharePercent}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Sub-Meters Logged:</span>
                            <span className="font-mono">{data.loggedMetersCount} / {data.totalMeters}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Diff vs Prev Day:</span>
                            <span className={`font-mono font-bold ${
                              data.diff > 0 
                                ? 'text-red-500' 
                                : data.diff < 0 
                                ? 'text-emerald-500' 
                                : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {data.diff > 0 ? `+${data.diff}` : `${data.diff}`} kWh
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="units" 
                  name="Energy Consumption"
                  radius={[8, 8, 0, 0]} 
                >
                  <LabelList 
                    dataKey="units" 
                    position="top" 
                    formatter={(val: any) => val > 0 ? `${Number(val).toLocaleString()} kWh` : ''} 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      fill: isDarkMode ? '#e2e8f0' : '#1e293b' 
                    }} 
                  />
                  {singleDayBlocksChartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* GRAPH VIEW 2: Multi-Day Timeline Progression */
          <div className="h-72 sm:h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke={axisStroke} 
                  fontSize={11} 
                  tickLine={false} 
                  tick={{ fill: axisStroke }}
                />
                <YAxis 
                  stroke={axisStroke} 
                  fontSize={11} 
                  tickLine={false} 
                  tick={{ fill: axisStroke }}
                  tickFormatter={(val) => `${val}`} 
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const dataPoint = payload[0]?.payload;
                    const fullDate = dataPoint?.fullDate || label;
                    const dayTotal = payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);

                    return (
                      <div className={`p-3.5 rounded-xl border shadow-xl text-xs min-w-[220px] ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white shadow-black/60' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                      }`}>
                        <div className={`pb-2 mb-2 border-b flex items-center justify-between ${
                          isDarkMode ? 'border-slate-800' : 'border-slate-100'
                        }`}>
                          <span className="font-bold text-sm">
                            {formatReadableDate(fullDate)}
                          </span>
                          <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {dataPoint?.day}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {payload.map((entry: any, index: number) => {
                            const blk = blocks.find((b) => b.id === entry.dataKey);
                            const color = entry.color || getBlockColor(blk, index);
                            return (
                              <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }}></span>
                                  <span className="font-semibold">{blk ? `${blk.name} (${blk.code})` : entry.name}</span>
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {Number(entry.value).toLocaleString()} kWh
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className={`pt-2 mt-2 border-t flex items-center justify-between font-bold ${
                          isDarkMode ? 'border-slate-800 text-cyan-400' : 'border-slate-100 text-cyan-700'
                        }`}>
                          <span>Day Total:</span>
                          <span className="font-mono text-sm">{dayTotal.toLocaleString()} kWh</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '11px', 
                    paddingTop: '12px', 
                    color: isDarkMode ? '#cbd5e1' : '#334155' 
                  }} 
                  formatter={(value) => {
                    const blk = blocks.find((b) => b.id === value);
                    return blk ? `${blk.name} (${blk.code})` : value;
                  }}
                />
                {blocks.map((b, idx) => {
                  const color = getBlockColor(b, idx);
                  return (
                    <Bar 
                      key={b.id} 
                      dataKey={b.id} 
                      name={b.name}
                      fill={color} 
                      stackId={chartDisplayMode === 'stacked' ? 'a' : undefined} 
                      radius={chartDisplayMode === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]} 
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dedicated Print Sheet Options & Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Print Day-Wise Consumption Sheet</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Official Institutional Electrical Audit & Departmental Reconciliation Sheet
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Action Bar */}
            <div className={`p-3 sm:px-5 border-b flex flex-wrap items-center justify-between gap-3 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Selected Scope:
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                  isDarkMode ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-slate-100 text-cyan-800 border-slate-300'
                }`}>
                  {dateRangePreset === 'ALL' ? 'All History' : dateRangePreset}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ({filteredDayAggregates.length} days recorded)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDirectPrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now</span>
                </button>

                <button
                  onClick={handleOpenInNewTab}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Opens document in a clean new window for unrestricted browser printing"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Open Printable Tab</span>
                </button>

                <button
                  onClick={handleDownloadPrintHtml}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>Download HTML</span>
                </button>
              </div>
            </div>

            {/* Print Sheet Document Preview Area */}
            <div className={`p-4 sm:p-6 overflow-y-auto flex-1 ${
              isDarkMode ? 'bg-slate-950/80' : 'bg-slate-100'
            }`}>
              <div className="max-w-3xl mx-auto bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 text-xs font-sans">
                {/* Official Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                      Campus Energy Management System
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Day-Wise Energy Consumption & Departmental Reconciliation Audit Sheet
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 font-mono">
                    <div><strong>Date:</strong> {formatReadableDate(todayStr)}</div>
                    <div><strong>Auditor:</strong> {currentUser.name} ({currentUser.role})</div>
                    <div><strong>Base Rate:</strong> {tariff.currencySymbol}{tariff.baseRatePerUnit}/kWh</div>
                  </div>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Today's Load</div>
                    <div className="text-sm font-black font-mono text-cyan-700">{kpis.todayUnits.toLocaleString()} kWh</div>
                    <div className="text-[10px] text-slate-500">{tariff.currencySymbol}{kpis.todayCost.toLocaleString()}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Yesterday's Load</div>
                    <div className="text-sm font-black font-mono text-slate-900">{kpis.yesterdayUnits.toLocaleString()} kWh</div>
                    <div className="text-[10px] text-slate-500">{formatReadableDate(yesterdayStr)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Peak Daily Load</div>
                    <div className="text-sm font-black font-mono text-amber-700">{kpis.peakDay.units.toLocaleString()} kWh</div>
                    <div className="text-[10px] text-slate-500">{formatReadableDate(kpis.peakDay.date)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Daily Average</div>
                    <div className="text-sm font-black font-mono text-purple-700">{kpis.avgDailyUnits.toLocaleString()} kWh</div>
                    <div className="text-[10px] text-slate-500">{kpis.filteredDaysCount} days active</div>
                  </div>
                </div>

                {/* Block Breakdown */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-extrabold uppercase text-slate-800 border-l-3 border-cyan-600 pl-2 mb-2">
                    Block-Wise Consumption Summary
                  </h4>
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="p-2 border border-slate-300">Block</th>
                        <th className="p-2 border border-slate-300 text-center">Meters Status</th>
                        <th className="p-2 border border-slate-300 text-right">Active kWh</th>
                        <th className="p-2 border border-slate-300 text-right">Cost ({tariff.currencySymbol})</th>
                        <th className="p-2 border border-slate-300 text-center">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockDailyStats.map((b) => (
                        <tr key={b.block.id}>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">{b.block.name} ({b.block.code})</td>
                          <td className="p-2 border border-slate-300 text-center text-slate-600">{b.loggedMetersCount} / {b.totalMeters} Logged</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">{b.units.toLocaleString()}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-amber-700">{b.cost.toLocaleString()}</td>
                          <td className="p-2 border border-slate-300 text-center font-semibold text-cyan-700">{b.sharePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Day-by-day table sample */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-extrabold uppercase text-slate-800 border-l-3 border-cyan-600 pl-2 mb-2">
                    Day-Wise Log Matrix
                  </h4>
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="p-2 border border-slate-300">Date</th>
                        {blocks.map((b) => (
                          <th key={b.id} className="p-2 border border-slate-300 text-right">{b.code}</th>
                        ))}
                        <th className="p-2 border border-slate-300 text-right font-bold text-cyan-800">Total kWh</th>
                        <th className="p-2 border border-slate-300 text-right font-bold text-amber-800">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDayAggregates.slice(0, 10).map((d) => (
                        <tr key={d.date}>
                          <td className="p-2 border border-slate-300 font-mono font-semibold">{d.date} ({d.dayName})</td>
                          {blocks.map((b) => (
                            <td key={b.id} className="p-2 border border-slate-300 text-right font-mono">
                              {(d.blockUnits[b.id] || 0).toLocaleString()}
                            </td>
                          ))}
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-cyan-800">{d.totalUnits.toLocaleString()}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-amber-800">{d.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="border-t border-dashed border-slate-400 pt-4 mt-6 flex justify-between items-end">
                  <div className="text-center w-36">
                    <div className="border-b border-slate-800 mb-1 h-6"></div>
                    <div className="font-bold text-[11px] text-slate-900">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500">Operator / {currentUser.role}</div>
                  </div>
                  <div className="text-center w-36">
                    <div className="border-b border-slate-800 mb-1 h-6"></div>
                    <div className="font-bold text-[11px] text-slate-900">Electrical In-Charge</div>
                    <div className="text-[10px] text-slate-500">Substation Division</div>
                  </div>
                  <div className="text-center w-36">
                    <div className="border-b border-slate-800 mb-1 h-6"></div>
                    <div className="font-bold text-[11px] text-slate-900">Chief Engineer</div>
                    <div className="text-[10px] text-slate-500">Facility Director</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${
              isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Close
              </button>

              <button
                onClick={handleDirectPrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
