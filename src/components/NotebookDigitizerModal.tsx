import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getTodayDateStr } from '../utils/dateUtils';
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Sparkles,
  Layers,
  Calendar
} from 'lucide-react';

interface NotebookDigitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotebookDigitizerModal: React.FC<NotebookDigitizerModalProps> = ({ isOpen, onClose }) => {
  const { blocks, meters, readings, addReading, tariff } = useEnergy();

  const [date, setDate] = useState(getTodayDateStr());
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id || 'block-a');
  
  // Rows for batch entry
  const [entries, setEntries] = useState<Array<{ meterId: string; currentReading: string; notes: string }>>(() => {
    return meters.slice(0, 4).map((m) => ({
      meterId: m.id,
      currentReading: '',
      notes: 'Notebook Batch Digitization',
    }));
  });

  const [submittedCount, setSubmittedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleUpdateEntry = (index: number, field: string, value: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let count = 0;

    entries.forEach((entry) => {
      const readingVal = parseFloat(entry.currentReading);
      if (!isNaN(readingVal) && readingVal > 0) {
        const m = meters.find((meter) => meter.id === entry.meterId);
        if (m) {
          const res = addReading({
            blockId: m.blockId,
            meterId: m.id,
            readingDate: date,
            currentReading: readingVal,
            multiplier: m.multiplier,
            notes: entry.notes || 'Notebook log sheet',
          });
          if (res.success) count++;
        }
      }
    });

    setSubmittedCount(count);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Notebook Reading Digitizer</h3>
              <p className="text-xs text-slate-400">Quickly type in a full shift notebook sheet into digital records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedCount !== null ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Notebook Page Digitized!</h3>
            <p className="text-xs text-slate-400">
              Successfully recorded <strong>{submittedCount}</strong> meter readings with automatic consumption difference and live bill updates.
            </p>
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Close & View in Monitoring Section
            </button>
          </div>
        ) : (
          <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notebook Log Sheet Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-semibold">Tip:</span> Type numbers directly as seen in the physical notebook.
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry, idx) => {
                const targetMeter = meters.find((m) => m.id === entry.meterId);
                const block = blocks.find((b) => b.id === targetMeter?.blockId);
                const prev = targetMeter?.lastReadingValue || 0;
                const curr = parseFloat(entry.currentReading);
                const diff = !isNaN(curr) && curr >= prev ? (curr - prev) * (targetMeter?.multiplier || 1) : 0;

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={entry.meterId}
                          onChange={(e) => handleUpdateEntry(idx, 'meterId', e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold px-2 py-1 rounded text-xs"
                        >
                          {meters.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.meterNumber} - {m.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400">({block?.name})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Last in Notebook: <strong>{prev} kWh</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <input
                          type="number"
                          placeholder="Current Reading (kWh)"
                          value={entry.currentReading}
                          onChange={(e) => handleUpdateEntry(idx, 'currentReading', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-white font-mono text-sm font-bold focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[11px]">Diff:</span>
                        <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          +{diff} kWh
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20"
              >
                Save All Notebook Readings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
