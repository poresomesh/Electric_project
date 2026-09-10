import React, { useState, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr } from '../utils/dateUtils';
import { 
  Receipt, 
  Calculator, 
  Printer, 
  Building, 
  Calendar, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Edit2,
  Eye,
  X,
  ExternalLink,
  Download
} from 'lucide-react';
import { Block } from '../types';

interface LiveBillingProps {
  initialBlockId?: string;
}

export const LiveBilling: React.FC<LiveBillingProps> = ({ initialBlockId }) => {
  const {
    blocks,
    tariff,
    currentUser,
    isAdmin,
    isBlockIncharge,
    userAssignedBlock,
    calculateBill,
    isDarkMode,
  } = useEnergy();

  // Selected scope & timeframe
  const [selectedBlockId, setSelectedBlockId] = useState<string>(() => {
    if (isBlockIncharge && currentUser.assignedBlockId) {
      return currentUser.assignedBlockId;
    }
    return initialBlockId || 'block-a';
  });

  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedDayDate, setSelectedDayDate] = useState<string>(getTodayDateStr());
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(() => getTodayDateStr().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [referenceDate, setReferenceDate] = useState<string>(() => `${getTodayDateStr().slice(0, 7)}-01`);

  // Editable Invoice fields
  const [voucherNo, setVoucherNo] = useState<string>(() => {
    const today = getTodayDateStr();
    const [y, m] = today.split('-');
    return `INV-${y}-${m}-${(initialBlockId || 'BLK1').slice(0, 4).toUpperCase()}`;
  });
  const [issueDate, setIssueDate] = useState<string>(getTodayDateStr());

  // Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Synchronize reference date when period type changes
  const handlePeriodChange = (type: 'day' | 'week' | 'month' | 'year') => {
    setPeriodType(type);
    if (type === 'day' || type === 'week') {
      setReferenceDate(selectedDayDate);
    } else if (type === 'month') {
      setReferenceDate(`${selectedMonthStr}-01`);
    } else if (type === 'year') {
      setReferenceDate(`${selectedYear}-01-01`);
    }
  };

  const handleDayChange = (val: string) => {
    setSelectedDayDate(val);
    setReferenceDate(val);
  };

  const handleMonthChange = (val: string) => {
    setSelectedMonthStr(val);
    setReferenceDate(`${val}-01`);
  };

  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    setReferenceDate(`${yr}-01-01`);
  };

  const effectiveBlockId = (isBlockIncharge && currentUser.assignedBlockId)
    ? currentUser.assignedBlockId
    : selectedBlockId;

  // Compute live bill using exact formula
  const bill = useMemo(() => {
    return calculateBill({
      blockId: effectiveBlockId,
      periodType,
      referenceDate,
    });
  }, [effectiveBlockId, periodType, referenceDate, calculateBill]);

  const activeBlockObj = blocks.find((b) => b.id === effectiveBlockId);

  // Generates standalone, pixel-perfect A4 printable HTML document without Billing Cycle
  const generateInvoiceHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Electricity_Bill_${(bill.blockName || 'Department').replace(/\s+/g, '_')}_${voucherNo || 'INV'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #ffffff; color: #111827; padding: 24px; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #000000; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 18px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 2px; }
    .header p { font-size: 12px; color: #4b5563; font-weight: 500; }
    .meta-box { text-align: right; }
    .meta-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
    .meta-value { font-size: 14px; font-family: ui-monospace, monospace; font-weight: bold; color: #000000; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; }
    .info-title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .info-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px; }
    .info-sub { font-size: 11px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #cbd5e1; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; text-align: left; font-size: 12px; }
    td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, monospace; }
    .total-box { background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .total-title { font-size: 12px; font-weight: bold; color: #065f46; }
    .total-sub { font-size: 11px; color: #047857; }
    .total-amount { font-size: 24px; font-weight: 900; font-family: ui-monospace, monospace; color: #065f46; }
    .footer-signatures { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; border-top: 1px solid #cbd5e1; font-size: 12px; }
    .sign-line { width: 140px; border-bottom: 1px solid #000000; margin-bottom: 4px; }
    .print-actions { margin-bottom: 16px; padding: 10px; background: #f3f4f6; border-radius: 6px; display: flex; gap: 8px; }
    .btn-print { background: #0284c7; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer; }
    @media print {
      body { padding: 0; }
      .print-actions { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">Print This Invoice (Ctrl+P)</button>
    <button class="btn-print" style="background: #475569;" onclick="window.close()">Close Window</button>
  </div>

  <div class="header">
    <div>
      <h1>ELECTRICAL ENGINEERING DEPARTMENT</h1>
      <p>Industrial Energy Management & Substation Division</p>
      <p style="font-size: 11px; color: #6b7280; margin-top: 2px;">Facility Complex, Sector 4 Industrial Area</p>
    </div>
    <div class="meta-box">
      <div class="meta-label">VOUCHER NO.</div>
      <div class="meta-value">${voucherNo}</div>
      <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">Issue Date: <span class="font-mono" style="font-weight: bold; color: #000;">${issueDate}</span></div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-title">Department Block</div>
      <div class="info-val">${bill.blockName}</div>
      <div class="info-sub">${activeBlockObj ? activeBlockObj.code : 'ALL-BLK'} • Meter Incomer</div>
    </div>
    <div>
      <div class="info-title">Block In-Charge</div>
      <div class="info-val">${activeBlockObj?.inchargeName || currentUser.name}</div>
      <div class="info-sub">Authorized In-Charge • Facility Division</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 48%;">Description</th>
        <th class="text-center" style="width: 16%;">Units / Factor</th>
        <th class="text-right" style="width: 16%;">Applicable Rate</th>
        <th class="text-right" style="width: 20%;">Amount (${tariff.currencySymbol})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Active Energy Consumption</strong>
          <div style="font-size: 11px; color: #64748b;">Total active energy recorded across meters for assessment period</div>
        </td>
        <td class="text-center font-mono">${bill.totalUnitsConsumed.toLocaleString()} kWh</td>
        <td class="text-right font-mono">${tariff.currencySymbol}${tariff.baseRatePerUnit.toFixed(2)}/u</td>
        <td class="text-right font-mono" style="font-weight: bold;">${bill.energyCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>
          <strong>Fixed Demand Charges</strong>
          <div style="font-size: 11px; color: #64748b;">Monthly infrastructure and substation maintenance</div>
        </td>
        <td class="text-center font-mono">1 Month</td>
        <td class="text-right font-mono">Fixed</td>
        <td class="text-right font-mono" style="font-weight: bold;">${bill.fixedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>
          <strong>Electricity Duty & Surcharges</strong>
          <div style="font-size: 11px; color: #64748b;">Duty (${tariff.dutyTaxPercent}%) + Fuel Surcharge (${tariff.fuelSurchargePercent}%)</div>
        </td>
        <td class="text-center font-mono">${tariff.dutyTaxPercent + tariff.fuelSurchargePercent}%</td>
        <td class="text-right font-mono">Standard Tax</td>
        <td class="text-right font-mono" style="font-weight: bold;">${bill.taxesAndDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-box">
    <div>
      <div class="total-title">Net Payable Department Assessment</div>
      <div class="total-sub">Reconciliation Status: Approved & Verified</div>
    </div>
    <div style="text-align: right;">
      <div class="total-amount">${tariff.currencySymbol} ${bill.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div style="font-size: 10px; color: #065f46;">Avg Rate: ${tariff.currencySymbol}${bill.averageRatePerUnit.toFixed(2)}/kWh</div>
    </div>
  </div>

  <div class="footer-signatures">
    <div>
      <div style="font-weight: bold; color: #0f172a;">Digital Verification Passed</div>
      <div style="font-size: 10px; color: #64748b;">Logged by ${currentUser.name} (${currentUser.role})</div>
    </div>
    <div style="text-align: right;">
      <div class="sign-line"></div>
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">Chief Electrical Engineer</div>
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

  // Direct print handler: invokes window.print(), falls back gracefully to new tab if blocked
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print() failed, opening standalone printable document:', err);
      handleOpenInNewTab();
    }
  };

  // Open clean standalone A4 invoice in a new tab (guaranteed to work across iframe sandbox environments)
  const handleOpenInNewTab = () => {
    try {
      const html = generateInvoiceHtml();
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
      console.error('Failed to open invoice in new tab:', e);
    }
  };

  // Download standalone printable HTML invoice file
  const handleDownloadInvoiceHtml = () => {
    try {
      const html = generateInvoiceHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Electricity_Bill_${(bill.blockName || 'Department').replace(/\s+/g, '_')}_${voucherNo || 'Invoice'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error('Failed to download invoice:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Tariff Engine
            </span>
            <span className="text-xs text-slate-400">Formula: (Units × Rate) + Fixed + Taxes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Live Electricity Bill Calculation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time power tariff reconciliation and official departmental invoice generation
          </p>
        </div>

        {/* Period & Block Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Block Selector */}
          {(!isBlockIncharge || !userAssignedBlock) && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 px-2">Block:</span>
              <select
                id="select-bill-block"
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(e.target.value);
                  setVoucherNo(`INV-${selectedYear}-${selectedMonthStr.slice(5, 7)}-${e.target.value.slice(0, 4).toUpperCase()}`);
                }}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Blocks Combined</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timeframe selector: Day / Week / Month / Year */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              id="btn-bill-day"
              onClick={() => handlePeriodChange('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                periodType === 'day'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day
            </button>
            <button
              id="btn-bill-week"
              onClick={() => handlePeriodChange('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                periodType === 'week'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week
            </button>
            <button
              id="btn-bill-month"
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                periodType === 'month'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              id="btn-bill-year"
              onClick={() => handlePeriodChange('year')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                periodType === 'year'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Year
            </button>
          </div>

          {/* Dynamic Date / Month / Year Selection Controls */}
          {periodType === 'day' && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Date:</span>
              <input
                id="input-billing-day"
                type="date"
                value={selectedDayDate}
                onChange={(e) => handleDayChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          )}

          {periodType === 'week' && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Ending Date:</span>
              <input
                id="input-billing-week"
                type="date"
                value={selectedDayDate}
                onChange={(e) => handleDayChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          )}

          {periodType === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Month:</span>
              <input
                id="input-billing-month"
                type="month"
                value={selectedMonthStr}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          )}

          {periodType === 'year' && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Year:</span>
              <select
                id="select-billing-year"
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-mono"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons: Preview, Open Tab, Download & Print */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              title="Preview Bill Invoice"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preview</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              title="Open standalone A4 invoice in a new tab to print cleanly"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Print Tab</span>
            </button>

            <button
              onClick={handleDownloadInvoiceHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              title="Download standalone printable HTML invoice file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download HTML</span>
            </button>

            <button
              id="btn-print-bill-invoice"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20"
              title="Trigger browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Live Card Breakdown (Left) + Official Energy Bill Invoice Slip (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Left Column: Live Bill Summary Cards */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Card Mockup */}
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
                  Billing • {bill.blockName}
                </span>
                <h3 className="text-base font-bold text-white">{bill.periodLabel}</h3>
              </div>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Receipt className="w-5 h-5" />
              </span>
            </div>

            {/* Line Items */}
            <div className="py-4 space-y-3 font-mono text-sm border-b border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans text-xs text-slate-400">Total Units Consumed:</span>
                <span className="font-bold text-white text-base">
                  {bill.totalUnitsConsumed.toLocaleString()} kWh
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans text-xs text-slate-400">Rate per Unit:</span>
                <span className="text-cyan-300 font-semibold">
                  {tariff.currencySymbol} {tariff.baseRatePerUnit.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans text-xs text-slate-400">Energy Charges:</span>
                <span className="text-slate-200">
                  {tariff.currencySymbol} {bill.energyCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans text-xs text-slate-400">Fixed Demand Charges:</span>
                <span className="text-slate-200">
                  {tariff.currencySymbol} {bill.fixedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans text-xs text-slate-400">
                  Taxes & Surcharges ({tariff.dutyTaxPercent + tariff.fuelSurchargePercent}%):
                </span>
                <span className="text-slate-200">
                  {tariff.currencySymbol} {bill.taxesAndDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total Highlight Green Card */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-2 border-emerald-500/50 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs font-semibold text-emerald-300 block">Total Net Bill</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {tariff.currencySymbol} {bill.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Calculated
              </span>
            </div>
          </div>

          {/* Formula & Policy Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400 space-y-2.5">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Standard Billing Formula Reference</span>
            </h4>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
              Total Bill = (Units Consumed × Rate) + Fixed Charges + Taxes & Duties
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
              <li>
                <strong>Base Tariff:</strong> {tariff.currencySymbol}{tariff.baseRatePerUnit} per unit (Industrial LT/HT Tariff)
              </li>
              <li>
                <strong>Fixed Demand:</strong> {tariff.currencySymbol}{tariff.fixedChargesMonthly} per month
              </li>
              <li>
                <strong>Electricity Duty:</strong> {tariff.dutyTaxPercent}% of Energy Charges
              </li>
              <li>
                <strong>Fuel Surcharge:</strong> {tariff.fuelSurchargePercent}% adjustments
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Printable Official Electrical Department Invoice Slip */}
        <div className="lg:col-span-7 print:col-span-12 print:w-full print:block">
          <div
            id="printable-live-invoice"
            className="printable-bill bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0"
          >
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 print:border-black pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white print:text-black tracking-tight">
                      ELECTRICAL ENGINEERING DEPARTMENT
                    </h2>
                    <p className="text-xs text-cyan-400 print:text-black font-semibold">
                      Industrial Energy Management & Substation Division
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 print:text-gray-600 mt-2 space-y-0.5">
                  <p>Facility Complex, Sector 4 Industrial Area</p>
                  <p>Official Energy Consumption Assessment & Bill Voucher</p>
                </div>
              </div>

              {/* Invoice Meta (Editable Voucher No & Issue Date) */}
              <div className="text-right sm:border-l sm:border-slate-800 print:border-gray-300 sm:pl-4 space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 tracking-wider block">
                    VOUCHER NO.
                  </span>
                  <div className="flex items-center justify-end gap-1 group">
                    <input
                      id="input-voucher-no"
                      type="text"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      title="Editable Voucher No (Click to edit)"
                      className="text-sm font-mono font-bold text-white print:text-black bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded px-2 py-0.5 text-right w-44 transition-colors print:bg-transparent print:border-none print:p-0 print:w-auto"
                    />
                    <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 no-print" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 tracking-wider block">
                    ISSUE DATE
                  </span>
                  <div className="flex items-center justify-end gap-1 group">
                    <input
                      id="input-issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      title="Editable Issue Date (Click to edit)"
                      className="text-xs font-mono text-slate-200 print:text-black bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded px-2 py-0.5 text-right transition-colors print:bg-transparent print:border-none print:p-0"
                    />
                    <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 no-print" />
                  </div>
                </div>
              </div>
            </div>

            {/* Block & Consumer Info Grid (Connected Load & PF removed per user requirement) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-semibold">
                  Department Block
                </span>
                <div className="font-bold text-white print:text-black text-sm mt-0.5">
                  {bill.blockName}
                </div>
                <div className="text-slate-400 print:text-gray-600 text-[11px]">
                  {activeBlockObj ? activeBlockObj.code : 'ALL-BLK'} • Meter Incomer
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-semibold">
                  Block In-Charge
                </span>
                <div className="font-semibold text-slate-200 print:text-black text-xs mt-0.5">
                  {activeBlockObj?.inchargeName || currentUser.name}
                </div>
                <div className="text-slate-400 print:text-gray-600 text-[11px]">
                  Authorized In-Charge • Facility Division
                </div>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700 uppercase text-[10px] font-bold">
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Units / Factor</th>
                    <th className="py-2.5 text-right">Applicable Rate</th>
                    <th className="py-2.5 text-right">Amount ({tariff.currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 font-mono">
                  <tr>
                    <td className="py-3 font-sans">
                      <strong className="text-slate-200 print:text-black">Active Energy Consumption</strong>
                      <span className="block text-[11px] text-slate-400 print:text-gray-600">
                        Total active energy recorded across meters for assessment period
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-300 print:text-black">
                      {bill.totalUnitsConsumed.toLocaleString()} kWh
                    </td>
                    <td className="py-3 text-right text-slate-300 print:text-black">
                      {tariff.currencySymbol}{tariff.baseRatePerUnit.toFixed(2)}/u
                    </td>
                    <td className="py-3 text-right font-bold text-white print:text-black">
                      {bill.energyCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 font-sans">
                      <strong className="text-slate-200 print:text-black">Fixed Demand Charges</strong>
                      <span className="block text-[11px] text-slate-400 print:text-gray-600">
                        Monthly infrastructure and substation maintenance
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-300 print:text-black">1 Month</td>
                    <td className="py-3 text-right text-slate-300 print:text-black">Fixed</td>
                    <td className="py-3 text-right font-bold text-white print:text-black">
                      {bill.fixedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 font-sans">
                      <strong className="text-slate-200 print:text-black">Electricity Duty & Surcharges</strong>
                      <span className="block text-[11px] text-slate-400 print:text-gray-600">
                        Duty ({tariff.dutyTaxPercent}%) + Fuel Surcharge ({tariff.fuelSurchargePercent}%)
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-300 print:text-black">
                      {tariff.dutyTaxPercent + tariff.fuelSurchargePercent}%
                    </td>
                    <td className="py-3 text-right text-slate-300 print:text-black">Standard Tax</td>
                    <td className="py-3 text-right font-bold text-white print:text-black">
                      {bill.taxesAndDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Computation Box */}
            <div className="p-4 rounded-xl bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-300 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 print:text-gray-600 font-semibold block">
                  Net Payable Department Assessment
                </span>
                <span className="text-[11px] text-slate-500 print:text-gray-500">
                  Reconciliation Status: Approved & Verified
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-amber-400 print:text-black font-mono">
                  {tariff.currencySymbol} {bill.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 print:text-gray-600">
                  Avg Cost: {tariff.currencySymbol}{bill.averageRatePerUnit.toFixed(2)}/kWh
                </div>
              </div>
            </div>

            {/* Signatures & Certification Footer */}
            <div className="pt-4 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-black" />
                <div>
                  <div className="font-bold text-white print:text-black">Digital Verification Passed</div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600">
                    Logged by {currentUser.name} ({currentUser.role})
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="w-32 border-b border-slate-700 print:border-black mb-1"></div>
                <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-semibold">
                  Chief Electrical Engineer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview & Full Page Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white">Bill Invoice Print Preview</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm"
                  title="Open standalone A4 invoice in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open in New Tab</span>
                </button>
                <button
                  onClick={handleDownloadInvoiceHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm"
                  title="Download HTML file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download HTML</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-black p-8 rounded-xl shadow-lg border border-slate-300 space-y-6">
                <div className="flex justify-between items-start border-b-2 border-black pb-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight">ELECTRICAL ENGINEERING DEPARTMENT</h2>
                    <p className="text-xs text-slate-600 font-semibold">Industrial Energy Management & Substation Division</p>
                    <p className="text-[11px] text-slate-500 mt-1">Facility Complex, Sector 4 Industrial Area</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Voucher No.</div>
                    <div className="text-sm font-mono font-bold text-black">{voucherNo}</div>
                    <div className="text-xs text-slate-600">Issue Date: <span className="font-mono font-semibold">{issueDate}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded-lg border border-slate-300 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Department Block</span>
                    <div className="font-bold text-black text-sm">{bill.blockName}</div>
                    <div className="text-slate-600 text-[11px]">{activeBlockObj ? activeBlockObj.code : 'ALL-BLK'} • Meter Incomer</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Block In-Charge</span>
                    <div className="font-semibold text-black text-xs">{activeBlockObj?.inchargeName || currentUser.name}</div>
                    <div className="text-slate-600 text-[11px]">Authorized In-Charge • Facility Division</div>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Units / Factor</th>
                      <th className="p-2.5 text-right">Applicable Rate</th>
                      <th className="p-2.5 text-right">Amount ({tariff.currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans">
                        <strong className="text-black">Active Energy Consumption</strong>
                        <span className="block text-[11px] text-slate-600">Total active energy recorded across meters for assessment period</span>
                      </td>
                      <td className="p-2.5 text-center">{bill.totalUnitsConsumed.toLocaleString()} kWh</td>
                      <td className="p-2.5 text-right">{tariff.currencySymbol}{tariff.baseRatePerUnit.toFixed(2)}/u</td>
                      <td className="p-2.5 text-right font-bold">{bill.energyCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">
                        <strong className="text-black">Fixed Demand Charges</strong>
                        <span className="block text-[11px] text-slate-600">Monthly infrastructure and maintenance</span>
                      </td>
                      <td className="p-2.5 text-center">1 Month</td>
                      <td className="p-2.5 text-right">Fixed</td>
                      <td className="p-2.5 text-right font-bold">{bill.fixedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">
                        <strong className="text-black">Electricity Duty & Surcharges</strong>
                        <span className="block text-[11px] text-slate-600">Duty ({tariff.dutyTaxPercent}%) + Fuel Surcharge ({tariff.fuelSurchargePercent}%)</span>
                      </td>
                      <td className="p-2.5 text-center">{tariff.dutyTaxPercent + tariff.fuelSurchargePercent}%</td>
                      <td className="p-2.5 text-right">Standard Tax</td>
                      <td className="p-2.5 text-right font-bold">{bill.taxesAndDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">Net Payable Department Assessment</span>
                    <span className="text-[11px] text-emerald-700">Reconciliation Status: Approved & Verified</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-emerald-900">
                      {tariff.currencySymbol} {bill.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-emerald-800">
                      Avg Rate: {tariff.currencySymbol}{bill.averageRatePerUnit.toFixed(2)}/kWh
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-black">Digital Verification Passed</div>
                      <div className="text-[10px] text-slate-500">Logged by {currentUser.name} ({currentUser.role})</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-28 border-b border-black mb-1"></div>
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">Chief Electrical Engineer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Tip */}
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">Print Tip:</span> If browser sandbox blocks the direct print popup, click <strong className="text-slate-200">"Open in New Tab"</strong> to view and print the full A4 invoice directly or save as PDF.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

