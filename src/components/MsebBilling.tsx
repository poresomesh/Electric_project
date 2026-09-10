import React, { useState, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { MsebBlock, MsebReading, MsebTariffConfig, MsebCustomCharge } from '../types';
import { getTodayDateStr, getCurrentMonthStr, formatMonthYear } from '../utils/dateUtils';
import {
  Zap,
  Building,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileText,
  TrendingUp,
  Receipt,
  Printer,
  Download,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  Edit2
} from 'lucide-react';

export const MsebBilling: React.FC = () => {
  const {
    msebBlocks,
    msebReadings,
    getMsebTariff,
    updateMsebBlock,
    addMsebReading,
    deleteMsebReading,
    clearAllMsebReadings,
    updateMsebTariffForBlock,
    addMsebCustomCharge,
    deleteMsebCustomCharge,
    calculateMsebBillBreakdown,
    isDarkMode,
  } = useEnergy();

  // Selected MSEB Meter / Incomer (STRICTLY INDEPENDENT - NO ADDITION)
  const [selectedBlockId, setSelectedBlockId] = useState<string>(msebBlocks[0]?.id || 'mseb-block-1');

  // Sub-tab view: 'day' | 'month' | 'year' | 'tariff'
  const [activeSubTab, setActiveSubTab] = useState<'day' | 'month' | 'year' | 'tariff'>('month');

  // Active Block details & Tariff
  const activeBlock = useMemo(() => {
    return msebBlocks.find((b) => b.id === selectedBlockId) || msebBlocks[0];
  }, [msebBlocks, selectedBlockId]);

  const activeTariff = useMemo(() => {
    return getMsebTariff(selectedBlockId);
  }, [getMsebTariff, selectedBlockId]);

  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditBlockModalOpen, setIsEditBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<MsebBlock | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New Reading Form State
  const [formDate, setFormDate] = useState<string>(getTodayDateStr());
  const [formTime, setFormTime] = useState<string>('08:00');
  const [formPrevKwh, setFormPrevKwh] = useState<string>('');
  const [formCurrKwh, setFormCurrKwh] = useState<string>('');
  const [formPrevKvah, setFormPrevKvah] = useState<string>('');
  const [formCurrKvah, setFormCurrKvah] = useState<string>('');
  const [formMultiplier, setFormMultiplier] = useState<string>('1');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formSuccessToast, setFormSuccessToast] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Date filters for tables
  const [selectedDayDate, setSelectedDayDate] = useState<string>(getTodayDateStr());
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(getCurrentMonthStr());
  const [selectedYearNum, setSelectedYearNum] = useState<number>(new Date().getFullYear());

  // Edit Tariff Form State (Base Parameters)
  const [isEditTariffModalOpen, setIsEditTariffModalOpen] = useState(false);
  const [editBaseRate, setEditBaseRate] = useState<number>(8.50);
  const [editDemandCharge, setEditDemandCharge] = useState<number>(450);
  const [editWheelingCharge, setEditWheelingCharge] = useState<number>(1.25);
  const [editFacPercent, setEditFacPercent] = useState<number>(3.5);
  const [editDutyPercent, setEditDutyPercent] = useState<number>(9.3);
  const [editToseTax, setEditToseTax] = useState<number>(0.15);
  const [editBillingType, setEditBillingType] = useState<'kwh' | 'kvah'>('kwh');
  const [tariffSuccessMsg, setTariffSuccessMsg] = useState<string>('');

  // Add Custom Charge Form State
  const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
  const [chargeName, setChargeName] = useState<string>('');
  const [chargeType, setChargeType] = useState<MsebCustomCharge['type']>('per_unit');
  const [chargeValue, setChargeValue] = useState<string>('');
  const [chargeDescription, setChargeDescription] = useState<string>('');
  const [chargeFormError, setChargeFormError] = useState<string>('');

  // Delete & Clear Confirmation Modals (Replaces window.confirm which is blocked in iframes)
  const [readingToDelete, setReadingToDelete] = useState<MsebReading | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearScope, setClearScope] = useState<'current' | 'all'>('current');
  const [chargeToDeleteId, setChargeToDeleteId] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string>('');

  // Editable Contract Demand State
  const [isEditingDemand, setIsEditingDemand] = useState(false);
  const [editDemandValue, setEditDemandValue] = useState<string>('');

  // Editable Effective Unit Rate State (Auto + Manual toggle)
  const [isEditingEffectiveRate, setIsEditingEffectiveRate] = useState(false);
  const [manualRateInput, setManualRateInput] = useState<string>('');
  const [editIsManualEffectiveRate, setEditIsManualEffectiveRate] = useState<boolean>(false);
  const [editManualEffectiveRate, setEditManualEffectiveRate] = useState<number>(0);

  // Strictly filter readings ONLY for the selected block/meter (No combined addition!)
  const blockReadings = useMemo(() => {
    return msebReadings.filter((r) => r.msebBlockId === selectedBlockId);
  }, [msebReadings, selectedBlockId]);

  // Day-wise readings for the selected date
  const dayWiseReadings = useMemo(() => {
    return blockReadings.filter((r) => r.readingDate === selectedDayDate);
  }, [blockReadings, selectedDayDate]);

  // Day summary KPI
  const daySummary = useMemo(() => {
    const totalKwh = dayWiseReadings.reduce((sum, r) => sum + r.unitsConsumedKwh, 0);
    const totalCost = dayWiseReadings.reduce((sum, r) => sum + r.calculatedCost, 0);
    const pfCount = dayWiseReadings.filter((r) => r.powerFactor !== undefined).length;
    const avgPf = pfCount > 0
      ? +(dayWiseReadings.reduce((sum, r) => sum + (r.powerFactor || 0.95), 0) / pfCount).toFixed(3)
      : 0.95;

    return { totalKwh, totalCost, avgPf, entriesCount: dayWiseReadings.length };
  }, [dayWiseReadings]);

  // Month-wise aggregation for this meter
  const monthData = useMemo(() => {
    const monthReadings = blockReadings.filter((r) => r.readingDate.startsWith(selectedMonthStr));
    const totalKwh = monthReadings.reduce((sum, r) => sum + r.unitsConsumedKwh, 0);
    const totalKvah = monthReadings.reduce((sum, r) => sum + (r.unitsConsumedKvah || r.unitsConsumedKwh), 0);

    const contractDemand = 0; // Contract demand removed per user requirement
    const billBreakdown = calculateMsebBillBreakdown(selectedBlockId, totalKwh, 0);

    // Day-by-day points for bar chart in month
    const daysInMonthMap: { [dateStr: string]: { date: string; day: string; kwh: number; cost: number } } = {};
    monthReadings.forEach((r) => {
      if (!daysInMonthMap[r.readingDate]) {
        daysInMonthMap[r.readingDate] = {
          date: r.readingDate,
          day: r.readingDate.split('-')[2] || '01',
          kwh: 0,
          cost: 0,
        };
      }
      daysInMonthMap[r.readingDate].kwh += r.unitsConsumedKwh;
      daysInMonthMap[r.readingDate].cost += r.calculatedCost;
    });

    const dailyChartData = Object.values(daysInMonthMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalKwh,
      totalKvah,
      billBreakdown,
      readingsCount: monthReadings.length,
      dailyChartData,
      monthReadings,
    };
  }, [blockReadings, selectedMonthStr, selectedBlockId, activeBlock, calculateMsebBillBreakdown]);

  // Year-wise aggregation for this meter (12 months: Jan - Dec)
  const yearData = useMemo(() => {
    const months = [
      { num: '01', name: 'January', short: 'Jan' },
      { num: '02', name: 'February', short: 'Feb' },
      { num: '03', name: 'March', short: 'Mar' },
      { num: '04', name: 'April', short: 'Apr' },
      { num: '05', name: 'May', short: 'May' },
      { num: '06', name: 'June', short: 'Jun' },
      { num: '07', name: 'July', short: 'Jul' },
      { num: '08', name: 'August', short: 'Aug' },
      { num: '09', name: 'September', short: 'Sep' },
      { num: '10', name: 'October', short: 'Oct' },
      { num: '11', name: 'November', short: 'Nov' },
      { num: '12', name: 'December', short: 'Dec' },
    ];

    const contractDemand = 0;
    let annualUnits = 0;
    let annualCost = 0;

    const monthlyBreakdown = months.map((m) => {
      const monthPrefix = `${selectedYearNum}-${m.num}`;
      const mReadings = blockReadings.filter((r) => r.readingDate.startsWith(monthPrefix));
      const units = mReadings.reduce((sum, r) => sum + r.unitsConsumedKwh, 0);

      let bill = 0;
      let energyCharge = 0;
      let demandCharge = 0;
      let taxes = 0;
      let customCharges = 0;

      if (units > 0) {
        const breakdown = calculateMsebBillBreakdown(selectedBlockId, units, 0);
        bill = breakdown.totalMsebBill;
        energyCharge = breakdown.energyCharges;
        demandCharge = breakdown.demandCharges;
        taxes = breakdown.wheelingCharges + breakdown.facCharges + breakdown.electricityDuty + breakdown.toseCharges;
        customCharges = breakdown.totalCustomCharges;
      }

      annualUnits += units;
      annualCost += bill;

      return {
        monthKey: monthPrefix,
        name: m.name,
        short: m.short,
        units,
        energyCharge,
        demandCharge,
        taxes,
        customCharges,
        totalBill: bill,
        readingsCount: mReadings.length,
      };
    });

    return {
      annualUnits,
      annualCost,
      monthlyBreakdown,
    };
  }, [blockReadings, selectedYearNum, selectedBlockId, activeBlock, calculateMsebBillBreakdown]);

  // Last reading for prefilling
  const lastReadingForBlock = useMemo(() => {
    return blockReadings[0] || null;
  }, [blockReadings]);

  // Open Enter Reading Modal (Manual Entry with clean empty current reading)
  const handleOpenAddModal = () => {
    setFormDate(getTodayDateStr());
    setFormTime(new Date().toTimeString().substring(0, 5));
    if (lastReadingForBlock) {
      setFormPrevKwh(lastReadingForBlock.currentReadingKwh.toString());
      setFormCurrKwh('');
      if (lastReadingForBlock.currentReadingKvah !== undefined) {
        setFormPrevKvah(lastReadingForBlock.currentReadingKvah.toString());
        setFormCurrKvah('');
      } else {
        setFormPrevKvah('');
        setFormCurrKvah('');
      }
      setFormMultiplier(lastReadingForBlock.multiplier?.toString() || '1');
    } else {
      setFormPrevKwh('');
      setFormCurrKwh('');
      setFormPrevKvah('');
      setFormCurrKvah('');
      setFormMultiplier('1');
    }
    setFormNotes('');
    setFormError('');
    setFormSuccessToast('');
    setIsAddModalOpen(true);
  };

  // Clear all readings modal trigger
  const handleClearAllReadings = () => {
    setClearScope('current');
    setIsClearAllModalOpen(true);
  };

  // Safe reading delete handler
  const handleConfirmDeleteReading = () => {
    if (!readingToDelete) return;
    deleteMsebReading(readingToDelete.id);
    setActionSuccessToast(`Reading entry for ${readingToDelete.readingDate} deleted successfully.`);
    setReadingToDelete(null);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Safe clear all readings handler
  const handleConfirmClearAllReadings = () => {
    if (clearScope === 'all') {
      clearAllMsebReadings();
      setActionSuccessToast(`All meter readings across all feeders have been cleared.`);
    } else {
      clearAllMsebReadings(selectedBlockId);
      setActionSuccessToast(`All meter readings cleared for ${activeBlock.name}.`);
    }
    setIsClearAllModalOpen(false);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Contract demand quick save
  const handleSaveContractDemand = (val?: number) => {
    const demand = val !== undefined ? val : parseFloat(editDemandValue);
    if (isNaN(demand) || demand <= 0) return;
    updateMsebBlock(selectedBlockId, { contractDemandKva: demand });
    setIsEditingDemand(false);
    setActionSuccessToast(`Contract Demand updated to ${demand} kVA for ${activeBlock.name}`);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Effective unit rate manual override save
  const handleSaveManualEffectiveRate = () => {
    const rate = parseFloat(manualRateInput);
    if (isNaN(rate) || rate <= 0) return;
    updateMsebTariffForBlock(selectedBlockId, {
      ...activeTariff,
      isManualEffectiveRate: true,
      manualEffectiveRate: rate,
    });
    setIsEditingEffectiveRate(false);
    setActionSuccessToast(`Manual Effective Unit Rate set to ₹${rate.toFixed(2)}/kWh`);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Switch Effective Unit Rate back to Auto
  const handleResetEffectiveRateToAuto = () => {
    updateMsebTariffForBlock(selectedBlockId, {
      ...activeTariff,
      isManualEffectiveRate: false,
    });
    setIsEditingEffectiveRate(false);
    setActionSuccessToast(`Effective Unit Rate restored to Automatic calculation`);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Submit New Reading
  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const prevKwh = parseFloat(formPrevKwh);
    const currKwh = parseFloat(formCurrKwh);
    const mf = parseFloat(formMultiplier) || 1;

    if (isNaN(prevKwh) || isNaN(currKwh)) {
      setFormError('Please enter valid numeric readings for kWh.');
      return;
    }

    if (currKwh < prevKwh) {
      setFormError('Current reading cannot be lower than previous reading.');
      return;
    }

    let prevKvahNum: number | undefined = undefined;
    let currKvahNum: number | undefined = undefined;
    if (formPrevKvah.trim() && formCurrKvah.trim()) {
      prevKvahNum = parseFloat(formPrevKvah);
      currKvahNum = parseFloat(formCurrKvah);
      if (isNaN(prevKvahNum) || isNaN(currKvahNum) || currKvahNum < prevKvahNum) {
        setFormError('Please enter valid kVAh readings where current >= previous.');
        return;
      }
    }

    const res = addMsebReading({
      msebBlockId: selectedBlockId,
      readingDate: formDate,
      readingTime: formTime,
      meterNumber: activeBlock.meterNumber,
      previousReadingKwh: prevKwh,
      currentReadingKwh: currKwh,
      previousReadingKvah: prevKvahNum,
      currentReadingKvah: currKvahNum,
      multiplier: mf,
      notes: formNotes.trim() || undefined,
    });

    if (res.success) {
      setFormSuccessToast(`Reading saved for ${activeBlock.name}: ${res.unitsConsumedKwh.toLocaleString()} units (₹${res.cost.toLocaleString()})`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccessToast('');
      }, 1000);
    }
  };

  // Rename Block Modal
  const handleOpenEditBlock = (block: MsebBlock) => {
    setEditingBlock({ ...block });
    setIsEditBlockModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlock) {
      updateMsebBlock(editingBlock.id, {
        name: editingBlock.name,
        code: editingBlock.code,
        consumerNumber: editingBlock.consumerNumber,
        meterNumber: editingBlock.meterNumber,
        contractDemandKva: editingBlock.contractDemandKva,
      });
      setIsEditBlockModalOpen(false);
      setEditingBlock(null);
    }
  };

  // Edit Tariff Modal
  const handleOpenEditTariff = () => {
    setEditBaseRate(activeTariff.baseRatePerUnit);
    setEditDemandCharge(activeTariff.demandChargePerKva);
    setEditWheelingCharge(activeTariff.wheelingChargePerUnit);
    setEditFacPercent(activeTariff.facPercent);
    setEditDutyPercent(activeTariff.electricityDutyPercent);
    setEditToseTax(activeTariff.toseTaxPerUnit);
    setEditBillingType(activeTariff.billingType || 'kwh');
    setEditIsManualEffectiveRate(Boolean(activeTariff.isManualEffectiveRate));
    setEditManualEffectiveRate(activeTariff.manualEffectiveRate || monthData.billBreakdown.effectiveCostPerUnit);
    setTariffSuccessMsg('');
    setIsEditTariffModalOpen(true);
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    updateMsebTariffForBlock(selectedBlockId, {
      ...activeTariff,
      baseRatePerUnit: Number(editBaseRate),
      demandChargePerKva: Number(editDemandCharge),
      wheelingChargePerUnit: Number(editWheelingCharge),
      facPercent: Number(editFacPercent),
      electricityDutyPercent: Number(editDutyPercent),
      toseTaxPerUnit: Number(editToseTax),
      billingType: editBillingType,
      isManualEffectiveRate: editIsManualEffectiveRate,
      manualEffectiveRate: editIsManualEffectiveRate ? Number(editManualEffectiveRate) : undefined,
    });
    setTariffSuccessMsg(`Tariff updated successfully for ${activeBlock.name}!`);
    setTimeout(() => {
      setIsEditTariffModalOpen(false);
      setTariffSuccessMsg('');
    }, 1000);
  };

  // Add Custom Charge
  const handleOpenAddCharge = () => {
    setChargeName('');
    setChargeType('per_unit');
    setChargeValue('');
    setChargeDescription('');
    setChargeFormError('');
    setIsAddChargeModalOpen(true);
  };

  const handleSaveCustomCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeName.trim()) {
      setChargeFormError('Please enter a charge name.');
      return;
    }
    const val = parseFloat(chargeValue);
    if (isNaN(val) || val <= 0) {
      setChargeFormError('Please enter a valid positive rate or percentage value.');
      return;
    }

    addMsebCustomCharge(selectedBlockId, {
      name: chargeName.trim(),
      type: chargeType,
      value: val,
      description: chargeDescription.trim() || undefined,
    });

    setIsAddChargeModalOpen(false);
  };

  const handleDeleteCustomCharge = (chargeId: string) => {
    setChargeToDeleteId(chargeId);
  };

  // CSV Export Utility
  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Day-Wise CSV
  const handleExportDayCsv = () => {
    const headers = [
      'Date',
      'Time',
      'Feeder / Incomer',
      'Consumer No',
      'Meter No',
      'Prev kWh',
      'Curr kWh',
      'Multiplier (MF)',
      'Units Consumed (kWh)',
      'Prev kVAh',
      'Curr kVAh',
      'Units (kVAh)',
      'Power Factor (PF)',
      'Calculated Cost (INR)',
      'Logged By',
      'Remarks',
    ];
    const rows = dayWiseReadings.map((r) => [
      r.readingDate,
      r.readingTime,
      `"${activeBlock.name}"`,
      `"${activeBlock.consumerNumber}"`,
      `"${r.meterNumber}"`,
      r.previousReadingKwh,
      r.currentReadingKwh,
      r.multiplier,
      r.unitsConsumedKwh,
      r.previousReadingKvah ?? '',
      r.currentReadingKvah ?? '',
      r.unitsConsumedKvah ?? '',
      r.powerFactor ?? 0.95,
      r.calculatedCost,
      `"${r.enteredByName}"`,
      `"${r.notes || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    downloadCsv(`MSEB_${activeBlock.code}_Day_${selectedDayDate}.csv`, csv);
  };

  // Export Month-Wise CSV
  const handleExportMonthCsv = () => {
    const headers = ['Line Item / Metric', 'Value'];
    const b = monthData.billBreakdown;
    const data: [string, string | number][] = [
      ['MSEB Feeder / Block Name', activeBlock.name],
      ['Identifier Code', activeBlock.code],
      ['Consumer Number', activeBlock.consumerNumber],
      ['Meter Serial Number', activeBlock.meterNumber],
      ['Billing Month', selectedMonthStr],
      ['Sanctioned Load (kW)', activeBlock.sanctionedLoadKw],
      ['Total Billed Units (kWh)', monthData.totalKwh],
      ['Total Units (kVAh)', monthData.totalKvah],
      ['Base Energy Charges (INR)', b.energyCharges],
      ['Wheeling Charges (INR)', b.wheelingCharges],
      ['Fuel Adjustment Charge (FAC) (INR)', b.facCharges],
      ['Electricity Duty (INR)', b.electricityDuty],
      ['Tax on Sale of Electricity (TOSE) (INR)', b.toseCharges],
    ];

    (b.customChargesBreakdown || []).forEach((cc) => {
      data.push([`${cc.name} (${cc.rateLabel}) (INR)`, cc.amount]);
    });

    data.push(
      ['Total Custom Charges (INR)', b.totalCustomCharges],
      ['NET BILL AMOUNT PAYABLE (INR)', b.totalMsebBill],
      ['Effective Rate per Unit (INR/kWh)', b.effectiveCostPerUnit]
    );

    const csv = [
      headers.join(','),
      ...data.map(([k, v]) => `"${k}","${v}"`),
      '',
      '--- DAILY READINGS LOG ---',
      ['Date', 'Time', 'Units (kWh)', 'Cost (INR)', 'Power Factor', 'Remarks'].join(','),
      ...monthData.monthReadings.map((r) =>
        [r.readingDate, r.readingTime, r.unitsConsumedKwh, r.calculatedCost, r.powerFactor ?? 0.95, `"${r.notes || ''}"`].join(',')
      ),
    ].join('\n');

    downloadCsv(`MSEB_${activeBlock.code}_Monthly_Bill_${selectedMonthStr}.csv`, csv);
  };

  // Export Year-Wise CSV
  const handleExportYearCsv = () => {
    const headers = [
      'Month',
      'Units Consumed (kWh)',
      'Energy Charges (INR)',
      'Demand Charges (INR)',
      'Taxes & Surcharges (INR)',
      'Custom Charges (INR)',
      'Total Net Bill (INR)',
      'Readings Count',
    ];
    const rows = yearData.monthlyBreakdown.map((m) => [
      m.name,
      m.units,
      m.energyCharge,
      m.demandCharge,
      m.taxes,
      m.customCharges,
      m.totalBill,
      m.readingsCount,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`MSEB_${activeBlock.code}_Annual_Schedule_${selectedYearNum}.csv`, csv);
  };

  // Trigger Print
  const handleTriggerPrint = () => {
    window.print();
  };

  // Light/Dark Theme helpers - Enhanced for high contrast in dark mode
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900';
  const tableHeaderBg = isDarkMode ? 'bg-slate-800 text-slate-100 font-bold border-slate-700' : 'bg-slate-100 text-slate-700 font-bold border-slate-200';
  const tableRowBorder = isDarkMode ? 'border-slate-800 divide-slate-800 hover:bg-slate-800/60' : 'border-slate-200 divide-slate-200 hover:bg-slate-50';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 [color-scheme:dark]' : 'bg-white border-slate-300 text-slate-900 shadow-xs [color-scheme:light]';
  const subtextColor = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const headingColor = isDarkMode ? 'text-white' : 'text-slate-900 font-bold';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Action Notification Toast */}
      {actionSuccessToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white border border-emerald-500 shadow-2xl animate-bounce">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold">{actionSuccessToast}</span>
        </div>
      )}

      {/* =========================================================================
          TOP BANNER: MSEB High Tension Incomer Feeders
          ========================================================================= */}
      <div
        className={`p-5 rounded-2xl border transition-all no-print ${
          isDarkMode
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-900/40 text-white'
            : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-indigo-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                Independent Utility Incomers
              </span>
              <span className={`text-xs ${subtextColor}`}>Separate readings & tariff per meter • No combined addition</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              MSEB Electricity Billing & Feeder Management
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${subtextColor}`}>
              Official Maharashtra State Electricity (MSEDCL) meter reconciliation, Day/Month/Year bill audit, and custom tariffs
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-mseb-clear-readings"
              onClick={handleClearAllReadings}
              title="Wipe reading entries to enter fresh manual readings"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border border-rose-500/40 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Readings ({blockReadings.length})</span>
            </button>

            <button
              id="btn-mseb-print-invoice"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            <button
              id="btn-mseb-enter-reading"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Enter MSEB Reading</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          METER SELECTOR TABS: Strictly 2 Distinct Meters (NO ADDITION)
          ========================================================================= */}
      <div className="no-print space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${subtextColor}`}>
            Select MSEB Incomer Feeder / Meter (Individual Analysis)
          </span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            Each meter has its own independent readings, tariff rates & bills
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {msebBlocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const blockTariff = getMsebTariff(block.id);
            const readingsCount = msebReadings.filter((r) => r.msebBlockId === block.id).length;

            return (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative overflow-hidden ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20 text-white'
                      : 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20 text-slate-900'
                    : isDarkMode
                    ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600 text-slate-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-extrabold text-base ${headingColor}`}>{block.name}</h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                          {block.code}
                        </span>
                      </div>
                      <p className={`text-xs ${subtextColor}`}>
                        Consumer No: <span className="font-mono font-medium text-slate-900 dark:text-white">{block.consumerNumber}</span>
                      </p>
                    </div>
                  </div>

                  {/* Rename Block Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditBlock(block);
                    }}
                    title="Rename this MSEB block or edit consumer info"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Meter Stats Strip */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 text-xs">
                  <div>
                    <span className={`text-[10px] block ${subtextColor}`}>Meter No</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white truncate block">
                      {block.meterNumber}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${subtextColor}`}>Base Tariff</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300 font-mono">
                      ₹{blockTariff.baseRatePerUnit.toFixed(2)}/u
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-cyan-400">
                    <span>Active Meter Selected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          VIEW SUB-NAVIGATION: Day-Wise | Month-Wise | Year-Wise | Tariff & Costs
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <button
            id="subtab-mseb-day"
            onClick={() => setActiveSubTab('day')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'day'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Day-Wise Readings</span>
          </button>

          <button
            id="subtab-mseb-month"
            onClick={() => setActiveSubTab('month')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'month'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Month-Wise Bill</span>
          </button>

          <button
            id="subtab-mseb-year"
            onClick={() => setActiveSubTab('year')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'year'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Year-Wise Schedule</span>
          </button>

          <button
            id="subtab-mseb-tariff"
            onClick={() => setActiveSubTab('tariff')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'tariff'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>MSEB Tariff & Charges</span>
          </button>
        </div>

        {/* View-specific Export CSV button */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'day' && (
            <button
              onClick={handleExportDayCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Day CSV</span>
            </button>
          )}

          {activeSubTab === 'month' && (
            <button
              onClick={handleExportMonthCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Month Bill CSV</span>
            </button>
          )}

          {activeSubTab === 'year' && (
            <button
              onClick={handleExportYearCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Annual CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: DAY-WISE READINGS VIEW
          ========================================================================= */}
      {activeSubTab === 'day' && (
        <div className="space-y-4">
          {/* Day Controls & KPIs */}
          <div className={`p-4 rounded-2xl border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${subtextColor}`}>Select Date:</span>
                <input
                  type="date"
                  value={selectedDayDate}
                  onChange={(e) => setSelectedDayDate(e.target.value)}
                  style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${inputBg}`}
                />
              </div>

              {/* Day KPIs for this specific meter */}
              <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className={`text-[10px] block ${subtextColor}`}>Day Units</span>
                  <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">
                    {daySummary.totalKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
                  </span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className={`text-[10px] block ${subtextColor}`}>Day Cost (Est.)</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    ₹{daySummary.totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className={`text-[10px] block ${subtextColor}`}>Avg Power Factor</span>
                  <span className="text-base font-extrabold text-blue-700 dark:text-cyan-400 font-mono">
                    {daySummary.avgPf}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Day Table */}
          <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className={`text-sm font-extrabold ${headingColor}`}>
                Meter Reading Log • {activeBlock.name} ({selectedDayDate})
              </h3>
              <span className={`text-xs ${subtextColor}`}>
                {dayWiseReadings.length} reading{dayWiseReadings.length !== 1 ? 's' : ''} on this date
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={tableHeaderBg}>
                  <tr>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-3">Meter No</th>
                    <th className="py-2.5 px-3">Prev Reading (kWh)</th>
                    <th className="py-2.5 px-3">Curr Reading (kWh)</th>
                    <th className="py-2.5 px-3">MF</th>
                    <th className="py-2.5 px-3">Consumed (kWh)</th>
                    <th className="py-2.5 px-3">PF</th>
                    <th className="py-2.5 px-3 text-right">Calculated Cost</th>
                    <th className="py-2.5 px-3">Logged By</th>
                    <th className="py-2.5 px-3 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableRowBorder}`}>
                  {dayWiseReadings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className={`text-center py-10 ${subtextColor}`}>
                        No meter readings logged for {activeBlock.name} on {selectedDayDate}.
                        <div className="mt-2">
                          <button
                            onClick={handleOpenAddModal}
                            className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                          >
                            + Log reading now
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    dayWiseReadings.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {r.readingTime}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {r.meterNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          {r.previousReadingKwh.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {r.currentReadingKwh.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {r.multiplier}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {r.unitsConsumedKwh.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {r.powerFactor ?? 0.95}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{r.calculatedCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {r.enteredByName}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <button
                            id={`btn-del-day-rd-${r.id}`}
                            onClick={() => setReadingToDelete(r)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Reading"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: MONTH-WISE BILL ASSESSMENT & BREAKDOWN
          ========================================================================= */}
      {activeSubTab === 'month' && (
        <div className="space-y-6">
          {/* Month Filter Bar */}
          <div className={`p-4 rounded-2xl border ${cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${subtextColor}`}>Billing Month:</span>
              <input
                type="month"
                value={selectedMonthStr}
                onChange={(e) => setSelectedMonthStr(e.target.value)}
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${inputBg}`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>

          {/* High-Level Month Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <span className={`text-xs font-semibold ${subtextColor} block`}>Total Billed Units</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 font-mono">
                  {monthData.totalKwh.toLocaleString()}
                </span>
                <span className={`text-xs ${subtextColor}`}>kWh</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 block font-medium">
                Logged across {monthData.readingsCount} meter shifts
              </span>
            </div>

            {/* Effective Unit Rate Card (Auto / Manual Editable) */}
            <div className={`p-4 rounded-2xl border ${cardBg} relative`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${subtextColor}`}>Effective Unit Rate</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                    activeTariff.isManualEffectiveRate
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-300 dark:border-blue-700'
                  }`}
                >
                  {activeTariff.isManualEffectiveRate ? 'Manual Rate' : 'Auto Rate'}
                </span>
              </div>

              {isEditingEffectiveRate ? (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₹</span>
                    <input
                      id="input-manual-effective-rate"
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="e.g. 11.50"
                      value={manualRateInput}
                      onChange={(e) => setManualRateInput(e.target.value)}
                      className={`w-28 px-2.5 py-1 text-sm font-mono font-bold rounded-lg border ${inputBg}`}
                      autoFocus
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">/ kWh</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      id="btn-save-manual-rate"
                      onClick={handleSaveManualEffectiveRate}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      Set Manual Rate
                    </button>
                    {activeTariff.isManualEffectiveRate && (
                      <button
                        type="button"
                        id="btn-reset-auto-rate"
                        onClick={handleResetEffectiveRateToAuto}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        title="Switch back to automatic calculation"
                      >
                        Reset to Auto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingEffectiveRate(false)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-blue-700 dark:text-cyan-300 font-mono">
                        ₹{monthData.billBreakdown.effectiveCostPerUnit}
                      </span>
                      <span className={`text-xs ${subtextColor}`}>/ kWh</span>
                    </div>
                    <button
                      id="btn-edit-effective-rate"
                      onClick={() => {
                        setManualRateInput(
                          activeTariff.manualEffectiveRate
                            ? activeTariff.manualEffectiveRate.toString()
                            : monthData.billBreakdown.effectiveCostPerUnit.toString()
                        );
                        setIsEditingEffectiveRate(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      title="Edit Effective Unit Rate manually or switch to auto"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{activeTariff.isManualEffectiveRate ? 'Edit Manual' : 'Edit Rate'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 mt-1 font-medium">
                    <span>
                      {activeTariff.isManualEffectiveRate
                        ? 'Manual rate applied'
                        : 'Auto (Base, demand, taxes & custom)'}
                    </span>
                    {activeTariff.isManualEffectiveRate && (
                      <button
                        type="button"
                        onClick={handleResetEffectiveRateToAuto}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        title="Reset to automatic calculation"
                      >
                        ⚡ Use Auto Rate
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={`p-4 rounded-2xl border-2 border-emerald-500/40 ${cardBg} relative overflow-hidden`}>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                Total Month MSEB Bill
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
                  ₹{monthData.billBreakdown.totalMsebBill.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-1 block">
                Payable to MSEDCL for {activeBlock.name}
              </span>
            </div>
          </div>

          {/* Two-column layout: Itemized Bill Assessment (Left) + Monthly Readings Entries Log (Right) - NO GRAPHS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Itemized Tariff Breakdown */}
            <div className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${cardBg}`}>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-extrabold ${headingColor}`}>
                    Itemized Bill Assessment
                  </h3>
                  <p className={`text-xs ${subtextColor}`}>
                    Maharashtra Electricity Tariff Schedule for {activeBlock.name}
                  </p>
                </div>
                <button
                  onClick={handleOpenEditTariff}
                  className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure Rates</span>
                </button>
              </div>

              {/* Assessment Line Items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    1. Base Energy Charges ({monthData.totalKwh.toLocaleString()} u × ₹{activeTariff.baseRatePerUnit.toFixed(2)})
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{monthData.billBreakdown.energyCharges.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    2. Wheeling Charges ({monthData.totalKwh.toLocaleString()} u × ₹{activeTariff.wheelingChargePerUnit.toFixed(2)})
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{monthData.billBreakdown.wheelingCharges.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    3. Fuel Adjustment Charge (FAC) ({activeTariff.facPercent}%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{monthData.billBreakdown.facCharges.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    4. Electricity Duty ({activeTariff.electricityDutyPercent}%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{monthData.billBreakdown.electricityDuty.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    5. Tax on Sale of Electricity (TOSE) (₹{activeTariff.toseTaxPerUnit.toFixed(2)}/u)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{monthData.billBreakdown.toseCharges.toLocaleString()}
                  </span>
                </div>

                {/* Custom Surcharges Section */}
                {monthData.billBreakdown.customChargesBreakdown?.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                      Custom Charges & Surcharges:
                    </span>
                    {monthData.billBreakdown.customChargesBreakdown.map((cc, idx) => (
                      <div
                        key={cc.id || idx}
                        className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/40 pl-2"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          • {cc.name} ({cc.rateLabel})
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ₹{cc.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Net Payable */}
                <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    NET AMOUNT PAYABLE
                  </span>
                  <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-300">
                    ₹{monthData.billBreakdown.totalMsebBill.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Monthly Meter Reading Entries & Shift Audit Log (NO GRAPH) */}
            <div className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${cardBg}`}>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-extrabold ${headingColor}`}>
                    Monthly Meter Readings Log
                  </h3>
                  <p className={`text-xs ${subtextColor}`}>
                    Recorded shift readings for {activeBlock.name} in {formatMonthYear(selectedMonthStr)}
                  </p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Reading</span>
                </button>
              </div>

              {monthData.monthReadings.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${headingColor}`}>No Readings for this Month</h4>
                    <p className={`text-xs mt-1 ${subtextColor} max-w-sm mx-auto`}>
                      All previous dummy entries were removed. Click below to manually record your first meter reading.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter First Reading</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`sticky top-0 z-10 ${tableHeaderBg}`}>
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-2">Time</th>
                        <th className="py-2.5 px-3 text-right">Curr (kWh)</th>
                        <th className="py-2.5 px-3 text-right">Units</th>
                        <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                        <th className="py-2.5 px-2 text-center no-print">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tableRowBorder}`}>
                      {monthData.monthReadings.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {r.readingDate}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300">
                            {r.readingTime}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white font-medium">
                            {r.currentReadingKwh.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-300">
                            {r.unitsConsumedKwh.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300">
                            ₹{r.calculatedCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-center no-print">
                            <button
                              id={`btn-del-month-rd-${r.id}`}
                              onClick={() => setReadingToDelete(r)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Reading"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: YEAR-WISE ANNUAL SCHEDULE VIEW
          ========================================================================= */}
      {activeSubTab === 'year' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${subtextColor}`}>Calendar Year:</span>
              <select
                value={selectedYearNum}
                onChange={(e) => setSelectedYearNum(parseInt(e.target.value))}
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${inputBg}`}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className={`text-[10px] block ${subtextColor}`}>Annual Total Units</span>
                <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">
                  {yearData.annualUnits.toLocaleString()} kWh
                </span>
              </div>
              <div>
                <span className={`text-[10px] block ${subtextColor}`}>Annual Billed Cost</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                  ₹{yearData.annualCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 12-Month Table */}
          <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className={`text-sm font-extrabold ${headingColor}`}>
                12-Month Billing Summary • {activeBlock.name} ({selectedYearNum})
              </h3>
              <span className={`text-xs ${subtextColor}`}>Complete Annual Tariff Reconciliation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={tableHeaderBg}>
                  <tr>
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-3">Units (kWh)</th>
                    <th className="py-2.5 px-3">Energy Charges</th>
                    <th className="py-2.5 px-3">Demand Charges</th>
                    <th className="py-2.5 px-3">Taxes & Duties</th>
                    <th className="py-2.5 px-3">Custom Charges</th>
                    <th className="py-2.5 px-3 text-right">Total Net Bill</th>
                    <th className="py-2.5 px-3 text-right">Effective Rate</th>
                    <th className="py-2.5 px-3 text-center">Logs Count</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableRowBorder}`}>
                  {yearData.monthlyBreakdown.map((m) => {
                    const effectiveRate = m.units > 0 ? +(m.totalBill / m.units).toFixed(2) : 0;

                    return (
                      <tr key={m.monthKey}>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {m.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-300">
                          {m.units.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          ₹{m.energyCharge.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          ₹{m.demandCharge.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          ₹{m.taxes.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          ₹{m.customCharges.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300">
                          ₹{m.totalBill.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-cyan-300">
                          {effectiveRate > 0 ? `₹${effectiveRate}/u` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                          {m.readingsCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: TARIFF & CUSTOM CHARGES MANAGER (ADD / DELETE CHARGES)
          ========================================================================= */}
      {activeSubTab === 'tariff' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
            <div>
              <h3 className={`text-base font-extrabold ${headingColor}`}>
                Tariff Configuration • {activeBlock.name}
              </h3>
              <p className={`text-xs ${subtextColor}`}>
                Manage base energy charges, demand parameters, and add/delete custom surcharge items for this meter
              </p>
            </div>
            <button
              onClick={handleOpenEditTariff}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Base Parameters</span>
            </button>
          </div>

          {/* Grid of Base Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>Base Energy Rate</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{activeTariff.baseRatePerUnit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">per kWh unit</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>Demand Charge</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{activeTariff.demandChargePerKva}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">per kVA demand</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>Wheeling Charge</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{activeTariff.wheelingChargePerUnit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">per unit</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>FAC Surcharge</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                {activeTariff.facPercent}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">Fuel Adj. Charge</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>Electricity Duty</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                {activeTariff.electricityDutyPercent}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">Govt. duty</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${subtextColor} block`}>TOSE Tax</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{activeTariff.toseTaxPerUnit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">Tax on Sale of Elec.</span>
            </div>
          </div>

          {/* DYNAMIC CUSTOM CHARGES SECTION (User Request: Add and Delete Charges at will) */}
          <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className={`text-base font-extrabold ${headingColor}`}>
                  Custom Surcharges & Additional Charges
                </h3>
                <p className={`text-xs ${subtextColor}`}>
                  Add any specific charges (Regulatory Asset, Green Cess, Meter Rent, Harmonic Surcharge) or delete them whenever needed
                </p>
              </div>

              <button
                onClick={handleOpenAddCharge}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Custom Charge</span>
              </button>
            </div>

            {/* List of active custom charges */}
            <div className="space-y-2">
              {(!activeTariff.customCharges || activeTariff.customCharges.length === 0) ? (
                <div className={`text-center py-8 border-2 border-dashed rounded-xl ${subtextColor}`}>
                  No custom charges configured for {activeBlock.name}. Click "+ Add Custom Charge" above to add charges.
                </div>
              ) : (
                activeTariff.customCharges.map((c) => {
                  let typeBadge = 'Per Unit';
                  let valLabel = `₹${c.value.toFixed(2)} / unit`;
                  if (c.type === 'percentage_energy') {
                    typeBadge = '% of Energy';
                    valLabel = `${c.value}% of base energy`;
                  } else if (c.type === 'percentage_total') {
                    typeBadge = '% of Total';
                    valLabel = `${c.value}% of base bill`;
                  } else if (c.type === 'fixed_monthly') {
                    typeBadge = 'Fixed Monthly';
                    valLabel = `₹${c.value.toFixed(2)} flat/month`;
                  } else if (c.type === 'per_kva') {
                    typeBadge = 'Per kVA Demand';
                    valLabel = `₹${c.value.toFixed(2)} / kVA`;
                  }

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${headingColor}`}>{c.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {typeBadge}
                          </span>
                        </div>
                        <p className={`text-xs ${subtextColor}`}>
                          Rate: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{valLabel}</span>
                          {c.description && <span className="ml-2 italic">• {c.description}</span>}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCharge(c.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Delete this charge from tariff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ENTER MSEB METER READING
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className={`text-base font-extrabold ${headingColor}`}>
                  Log MSEB Meter Reading
                </h3>
                <p className={`text-xs ${subtextColor}`}>
                  Recording shift reading for <span className="font-bold text-blue-600 dark:text-cyan-400">{activeBlock.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-semibold">
                  {formError}
                </div>
              )}

              {formSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold">
                  {formSuccessToast}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Time</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                  />
                </div>
              </div>

              {/* kWh Readings */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-950/40">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block text-xs">
                  Active Energy (kWh) Readings
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] ${subtextColor}`}>Previous Reading (kWh)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formPrevKwh}
                      onChange={(e) => setFormPrevKwh(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg font-mono text-xs border ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] ${subtextColor}`}>Current Reading (kWh)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formCurrKwh}
                      onChange={(e) => setFormCurrKwh(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg font-mono text-xs border ${inputBg}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 pt-1">
                  <span>Net Consumed Units:</span>
                  <span>
                    {Math.max(
                      0,
                      (parseFloat(formCurrKwh) || 0) - (parseFloat(formPrevKwh) || 0)
                    ).toLocaleString()}{' '}
                    kWh
                  </span>
                </div>
              </div>

              {/* kVAh & MF */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Multiplier (MF)</label>
                  <input
                    type="number"
                    step="any"
                    value={formMultiplier}
                    onChange={(e) => setFormMultiplier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Prev kVAh (Opt.)</label>
                  <input
                    type="number"
                    step="any"
                    value={formPrevKvah}
                    onChange={(e) => setFormPrevKvah(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Curr kVAh (Opt.)</label>
                  <input
                    type="number"
                    step="any"
                    value={formCurrKvah}
                    onChange={(e) => setFormCurrKvah(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Operator Remarks / Shift Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Regular morning check, peak load reading..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RENAME MSEB FEEDER / BLOCK
          ========================================================================= */}
      {isEditBlockModalOpen && editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className={`text-base font-extrabold ${headingColor}`}>
                Configure Incomer Feeder Info
              </h3>
              <button
                onClick={() => setIsEditBlockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4 mt-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Feeder Name</label>
                <input
                  type="text"
                  required
                  value={editingBlock.name}
                  onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl font-semibold border ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Code</label>
                  <input
                    type="text"
                    required
                    value={editingBlock.code}
                    onChange={(e) => setEditingBlock({ ...editingBlock, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Contract Demand (kVA)</label>
                  <input
                    type="number"
                    required
                    value={editingBlock.contractDemandKva}
                    onChange={(e) =>
                      setEditingBlock({ ...editingBlock, contractDemandKva: parseFloat(e.target.value) || 250 })
                    }
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Consumer Number</label>
                <input
                  type="text"
                  required
                  value={editingBlock.consumerNumber}
                  onChange={(e) => setEditingBlock({ ...editingBlock, consumerNumber: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Meter Number</label>
                <input
                  type="text"
                  required
                  value={editingBlock.meterNumber}
                  onChange={(e) => setEditingBlock({ ...editingBlock, meterNumber: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT BASE TARIFF PARAMETERS
          ========================================================================= */}
      {isEditTariffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className={`text-base font-extrabold ${headingColor}`}>
                  Update Tariff • {activeBlock.name}
                </h3>
                <p className={`text-xs ${subtextColor}`}>
                  Set base tariff parameters for this specific meter
                </p>
              </div>
              <button
                onClick={() => setIsEditTariffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTariff} className="space-y-4 mt-4 text-xs">
              {tariffSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold">
                  {tariffSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Base Energy Rate (₹/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBaseRate}
                    onChange={(e) => setEditBaseRate(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Demand Charge (₹/kVA)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editDemandCharge}
                    onChange={(e) => setEditDemandCharge(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Wheeling Charge (₹/unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editWheelingCharge}
                    onChange={(e) => setEditWheelingCharge(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>FAC Fuel Surcharge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editFacPercent}
                    onChange={(e) => setEditFacPercent(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>Electricity Duty (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editDutyPercent}
                    onChange={(e) => setEditDutyPercent(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${subtextColor}`}>TOSE Tax (₹/unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editToseTax}
                    onChange={(e) => setEditToseTax(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                  />
                </div>
              </div>

              {/* Effective Unit Rate Calculation Mode (User explicit request: automatic by default, editable manually) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Effective Unit Rate Control
                    </span>
                    <span className={`text-[11px] ${subtextColor}`}>
                      Choose automatic bill calculation or enter a fixed manual rate per unit
                    </span>
                  </div>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditIsManualEffectiveRate(false)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        !editIsManualEffectiveRate
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Automatic
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsManualEffectiveRate(true)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        editIsManualEffectiveRate
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Manual Override
                    </button>
                  </div>
                </div>

                {editIsManualEffectiveRate && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 animate-fadeIn">
                    <label className={`block font-semibold ${subtextColor}`}>
                      Manual Effective Rate (₹ / kWh)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={editManualEffectiveRate}
                        onChange={(e) => setEditManualEffectiveRate(parseFloat(e.target.value) || 0)}
                        className={`w-40 px-3 py-2 rounded-xl font-mono border ${inputBg}`}
                        placeholder="e.g. 11.50"
                      />
                      <span className={`text-xs ${subtextColor}`}>
                        This manual rate will be multiplied by consumed units for total bill calculations.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditTariffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Save Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ADD CUSTOM CHARGE (USER EXPLICIT REQUEST)
          ========================================================================= */}
      {isAddChargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className={`text-base font-extrabold ${headingColor}`}>
                  Add Custom Tariff Charge
                </h3>
                <p className={`text-xs ${subtextColor}`}>
                  Configure additional surcharge item for {activeBlock.name}
                </p>
              </div>
              <button
                onClick={() => setIsAddChargeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomCharge} className="space-y-4 mt-4 text-xs">
              {chargeFormError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-semibold">
                  {chargeFormError}
                </div>
              )}

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Charge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regulatory Asset Surcharge, Green Cess..."
                  value={chargeName}
                  onChange={(e) => setChargeName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-semibold border ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Calculation Basis</label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl font-semibold border ${inputBg}`}
                >
                  <option value="per_unit">Rate per Unit (₹ / kWh or kVAh)</option>
                  <option value="percentage_energy">Percentage of Energy Charges (%)</option>
                  <option value="percentage_total">Percentage of Total Base Bill (%)</option>
                  <option value="fixed_monthly">Fixed Monthly Amount (₹ flat)</option>
                  <option value="per_kva">Rate per kVA Demand (₹ / kVA)</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>
                  Value / Rate {chargeType.startsWith('percentage') ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={chargeType.startsWith('percentage') ? 'e.g. 2.5' : 'e.g. 0.25'}
                  value={chargeValue}
                  onChange={(e) => setChargeValue(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${subtextColor}`}>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. As per MERC tariff order order no..."
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddChargeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Add Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: OFFICIAL PRINTABLE MSEB ELECTRICITY BILL INVOICE
          ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl my-8 bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
            {/* Top Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  MSEB / MSEDCL Electricity Bill Invoice Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Official bill format for {activeBlock.name} • Month: {formatMonthYear(selectedMonthStr)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill Now</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE BILL SHEET (Styled for printing) */}
            <div className="printable-bill border-2 border-slate-900 p-6 space-y-4 text-xs font-sans">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">
                  MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD. (MSEDCL)
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  HIGH TENSION (HT) / LT INDUSTRIAL POWER SUPPLY BILL
                </p>
                <p className="text-[10px] text-slate-600">
                  GSTIN: 27AABCM8291M1Z8 • Official Utility Assessment Invoice
                </p>
              </div>

              {/* Consumer & Bill Identifiers */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-400 pb-3 text-xs">
                <div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Consumer No:</span>
                    <span className="font-mono font-bold">{activeBlock.consumerNumber}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Consumer Name:</span>
                    <span className="font-bold">VOLTWISE INDUSTRIAL FACILITY</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Incomer / Feeder:</span>
                    <span className="font-bold">{activeBlock.name} ({activeBlock.code})</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Meter Number:</span>
                    <span className="font-mono font-bold">{activeBlock.meterNumber}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Billing Month:</span>
                    <span className="font-bold">{formatMonthYear(selectedMonthStr)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Sanctioned Load:</span>
                    <span className="font-bold">{activeBlock.sanctionedLoadKw} kW</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-slate-600">Bill Date:</span>
                    <span className="font-mono">{getTodayDateStr()}</span>
                  </div>
                </div>
              </div>

              {/* Meter Reading Summary Box */}
              <div className="border border-slate-900 rounded-sm p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <span className="block text-slate-600 font-medium">Billed Units (kWh)</span>
                    <span className="text-sm font-black font-mono">{monthData.totalKwh.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 font-medium">Billed Units (kVAh)</span>
                    <span className="text-sm font-black font-mono">{monthData.totalKvah.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 font-medium">Effective Rate</span>
                    <span className="text-sm font-black font-mono">₹{monthData.billBreakdown.effectiveCostPerUnit}/u</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table of Charges */}
              <table className="w-full text-left text-xs border border-slate-900">
                <thead className="bg-slate-200 border-b border-slate-900 font-bold">
                  <tr>
                    <th className="p-2">Description of Charges</th>
                    <th className="p-2 text-center">Rate / Basis</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-2 font-medium">1. Base Energy Charges</td>
                    <td className="p-2 text-center font-mono">₹{activeTariff.baseRatePerUnit.toFixed(2)}/u</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {monthData.billBreakdown.energyCharges.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">2. Wheeling Charges</td>
                    <td className="p-2 text-center font-mono">₹{activeTariff.wheelingChargePerUnit.toFixed(2)}/u</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {monthData.billBreakdown.wheelingCharges.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">3. Fuel Adjustment Charge (FAC)</td>
                    <td className="p-2 text-center font-mono">{activeTariff.facPercent}%</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {monthData.billBreakdown.facCharges.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">4. Electricity Duty</td>
                    <td className="p-2 text-center font-mono">{activeTariff.electricityDutyPercent}%</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {monthData.billBreakdown.electricityDuty.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">5. Tax on Sale of Electricity (TOSE)</td>
                    <td className="p-2 text-center font-mono">₹{activeTariff.toseTaxPerUnit.toFixed(2)}/u</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {monthData.billBreakdown.toseCharges.toLocaleString()}
                    </td>
                  </tr>

                  {/* Custom Surcharges in Print */}
                  {monthData.billBreakdown.customChargesBreakdown?.map((cc) => (
                    <tr key={cc.id} className="bg-slate-50">
                      <td className="p-2 font-medium pl-4">• {cc.name}</td>
                      <td className="p-2 text-center font-mono">{cc.rateLabel}</td>
                      <td className="p-2 text-right font-mono font-bold">{cc.amount.toLocaleString()}</td>
                    </tr>
                  ))}

                  {/* Total Net Payable */}
                  <tr className="bg-slate-100 font-black text-sm border-t-2 border-slate-900">
                    <td className="p-2.5 uppercase" colSpan={2}>
                      NET AMOUNT PAYABLE BY DUE DATE
                    </td>
                    <td className="p-2.5 text-right font-mono text-base font-black">
                      ₹{monthData.billBreakdown.totalMsebBill.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Instructions / Footer */}
              <div className="pt-2 text-[10px] text-slate-600 space-y-1">
                <p>• Generated by VoltWise Official Electrical Department System.</p>
                <p>• This is an automated assessment based on recorded shift meter telemetry for Incomer: {activeBlock.name}.</p>
                <p>• Power factor penalty/incentive applied as per MERC order tariff schedule.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SAFE IN-APP MODAL: CONFIRM DELETE SINGLE READING
          ========================================================================= */}
      {readingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Delete Meter Reading</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">This action will update your bill immediately</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 my-3">
              <div className="flex justify-between">
                <span className={subtextColor}>Date & Time:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{readingToDelete.readingDate} at {readingToDelete.readingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className={subtextColor}>Current Reading:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{readingToDelete.currentReadingKwh.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className={subtextColor}>Consumed Units:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{readingToDelete.unitsConsumedKwh.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className={subtextColor}>Calculated Cost:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{readingToDelete.calculatedCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                id="btn-cancel-del-reading"
                onClick={() => setReadingToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-del-reading"
                onClick={handleConfirmDeleteReading}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Delete Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SAFE IN-APP MODAL: CLEAR ALL READINGS (CLEAN SLATE FOR MANUAL ENTRY)
          ========================================================================= */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl relative ${cardBg}`}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Clear Meter Readings</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Reset readings for completely manual entry</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 my-2 leading-relaxed">
              Choose which readings you would like to clear so you can manually enter your own meter readings:
            </p>

            <div className="space-y-2 my-3 text-xs">
              <label
                onClick={() => setClearScope('current')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'current'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'current'}
                  onChange={() => setClearScope('current')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Clear readings for {activeBlock.name} only
                  </span>
                  <span className={`text-[11px] ${subtextColor}`}>
                    Removes {blockReadings.length} recorded reading entries for this specific incomer
                  </span>
                </div>
              </label>

              <label
                onClick={() => setClearScope('all')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'all'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'all'}
                  onChange={() => setClearScope('all')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Wipe all readings across BOTH incomers
                  </span>
                  <span className={`text-[11px] ${subtextColor}`}>
                    Removes all {msebReadings.length} recorded entries for a completely blank state
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                id="btn-cancel-clear-all"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={handleConfirmClearAllReadings}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Clear Readings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SAFE IN-APP MODAL: CONFIRM REMOVE CUSTOM SURCHARGE
          ========================================================================= */}
      {chargeToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl relative ${cardBg}`}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Remove Tariff Surcharge</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to remove this custom surcharge from the MSEB tariff calculation?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setChargeToDeleteId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-del-charge"
                onClick={() => {
                  deleteMsebCustomCharge(selectedBlockId, chargeToDeleteId);
                  setChargeToDeleteId(null);
                  setActionSuccessToast('Custom surcharge removed.');
                  setTimeout(() => setActionSuccessToast(''), 3000);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Delete Surcharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
