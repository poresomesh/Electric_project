import React, { useState, useEffect, useMemo } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr, getPastNMonths } from '../utils/dateUtils';
import { 
  X, 
  Gauge, 
  Check, 
  AlertTriangle, 
  Calculator, 
  CheckCircle2, 
  Activity,
  Zap,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
  Scale
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EnterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBlockId?: string;
  initialMode?: 'single' | 'batch4m';
}

interface BatchRow {
  id: string;
  monthLabel: string;
  date: string;
  time: string;
  prevKwh: number;
  currKwh: number;
  multiplier?: number; // Custom row-level MF if needed
  prevKvah?: number;
  currKvah?: number;
  voltageRms?: number;
  powerFactor?: number;
  notes?: string;
}

export const EnterReadingModal: React.FC<EnterReadingModalProps> = ({
  isOpen,
  onClose,
  defaultBlockId,
  initialMode = 'single',
}) => {
  const {
    currentUser,
    blocks,
    meters,
    readings,
    tariff,
    isAdmin,
    isBlockIncharge,
    isDarkMode,
    addReading,
    addBatchReadings,
  } = useEnergy();

  const [activeTab, setActiveTab] = useState<'single' | 'batch4m'>(initialMode);

  // User permitted blocks
  const availableBlocks = useMemo(() => {
    if (isAdmin) return blocks;
    if (isBlockIncharge && currentUser.assignedBlockId) {
      return blocks.filter((b) => b.id === currentUser.assignedBlockId);
    }
    return [];
  }, [isAdmin, isBlockIncharge, currentUser, blocks]);

  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [readingDate, setReadingDate] = useState<string>(getTodayDateStr());
  const [readingTime, setReadingTime] = useState<string>('08:00');
  
  // Single kWh states
  const [currentReadingInput, setCurrentReadingInput] = useState<string>('');
  const [customPrevInput, setCustomPrevInput] = useState<string>('');
  const [isOverridePrev, setIsOverridePrev] = useState<boolean>(false);

  // Multiplier Factor (MF / CT Ratio) state
  const [manualMultiplier, setManualMultiplier] = useState<number>(1);
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);

  // Single kVAh states
  const [currentKvahInput, setCurrentKvahInput] = useState<string>('');
  const [customPrevKvahInput, setCustomPrevKvahInput] = useState<string>('');
  const [isOverridePrevKvah, setIsOverridePrevKvah] = useState<boolean>(false);

  // Single Electrical parameters
  const [notes, setNotes] = useState<string>('');
  const [voltageRms, setVoltageRms] = useState<number>(415);
  const [powerFactor, setPowerFactor] = useState<number>(0.95);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string>('');

  const [savedData, setSavedData] = useState<{
    blockName: string;
    meterNumber: string;
    prev: number;
    curr: number;
    multiplier: number;
    rawDiff: number;
    units: number;
    prevKvah?: number;
    currKvah?: number;
    kvahConsumed?: number;
    cost: number;
    date: string;
  } | null>(null);

  // Helper to construct dynamic 4-month batch rows
  const generateInitialBatchRows = (): BatchRow[] => {
    const past4 = getPastNMonths(4, getTodayDateStr());
    return past4.map((m, idx) => ({
      id: `row-${idx + 1}`,
      monthLabel: `Month ${idx + 1} (${m.label})`,
      date: `${m.monthStr}-28`,
      time: '08:00',
      prevKwh: 0,
      currKwh: 0,
      prevKvah: 0,
      currKvah: 0,
      powerFactor: 0.95,
      notes: `${m.label} Monthly Reading`,
    }));
  };

  // 4-Month Batch Entry state (initialized with 0 values for clean manual entry)
  const [batchRows, setBatchRows] = useState<BatchRow[]>(generateInitialBatchRows);

  // Reset / Initialize on modal open
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setBatchSuccessMsg('');
      setErrorMsg('');
      setCurrentReadingInput('');
      setCurrentKvahInput('');
      setCustomPrevInput('');
      setCustomPrevKvahInput('');
      setIsOverridePrev(false);
      setIsOverridePrevKvah(false);
      setActiveTab(initialMode);
      setBatchRows(generateInitialBatchRows());
      
      const initialBlock = defaultBlockId || (availableBlocks.length > 0 ? availableBlocks[0].id : '');
      setSelectedBlockId(initialBlock);
      
      const now = new Date();
      const dateStr = getTodayDateStr();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setReadingDate(dateStr);
      setReadingTime(timeStr);
    }
  }, [isOpen, defaultBlockId, availableBlocks, initialMode]);

  // Meters available for selected block
  const blockMeters = useMemo(() => {
    return meters.filter((m) => m.blockId === selectedBlockId);
  }, [meters, selectedBlockId]);

  // Auto-select first meter when block changes
  useEffect(() => {
    if (blockMeters.length > 0 && !blockMeters.some((m) => m.id === selectedMeterId)) {
      const firstM = blockMeters[0];
      setSelectedMeterId(firstM.id);
      setManualMultiplier(firstM.multiplier || 1);
      setBatchMultiplier(firstM.multiplier || 1);
    } else if (blockMeters.length === 0) {
      setSelectedMeterId('');
      setManualMultiplier(1);
      setBatchMultiplier(1);
    }
  }, [selectedBlockId, blockMeters, selectedMeterId]);

  // Find target meter and previous reading
  const selectedMeter = useMemo(() => {
    return meters.find((m) => m.id === selectedMeterId);
  }, [meters, selectedMeterId]);

  // Sync multiplier when user switches meter
  useEffect(() => {
    if (selectedMeter) {
      setManualMultiplier(selectedMeter.multiplier || 1);
      setBatchMultiplier(selectedMeter.multiplier || 1);
    }
  }, [selectedMeter]);

  // Auto previous kWh
  const autoPreviousReading = useMemo(() => {
    if (!selectedMeterId) return 0;
    const pastReadings = readings
      .filter((r) => r.meterId === selectedMeterId && r.readingDate <= readingDate)
      .sort((a, b) => b.readingDate.localeCompare(a.readingDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (pastReadings.length > 0) {
      return pastReadings[0].currentReading;
    }
    return selectedMeter?.lastReadingValue || 0;
  }, [readings, selectedMeterId, selectedMeter, readingDate]);

  // Auto previous kVAh
  const autoPreviousKvah = useMemo(() => {
    if (!selectedMeterId) return 0;
    const pastReadings = readings
      .filter((r) => r.meterId === selectedMeterId && r.currentKvah !== undefined && r.readingDate <= readingDate)
      .sort((a, b) => b.readingDate.localeCompare(a.readingDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (pastReadings.length > 0 && pastReadings[0].currentKvah !== undefined) {
      return pastReadings[0].currentKvah;
    }
    return 0;
  }, [readings, selectedMeterId, readingDate]);

  const activePreviousReading = isOverridePrev && customPrevInput !== '' ? Number(customPrevInput) : autoPreviousReading;
  const activePreviousKvah = isOverridePrevKvah && customPrevKvahInput !== '' ? Number(customPrevKvahInput) : autoPreviousKvah;

  // Active Multiplier
  const activeMultiplier = Math.max(1, Number(manualMultiplier) || 1);

  // Real-time calculation for single kWh
  const currentReadingNum = Number(currentReadingInput);
  const isValidNumber = currentReadingInput !== '' && !isNaN(currentReadingNum);
  const rawDiff = isValidNumber ? Math.max(0, currentReadingNum - activePreviousReading) : 0;
  const unitsConsumed = rawDiff * activeMultiplier;
  const estimatedCost = unitsConsumed * tariff.baseRatePerUnit;
  const isReadingValid = isValidNumber && (activePreviousReading === 0 || currentReadingNum >= activePreviousReading);

  // Real-time calculation for single kVAh
  const currentKvahNum = currentKvahInput !== '' ? Number(currentKvahInput) : undefined;
  const isValidKvah = currentKvahNum !== undefined && !isNaN(currentKvahNum);
  const rawKvahDiff = isValidKvah ? Math.max(0, currentKvahNum - activePreviousKvah) : 0;
  const kvahConsumed = isValidKvah ? rawKvahDiff * activeMultiplier : undefined;

  // Real-time computed Power Factor (kWh / kVAh)
  const computedPf = useMemo(() => {
    if (isValidNumber && isValidKvah && kvahConsumed && kvahConsumed > 0 && unitsConsumed > 0) {
      return Math.min(1.0, +(unitsConsumed / kvahConsumed).toFixed(2));
    }
    return powerFactor;
  }, [isValidNumber, isValidKvah, unitsConsumed, kvahConsumed, powerFactor]);

  // Handle single reading submission
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedBlockId) {
      setErrorMsg('Please select a Block');
      return;
    }
    if (!selectedMeterId) {
      setErrorMsg('Please select a Meter');
      return;
    }
    if (!isValidNumber) {
      setErrorMsg('Please enter a valid Current Meter Reading (kWh)');
      return;
    }
    if (currentReadingNum < activePreviousReading && activePreviousReading > 0) {
      setErrorMsg(`Current kWh reading (${currentReadingNum}) cannot be less than previous reading (${activePreviousReading}).`);
      return;
    }
    if (currentKvahNum !== undefined && currentKvahNum < activePreviousKvah && activePreviousKvah > 0) {
      setErrorMsg(`Current kVAh reading (${currentKvahNum}) cannot be less than previous kVAh reading (${activePreviousKvah}).`);
      return;
    }

    const result = addReading({
      blockId: selectedBlockId,
      meterId: selectedMeterId,
      readingDate,
      readingTime,
      previousReading: activePreviousReading,
      currentReading: currentReadingNum,
      multiplier: activeMultiplier,
      notes,
      previousKvah: currentKvahNum !== undefined ? activePreviousKvah : undefined,
      currentKvah: currentKvahNum,
      voltageRms,
      powerFactor: computedPf,
    });

    if (result.success) {
      const selectedBlockObj = blocks.find((b) => b.id === selectedBlockId);
      setSavedData({
        blockName: selectedBlockObj?.name || 'Block',
        meterNumber: selectedMeter?.meterNumber || 'MTR-001',
        prev: activePreviousReading,
        curr: currentReadingNum,
        multiplier: activeMultiplier,
        rawDiff,
        units: result.unitsConsumed,
        prevKvah: currentKvahNum !== undefined ? activePreviousKvah : undefined,
        currKvah: currentKvahNum,
        kvahConsumed,
        cost: result.unitsConsumed * tariff.baseRatePerUnit,
        date: readingDate,
      });
      setIsSuccess(true);

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch (err) {
        // Safe fallback
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  // Handle batch 4-month submission
  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBatchSuccessMsg('');

    if (!selectedBlockId) {
      setErrorMsg('Please select a Block');
      return;
    }
    if (!selectedMeterId) {
      setErrorMsg('Please select a Meter');
      return;
    }

    // Validate rows
    const validRows = batchRows.filter((r) => r.currKwh > 0 || r.prevKwh > 0);
    if (validRows.length === 0) {
      setErrorMsg('Please enter at least one month of valid meter readings.');
      return;
    }

    const payload = validRows.map((r) => {
      const rowMf = r.multiplier !== undefined && r.multiplier > 0 ? r.multiplier : Math.max(1, Number(batchMultiplier) || 1);
      return {
        blockId: selectedBlockId,
        meterId: selectedMeterId,
        readingDate: r.date,
        readingTime: r.time || '08:00',
        previousReading: Number(r.prevKwh) || 0,
        currentReading: Number(r.currKwh) || 0,
        multiplier: rowMf,
        notes: r.notes || `${r.monthLabel} historical entry (MF: ${rowMf}x)`,
        previousKvah: r.prevKvah !== undefined ? Number(r.prevKvah) : undefined,
        currentKvah: r.currKvah !== undefined ? Number(r.currKvah) : undefined,
        voltageRms: r.voltageRms || 415,
        powerFactor: r.powerFactor || 0.95,
      };
    });

    const result = addBatchReadings(payload);
    if (result.success) {
      setBatchSuccessMsg(result.message);
      setIsSuccess(true);
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch (err) {
        // Safe fallback
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  // Helper to update a batch row
  const updateBatchRow = (id: string, field: keyof BatchRow, value: any) => {
    setBatchRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Add another row in batch
  const handleAddBatchRow = () => {
    const nextIdx = batchRows.length + 1;
    const lastRow = batchRows[batchRows.length - 1];
    const newRow: BatchRow = {
      id: `row-${Date.now().toString(36)}`,
      monthLabel: `Entry #${nextIdx}`,
      date: '2026-08-30',
      time: '08:00',
      prevKwh: lastRow ? lastRow.currKwh : 0,
      currKwh: lastRow ? lastRow.currKwh + 1000 : 1000,
      multiplier: batchMultiplier,
      prevKvah: lastRow ? lastRow.currKvah : 0,
      currKvah: lastRow ? (lastRow.currKvah || 0) + 1050 : 1050,
      powerFactor: 0.95,
      notes: `Historical Month Entry ${nextIdx}`,
    };
    setBatchRows([...batchRows, newRow]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((r) => r.id !== id));
  };

  // Quick preset month buttons for single entry
  const setPresetMonth = (monthStr: string, dateStr: string) => {
    setReadingDate(dateStr);
    setNotes(`Manual ${monthStr} Reading`);
  };

  const mfPresets = [1, 10, 20, 40, 50, 60, 80, 100, 200, 400];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden transition-all my-8 max-h-[92vh] flex flex-col ${
        isDarkMode ? 'bg-slate-900 border-slate-700/90 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isDarkMode ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/20' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'
            }`}>
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Manual Meter Data & Multiplier Entry
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                Enter custom date readings or 4-month historical records with manual multiplying factor (MF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className={`flex items-center border-b px-6 pt-2 shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <button
            onClick={() => {
              setActiveTab('single');
              setIsSuccess(false);
              setErrorMsg('');
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? isDarkMode ? 'border-cyan-400 text-cyan-400' : 'border-blue-600 text-blue-700'
                : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Single Reading (Any Date / Time)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('batch4m');
              setIsSuccess(false);
              setErrorMsg('');
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'batch4m'
                ? isDarkMode ? 'border-cyan-400 text-cyan-400' : 'border-blue-600 text-blue-700'
                : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>4-Month / Multi-Month Batch Entry</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              isDarkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-800'
            }`}>
              Fast Fill
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              isDarkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success View */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-5 animate-scaleUp">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-lg ${
                isDarkMode 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-emerald-500/10'
              }`}>
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {batchSuccessMsg ? 'Historical Records Saved!' : 'Reading Recorded Successfully!'}
                </h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {batchSuccessMsg || 'Data calculated with Multiplying Factor and updated in Energy Monitoring & Live Billing!'}
                </p>
              </div>

              {savedData && (
                <div className={`border rounded-xl p-4 text-left space-y-3 max-w-md mx-auto ${
                  isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-2.5 ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div>
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Block & Meter</span>
                      <div className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
                        {savedData.blockName} • {savedData.meterNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reading Date</span>
                      <div className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{savedData.date}</div>
                    </div>
                  </div>

                  {/* Multiplier and Difference Breakdown */}
                  <div className={`p-3 rounded-lg border space-y-1.5 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Meter Counter Difference:</span>
                      <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        {savedData.curr.toLocaleString()} - {savedData.prev.toLocaleString()} = {savedData.rawDiff.toLocaleString()} kWh
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-blue-700'}`}>Multiplying Factor (MF):</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                        isDarkMode ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' : 'text-blue-800 bg-blue-50 border-blue-200'
                      }`}>
                        × {savedData.multiplier}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/40' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-xs'
                  }`}>
                    <div>
                      <div className={`text-xs font-semibold ${isDarkMode ? 'text-cyan-300' : 'text-blue-900'}`}>
                        Final Units Consumed (Diff × MF)
                      </div>
                      <div className={`text-2xl font-black font-mono tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {savedData.units.toLocaleString()} <span className={`text-xs font-normal ${isDarkMode ? 'text-cyan-400' : 'text-blue-700'}`}>kWh</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Estimated Cost</div>
                      <div className={`text-base font-bold font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {tariff.currencySymbol} {savedData.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setBatchSuccessMsg('');
                    setCurrentReadingInput('');
                    setCurrentKvahInput('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs'
                  }`}
                >
                  + Add Another Reading
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    isDarkMode
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  View in Monitoring
                </button>
              </div>
            </div>
          ) : activeTab === 'single' ? (
            /* ========================================================================= */
            /* SINGLE READING FORM                                                       */
            /* ========================================================================= */
            <form onSubmit={handleSubmitSingle} className="space-y-4">
              {/* Step 1: Select Block */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Step 1: Choose Block <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableBlocks.map((blk) => {
                    const isSelected = selectedBlockId === blk.id;
                    return (
                      <button
                        type="button"
                        key={blk.id}
                        onClick={() => setSelectedBlockId(blk.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-500/40'
                              : 'bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/30 shadow-xs'
                            : isDarkMode
                              ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-900 shadow-2xs'
                        }`}
                      >
                        <div className={`text-xs font-bold truncate ${
                          isSelected
                            ? isDarkMode ? 'text-white' : 'text-blue-950 font-extrabold'
                            : isDarkMode ? 'text-slate-200' : 'text-slate-900 font-bold'
                        }`}>
                          {blk.name}
                        </div>
                        <div className={`text-[10px] truncate mt-0.5 ${
                          isSelected
                            ? isDarkMode ? 'text-cyan-300 font-medium' : 'text-blue-700 font-bold'
                            : isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'
                        }`}>
                          {blk.code}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Meter & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Step 2: Select Meter <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                  </label>
                  <select
                    value={selectedMeterId}
                    onChange={(e) => setSelectedMeterId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none font-medium transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                    }`}
                  >
                    {blockMeters.map((m) => (
                      <option key={m.id} value={m.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {m.meterNumber} - {m.name} (MF: {m.multiplier || 1}x)
                      </option>
                    ))}
                    {blockMeters.length === 0 && <option value="">No meters in this block</option>}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Reading Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={readingDate}
                      onChange={(e) => setReadingDate(e.target.value)}
                      className={`w-2/3 px-3 py-2 rounded-xl border text-xs focus:outline-none font-mono ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                      }`}
                    />
                    <input
                      type="time"
                      value={readingTime}
                      onChange={(e) => setReadingTime(e.target.value)}
                      className={`w-1/3 px-2 py-2 rounded-xl border text-xs focus:outline-none font-mono ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Month Selector Buttons */}
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Quick Month Date Presets (Last 4 Months):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetMonth('May 2026', '2026-05-31')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs'
                    }`}
                  >
                    May 2026 (31 May)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetMonth('Jun 2026', '2026-06-30')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs'
                    }`}
                  >
                    Jun 2026 (30 Jun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetMonth('Jul 2026', '2026-07-31')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs'
                    }`}
                  >
                    Jul 2026 (31 Jul)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetMonth('Aug 2026', '2026-08-30')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 shadow-2xs'
                    }`}
                  >
                    Aug 2026 (Current)
                  </button>
                </div>
              </div>

              {/* Step 3: Multiplying Factor (MF / CT Ratio) - Explicit & Editable */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/90 border-cyan-500/30' : 'bg-blue-50/60 border-blue-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-cyan-300' : 'text-blue-900'
                  }`}>
                    <Scale className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span>Multiplying Factor (MF / CT-PT Ratio)</span>
                    <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                  </label>
                  <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                    Formula: Units = (Current - Previous) × MF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-1">
                    <div className="relative">
                      <input
                        id="input-multiplying-factor"
                        type="number"
                        min="1"
                        step="any"
                        value={manualMultiplier}
                        onChange={(e) => setManualMultiplier(Math.max(1, Number(e.target.value) || 1))}
                        placeholder="1"
                        className={`w-full px-3 py-2 rounded-lg border-2 font-mono text-base font-extrabold focus:outline-none pl-8 ${
                          isDarkMode
                            ? 'bg-slate-900 border-cyan-500/60 text-white focus:border-cyan-400'
                            : 'bg-white border-blue-500 text-slate-900 focus:border-blue-600 shadow-xs'
                        }`}
                      />
                      <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-sm ${
                        isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                      }`}>×</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] mr-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        Presets:
                      </span>
                      {mfPresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setManualMultiplier(val)}
                          className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                            manualMultiplier === val
                              ? isDarkMode
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : isDarkMode
                                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-950 shadow-2xs'
                          }`}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Main Active Energy kWh */}
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                <div className={`flex items-center justify-between pb-1 border-b ${
                  isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${
                    isDarkMode ? 'text-cyan-300' : 'text-blue-900'
                  }`}>
                    <Zap className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span>Main Active Energy (kWh)</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                    Primary Billing Units
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Previous Reading (kWh) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Previous kWh
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOverridePrev(!isOverridePrev)}
                        className={`text-[10px] hover:underline cursor-pointer font-medium ${
                          isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                        }`}
                      >
                        {isOverridePrev ? 'Auto Load' : 'Set Baseline / 0'}
                      </button>
                    </div>
                    {isOverridePrev ? (
                      <input
                        type="number"
                        value={customPrevInput}
                        onChange={(e) => setCustomPrevInput(e.target.value)}
                        placeholder="0"
                        className={`w-full px-3 py-2 rounded-lg border font-mono text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-slate-900 border-cyan-500/50 text-cyan-300'
                            : 'bg-white border-blue-400 text-blue-950 shadow-xs'
                        }`}
                      />
                    ) : (
                      <div className={`px-3 py-2 rounded-lg border font-mono text-sm font-bold flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                      }`}>
                        <span>{activePreviousReading.toLocaleString()}</span>
                        <span className={`text-[10px] font-sans ${isDarkMode ? 'text-slate-500' : 'text-slate-400 font-medium'}`}>
                          {activePreviousReading === 0 ? 'Empty (0)' : 'From records'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Current Reading (kWh) */}
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${
                      isDarkMode ? 'text-cyan-300' : 'text-blue-900'
                    }`}>
                      Current Reading (kWh) <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                    </label>
                    <input
                      id="input-current-reading"
                      type="number"
                      step="any"
                      value={currentReadingInput}
                      onChange={(e) => setCurrentReadingInput(e.target.value)}
                      placeholder="e.g. 2580"
                      autoFocus
                      className={`w-full px-3 py-2 rounded-lg border-2 font-mono text-base font-bold focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-cyan-500/70 text-white focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600'
                          : 'bg-white border-blue-500 text-slate-900 focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-400 shadow-xs'
                      }`}
                    />
                  </div>
                </div>

                {/* Automatic Difference & Live Calculation Banner */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 shadow-xs text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Calculator className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <span>Calculation Breakdown:</span>
                    </span>
                    <span className={`font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      ({isValidNumber ? currentReadingNum.toLocaleString() : 0} - {activePreviousReading.toLocaleString()}) × {activeMultiplier} MF
                    </span>
                  </div>

                  <div className={`flex items-center justify-between pt-1 border-t ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div>
                      <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                        Calculated Consumed Units:
                      </div>
                      <div className="text-xl font-extrabold font-mono flex items-baseline gap-1.5 mt-0.5">
                        <span className={isValidNumber && isReadingValid ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600 font-black') : 'text-slate-400'}>
                          {isValidNumber ? unitsConsumed.toLocaleString() : '0'}
                        </span>
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          kWh Units
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Estimated Cost</div>
                      <div className={`text-sm font-bold font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {tariff.currencySymbol} {estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400 font-medium'}`}>
                        @ {tariff.currencySymbol}{tariff.baseRatePerUnit}/unit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Optional kVAh */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${
                    isDarkMode ? 'text-indigo-300' : 'text-indigo-900'
                  }`}>
                    <Activity className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span>Apparent Energy (kVAh) & Power Factor (Optional)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[11px] block mb-1 font-medium ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Previous kVAh
                    </label>
                    <input
                      type="number"
                      value={isOverridePrevKvah ? customPrevKvahInput : activePreviousKvah}
                      onChange={(e) => {
                        setIsOverridePrevKvah(true);
                        setCustomPrevKvahInput(e.target.value);
                      }}
                      placeholder="0"
                      className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-200'
                          : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] block mb-1 font-medium ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Current kVAh
                    </label>
                    <input
                      type="number"
                      value={currentKvahInput}
                      onChange={(e) => setCurrentKvahInput(e.target.value)}
                      placeholder="e.g. 2715"
                      className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-200'
                          : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Shift 1 reading, monthly bill cycle log, etc."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isDarkMode ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                    isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    isDarkMode
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Meter Reading (MF: {activeMultiplier}x)</span>
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* 4-MONTH HISTORICAL / BATCH ENTRY FORM                                     */
            /* ========================================================================= */
            <form onSubmit={handleSubmitBatch} className="space-y-4">
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isDarkMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
              }`}>
                <Sparkles className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong>4-Month Fast Fill:</strong> Select the block and meter, set the Multiplying Factor (MF), then enter monthly kWh. Units and costs are computed automatically with (Diff × MF)!
                </span>
              </div>

              {/* Block & Meter Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Select Target Block <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                  </label>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none font-semibold ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                    }`}
                  >
                    {availableBlocks.map((b) => (
                      <option key={b.id} value={b.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Select Energy Meter <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>*</span>
                  </label>
                  <select
                    value={selectedMeterId}
                    onChange={(e) => setSelectedMeterId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none font-medium ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                    }`}
                  >
                    {blockMeters.map((m) => (
                      <option key={m.id} value={m.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {m.meterNumber} - {m.name} (Default MF: {m.multiplier || 1}x)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Multiplying Factor Section */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                isDarkMode ? 'bg-slate-950/90 border-cyan-500/30' : 'bg-blue-50/60 border-blue-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-cyan-300' : 'text-blue-900'
                  }`}>
                    <Scale className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span>Batch Multiplying Factor (MF) for this Meter</span>
                  </label>
                  <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                    Applied across all batch months
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={batchMultiplier}
                      onChange={(e) => setBatchMultiplier(Math.max(1, Number(e.target.value) || 1))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border-2 font-mono text-sm font-extrabold focus:outline-none pl-7 ${
                        isDarkMode
                          ? 'bg-slate-900 border-cyan-500/60 text-white focus:border-cyan-400'
                          : 'bg-white border-blue-500 text-slate-900 focus:border-blue-600 shadow-xs'
                      }`}
                    />
                    <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs ${
                      isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                    }`}>×</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {mfPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBatchMultiplier(val)}
                        className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          batchMultiplier === val
                            ? isDarkMode
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                              : 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : isDarkMode
                              ? 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-950 shadow-2xs'
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rows Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Monthly Readings List ({batchRows.length} Months):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBatchRow}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Month</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {batchRows.map((row, idx) => {
                    const rowMf = row.multiplier !== undefined && row.multiplier > 0 ? row.multiplier : batchMultiplier;
                    const diff = Math.max(0, row.currKwh - row.prevKwh);
                    const units = diff * rowMf;
                    const cost = units * tariff.baseRatePerUnit;

                    return (
                      <div
                        key={row.id}
                        className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${
                          isDarkMode
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className={`flex items-center justify-between border-b pb-2 ${
                          isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center ${
                              isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={row.monthLabel}
                              onChange={(e) => updateBatchRow(row.id, 'monthLabel', e.target.value)}
                              className={`font-bold text-xs bg-transparent border-b border-transparent focus:outline-none ${
                                isDarkMode
                                  ? 'text-white hover:border-slate-700 focus:border-cyan-500'
                                  : 'text-slate-900 hover:border-slate-400 focus:border-blue-500'
                              }`}
                            />
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                              isDarkMode
                                ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                                : 'text-blue-700 bg-blue-100/70 border-blue-200 font-bold'
                            }`}>
                              MF: {rowMf}x
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                                Consumed (Diff × MF):{' '}
                              </span>
                              <span className={`font-mono font-bold text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {units.toLocaleString()} kWh
                              </span>
                              <span className={`text-[10px] font-mono ml-2 font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                ({tariff.currencySymbol}{cost.toFixed(0)})
                              </span>
                            </div>
                            {batchRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBatchRow(row.id)}
                                className={`p-1 cursor-pointer transition-colors ${
                                  isDarkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className={`text-[10px] block mb-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Date
                            </label>
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateBatchRow(row.id, 'date', e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs ${
                                isDarkMode
                                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                                  : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`text-[10px] block mb-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Previous kWh
                            </label>
                            <input
                              type="number"
                              value={row.prevKwh}
                              onChange={(e) => updateBatchRow(row.id, 'prevKwh', Number(e.target.value))}
                              placeholder="0"
                              className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs ${
                                isDarkMode
                                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                                  : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`text-[10px] font-semibold block mb-0.5 ${
                              isDarkMode ? 'text-cyan-300' : 'text-blue-900'
                            }`}>
                              Current kWh
                            </label>
                            <input
                              type="number"
                              value={row.currKwh}
                              onChange={(e) => updateBatchRow(row.id, 'currKwh', Number(e.target.value))}
                              placeholder="2500"
                              className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold ${
                                isDarkMode
                                  ? 'bg-slate-900 border-cyan-500/60 text-white'
                                  : 'bg-white border-blue-500 text-slate-900 shadow-xs'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`text-[10px] block mb-0.5 font-semibold ${
                              isDarkMode ? 'text-indigo-300' : 'text-indigo-900'
                            }`}>
                              Current kVAh
                            </label>
                            <input
                              type="number"
                              value={row.currKvah || ''}
                              onChange={(e) => updateBatchRow(row.id, 'currKvah', Number(e.target.value))}
                              placeholder="2700"
                              className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs ${
                                isDarkMode
                                  ? 'bg-slate-900 border-slate-700 text-indigo-200'
                                  : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Batch CTA */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t ${
                isDarkMode ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Total Units to save (with MF {batchMultiplier}x):{' '}
                  <strong className={`font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {batchRows.reduce((sum, r) => {
                      const rMf = r.multiplier !== undefined && r.multiplier > 0 ? r.multiplier : batchMultiplier;
                      return sum + Math.max(0, r.currKwh - r.prevKwh) * rMf;
                    }, 0).toLocaleString()} kWh
                  </strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 text-xs transition-colors cursor-pointer ${
                      isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                      isDarkMode
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Save All {batchRows.length} Month Readings</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
