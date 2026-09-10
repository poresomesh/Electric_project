import React, { useState, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr, getCurrentMonthStr, formatMonthYear } from '../utils/dateUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  PieChart as PieIcon, 
  DollarSign, 
  Zap, 
  Building, 
  Calendar,
  Sparkles,
  AlertCircle,
  Edit3,
  Check,
  X,
  Sliders,
  Calculator
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const BillComparison: React.FC = () => {
  const {
    blocks,
    tariff,
    isDarkMode,
    getBillComparison,
    calculateBill,
    updateTariff,
  } = useEnergy();

  const gridStroke = isDarkMode ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDarkMode ? '#64748b' : '#94a3b8';

  // Modal / Form state for Editing Effective Cost & Tariff
  const [isEditingTariff, setIsEditingTariff] = useState(false);
  const [editBaseRate, setEditBaseRate] = useState<number>(tariff.baseRatePerUnit);
  const [editDutyPercent, setEditDutyPercent] = useState<number>(tariff.dutyTaxPercent);
  const [editFuelSurcharge, setEditFuelSurcharge] = useState<number>(tariff.fuelSurchargePercent);
  const [editFixedCharges, setEditFixedCharges] = useState<number>(tariff.fixedChargesMonthly);
  const [editCurrencySymbol, setEditCurrencySymbol] = useState<string>(tariff.currencySymbol);
  const [editEffectiveTarget, setEditEffectiveTarget] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const comparisonData = useMemo(() => {
    return getBillComparison();
  }, [getBillComparison]);

  const { monthlyList, currentMonthVsPrevMonth, currentMonthVsPrevYear } = comparisonData;

  // Dynamic Effective Rate Calculation
  const computedEffectiveRate = useMemo(() => {
    const taxMultiplier = 1 + (tariff.dutyTaxPercent + tariff.fuelSurchargePercent) / 100;
    return +(tariff.baseRatePerUnit * taxMultiplier).toFixed(2);
  }, [tariff]);

  // Block-wise cost breakdown for Current Month
  const blockDistribution = useMemo(() => {
    const todayStr = getTodayDateStr();
    const data = blocks.map((b) => {
      const bBill = calculateBill({ blockId: b.id, periodType: 'month', referenceDate: todayStr });
      return {
        name: b.name,
        code: b.code,
        units: bBill.totalUnitsConsumed,
        bill: bBill.totalBill,
        color: b.color,
      };
    });

    const totalAllBills = data.reduce((sum, d) => sum + d.bill, 0);

    return data.map((d) => ({
      ...d,
      percent: totalAllBills > 0 ? +((d.bill / totalAllBills) * 100).toFixed(1) : 0,
    }));
  }, [blocks, calculateBill]);

  const handleOpenEdit = () => {
    setEditBaseRate(tariff.baseRatePerUnit);
    setEditDutyPercent(tariff.dutyTaxPercent);
    setEditFuelSurcharge(tariff.fuelSurchargePercent);
    setEditFixedCharges(tariff.fixedChargesMonthly);
    setEditCurrencySymbol(tariff.currencySymbol);
    setEditEffectiveTarget(computedEffectiveRate.toString());
    setIsEditingTariff(true);
    setSaveSuccessMsg('');
  };

  // Handle direct target effective rate change -> back calculate base rate
  const handleEffectiveTargetChange = (valStr: string) => {
    setEditEffectiveTarget(valStr);
    const targetVal = parseFloat(valStr);
    if (!isNaN(targetVal) && targetVal > 0) {
      const taxMultiplier = 1 + (editDutyPercent + editFuelSurcharge) / 100;
      const derivedBase = +(targetVal / (taxMultiplier || 1)).toFixed(2);
      setEditBaseRate(derivedBase);
    }
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariff({
      ...tariff,
      baseRatePerUnit: editBaseRate,
      dutyTaxPercent: editDutyPercent,
      fuelSurchargePercent: editFuelSurcharge,
      fixedChargesMonthly: editFixedCharges,
      currencySymbol: editCurrencySymbol,
    });
    setSaveSuccessMsg('Effective Energy Cost & Tariff updated successfully!');
    setTimeout(() => {
      setIsEditingTariff(false);
      setSaveSuccessMsg('');
    }, 900);
  };

  // Tooltip for monthly chart
  const MonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-white border-b border-slate-800 pb-1">
            {data.month}
          </div>
          <div className="flex justify-between items-center text-slate-300 gap-4">
            <span>Electricity Bill:</span>
            <span className="font-mono font-bold text-amber-400">
              {tariff.currencySymbol} {data.bill.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 gap-4">
            <span>Energy Units:</span>
            <span className="font-mono text-cyan-300">{data.units.toLocaleString()} kWh</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const currentMonthName = formatMonthYear(getCurrentMonthStr());
  const dateRangeLabel = monthlyList.length > 0
    ? `${monthlyList[0]?.shortMonth} → ${monthlyList[monthlyList.length - 1]?.shortMonth}`
    : currentMonthName;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Financial Analysis
            </span>
            <span className="text-xs text-slate-400">Month-over-Month & Year-over-Year</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Electricity Bill Comparison & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare monthly expenditure, analyze surge drivers, and configure effective energy unit costs
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs text-slate-400">Current Assessment Month</span>
          <div className="text-base font-extrabold text-white font-mono">{currentMonthName}</div>
        </div>
      </div>

      {/* Primary KPI Comparison Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: MoM Comparison */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">
              {currentMonthVsPrevMonth.currentLabel} vs {currentMonthVsPrevMonth.prevLabel}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Month-over-Month
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Variance (Cost Diff)</span>
              <div className={`text-2xl font-black font-mono tracking-tight flex items-center gap-1 mt-0.5 ${
                currentMonthVsPrevMonth.diffAmount > 0 
                  ? 'text-rose-400' 
                  : currentMonthVsPrevMonth.diffAmount < 0 
                  ? 'text-emerald-400' 
                  : 'text-slate-300'
              }`}>
                {currentMonthVsPrevMonth.diffAmount > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-rose-400" />
                ) : currentMonthVsPrevMonth.diffAmount < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                ) : null}
                <span>
                  {currentMonthVsPrevMonth.diffAmount >= 0 ? '+ ' : '- '}
                  {tariff.currencySymbol}{Math.abs(currentMonthVsPrevMonth.diffAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Percentage</span>
              <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm mt-0.5 ${
                currentMonthVsPrevMonth.diffPercent > 0 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                  : currentMonthVsPrevMonth.diffPercent < 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {currentMonthVsPrevMonth.diffPercent > 0 ? '+' : ''}{currentMonthVsPrevMonth.diffPercent}%
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2.5 border-t border-slate-800/80 flex justify-between">
            <span>Current: <strong className="text-white font-mono">{tariff.currencySymbol}{currentMonthVsPrevMonth.currentBill.toLocaleString()}</strong></span>
            <span>Previous: <strong className="text-slate-300 font-mono">{tariff.currencySymbol}{currentMonthVsPrevMonth.prevBill.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 2: YoY Comparison */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">
              {currentMonthVsPrevYear.currentLabel} vs {currentMonthVsPrevYear.prevYearLabel}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Year-over-Year
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Annual Variance</span>
              <div className={`text-2xl font-black font-mono tracking-tight flex items-center gap-1 mt-0.5 ${
                currentMonthVsPrevYear.diffAmount > 0 
                  ? 'text-amber-400' 
                  : currentMonthVsPrevYear.diffAmount < 0 
                  ? 'text-emerald-400' 
                  : 'text-slate-300'
              }`}>
                {currentMonthVsPrevYear.diffAmount > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                ) : currentMonthVsPrevYear.diffAmount < 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                ) : null}
                <span>
                  {currentMonthVsPrevYear.diffAmount >= 0 ? '+ ' : '- '}
                  {tariff.currencySymbol}{Math.abs(currentMonthVsPrevYear.diffAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Percentage</span>
              <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm mt-0.5 ${
                currentMonthVsPrevYear.diffPercent > 0 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                  : currentMonthVsPrevYear.diffPercent < 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {currentMonthVsPrevYear.diffPercent > 0 ? '+' : ''}{currentMonthVsPrevYear.diffPercent}%
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2.5 border-t border-slate-800/80 flex justify-between">
            <span>Current: <strong className="text-white font-mono">{tariff.currencySymbol}{currentMonthVsPrevYear.currentBill.toLocaleString()}</strong></span>
            <span>Last Year: <strong className="text-slate-300 font-mono">{tariff.currencySymbol}{currentMonthVsPrevYear.prevYearBill.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 3: Editable Effective Energy Cost */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors p-5 rounded-2xl sm:col-span-2 lg:col-span-1 relative group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">Effective Unit Energy Cost</span>
            <button
              id="btn-edit-effective-cost"
              onClick={handleOpenEdit}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
              title="Edit Effective Energy Cost & Tariff parameters"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Cost</span>
            </button>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-300 font-mono flex items-baseline gap-1.5">
              <span>{tariff.currencySymbol} {computedEffectiveRate.toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-400">/ kWh</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Base tariff ({tariff.currencySymbol}{tariff.baseRatePerUnit.toFixed(2)}) + {tariff.dutyTaxPercent}% duty & {tariff.fuelSurchargePercent}% surcharge
            </p>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2.5 border-t border-slate-800/80 flex justify-between items-center">
            <span>Base: <strong className="text-white font-mono">{tariff.currencySymbol}{tariff.baseRatePerUnit.toFixed(2)}</strong></span>
            <span>Total Taxes: <strong className="text-cyan-400 font-mono">{(tariff.dutyTaxPercent + tariff.fuelSurchargePercent).toFixed(1)}%</strong></span>
            <button
              onClick={handleOpenEdit}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer ml-1"
            >
              Adjust
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Dialog for Editing Effective Cost & Tariff */}
      {isEditingTariff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Effective Energy Cost</h3>
                  <p className="text-xs text-slate-400">Adjust tariff rate, government taxes & demand charges</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingTariff(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">{saveSuccessMsg}</h4>
                <p className="text-xs text-slate-400">All bill comparisons and live computations are now using your updated tariff.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTariff} className="p-6 space-y-4">
                {/* Direct Effective Rate Quick Setter */}
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Target Effective Cost ({editCurrencySymbol}/kWh)
                    </label>
                    <span className="text-[10px] text-cyan-400/80">Auto-derives base tariff</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-cyan-400 font-bold text-xs font-mono">{editCurrencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={editEffectiveTarget}
                      onChange={(e) => handleEffectiveTargetChange(e.target.value)}
                      placeholder="e.g. 8.75"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Granular Breakdown Fields */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Base Energy Rate ({editCurrencySymbol}/kWh)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editBaseRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditBaseRate(val);
                        const taxMult = 1 + (editDutyPercent + editFuelSurcharge) / 100;
                        setEditEffectiveTarget((val * taxMult).toFixed(2));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Fixed Demand Charges ({editCurrencySymbol}/mo)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editFixedCharges}
                      onChange={(e) => setEditFixedCharges(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Electricity Duty (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editDutyPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditDutyPercent(val);
                        const taxMult = 1 + (val + editFuelSurcharge) / 100;
                        setEditEffectiveTarget((editBaseRate * taxMult).toFixed(2));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Fuel Surcharge (FSA %)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editFuelSurcharge}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditFuelSurcharge(val);
                        const taxMult = 1 + (editDutyPercent + val) / 100;
                        setEditEffectiveTarget((editBaseRate * taxMult).toFixed(2));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Calculated Effective Rate:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {editCurrencySymbol} {(editBaseRate * (1 + (editDutyPercent + editFuelSurcharge) / 100)).toFixed(2)} / kWh
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingTariff(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    Save Tariff & Effective Cost
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Monthly Bill Comparison Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Monthly Bill Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Monthly Bill Comparison ({tariff.currencySymbol})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Expenditure trajectory across assessment months
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800/60">
              {dateRangeLabel}
            </span>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyList} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="shortMonth" stroke={axisStroke} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Bar dataKey="bill" name="Bill Amount" radius={[6, 6, 0, 0]}>
                  {monthlyList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === monthlyList.length - 1 ? '#06b6d4' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dynamic Monthly Pills Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            {monthlyList.map((m, idx) => (
              <span key={m.shortMonth} className={idx === monthlyList.length - 1 ? 'text-cyan-400 font-bold' : ''}>
                {m.shortMonth}: {tariff.currencySymbol}{m.bill.toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {/* Block-wise Cost Share Distribution (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>{currentMonthName} Cost Share</span>
            </h2>
            <p className="text-xs text-slate-400">
              Department expenditure split by Block
            </p>
          </div>

          {/* Block Breakdown Progress Bars */}
          <div className="space-y-3 pt-1">
            {blockDistribution.map((b) => (
              <div key={b.name} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }}></span>
                    <span className="font-bold text-white">{b.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({b.code})</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    {tariff.currencySymbol} {b.bill.toLocaleString()}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${b.percent}%`, backgroundColor: b.color }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{b.units.toLocaleString()} kWh consumed</span>
                  <span className="font-mono font-semibold text-slate-300">{b.percent}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
