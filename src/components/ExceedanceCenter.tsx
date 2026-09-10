import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';

export const ExceedanceCenter: React.FC = () => {
  const {
    blocks,
    dailyLimits,
    exceedances,
    notifications,
    currentUser,
    isAdmin,
    isBlockIncharge,
    isDarkMode,
    updateDailyLimit,
    submitExceedanceRemark,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useEnergy();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [limitInputs, setLimitInputs] = useState<Record<string, string>>({});
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const unreadCount = notifications.filter((notification) => !notification.readByUserIds.includes(currentUser.id)).length;

  const blockName = (blockId: string) => blocks.find((block) => block.id === blockId)?.name || blockId;
  const years = useMemo(() => Array.from(new Set(exceedances.map((item) => item.readingDate.slice(0, 4)))).sort().reverse(), [exceedances]);
  const sortedExceedances = useMemo(() => [...exceedances]
    .filter((item) => blockFilter === 'ALL' || item.blockId === blockFilter)
    .filter((item) => !dateFilter || item.readingDate === dateFilter)
    .filter((item) => yearFilter === 'ALL' || item.readingDate.startsWith(yearFilter))
    .sort((a, b) => b.readingDate.localeCompare(a.readingDate)),
    [exceedances, blockFilter, dateFilter, yearFilter]);

  const surface = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      <div className={`${surface} rounded-2xl border p-5 shadow-sm`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <h1 className="text-xl font-bold">Daily Limit &amp; Exceedance Center</h1>
            </div>
            <p className={`mt-1 text-sm ${muted}`}>
              Daily block consumption is evaluated automatically from every meter reading.
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <Bell className="h-4 w-4" />
            {unreadCount} notification{unreadCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {isAdmin && (
        <section className={`${surface} rounded-2xl border p-5 shadow-sm`}>
          <h2 className="font-bold">Configured daily limits</h2>
          <p className={`mb-4 mt-1 text-xs ${muted}`}>Only administrators can change block policies.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {blocks.map((block) => {
              const limit = dailyLimits.find((item) => item.blockId === block.id)?.dailyLimitUnits || 0;
              const value = limitInputs[block.id] ?? String(limit);
              return (
                <div key={block.id} className={`rounded-xl border p-3 ${isDarkMode ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-2 text-sm font-semibold">{block.name}</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={value}
                      onChange={(event) => setLimitInputs((prev) => ({ ...prev, [block.id]: event.target.value }))}
                      className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
                    />
                    <button
                      onClick={() => {
                        if (updateDailyLimit(block.id, Number(value))) {
                          setLimitInputs((prev) => ({ ...prev, [block.id]: String(Number(value)) }));
                        }
                      }}
                      className="rounded-lg bg-cyan-600 px-2.5 text-white hover:bg-cyan-500"
                      title="Save limit"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  <div className={`mt-1 text-[11px] ${muted}`}>units / calendar day</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={`${surface} rounded-2xl border p-5 shadow-sm`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold">Exceedance records</h2>
            <p className={`mt-1 text-xs ${muted}`}>
              {isAdmin ? 'Administrator view: all blocks and responses.' : 'Your assigned block only.'}
            </p>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <select value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}>
            <option value="ALL">All blocks</option>
            {blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}
          </select>
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`} />
          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}>
            <option value="ALL">All years</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        {sortedExceedances.length === 0 ? (
          <div className={`rounded-xl border border-dashed p-8 text-center text-sm ${muted}`}>No daily limit exceedances detected.</div>
        ) : (
          <div className="space-y-3">
            {sortedExceedances.map((item) => (
              <div key={item.id} className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{blockName(item.blockId)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === 'responded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs ${muted}`}>{item.readingDate} · {item.consumedUnits.toLocaleString()} consumed vs {item.dailyLimitUnits.toLocaleString()} limit</div>
                    <div className="mt-2 text-sm font-bold text-amber-400">{item.excessUnits.toLocaleString()} excess units</div>
                  </div>
                  {isAdmin && item.remark && (
                    <div className={`rounded-lg border p-3 lg:w-72 ${isDarkMode ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-cyan-200 bg-cyan-50'}`}>
                      <div className={`text-[11px] font-bold uppercase ${muted}`}>Submitted reason</div>
                      <p className="mt-1 text-sm">{item.remark}</p>
                    </div>
                  )}
                  {isBlockIncharge && item.status !== 'responded' && (
                    <div className="flex w-full gap-2 lg:max-w-md">
                      <input
                        value={remarks[item.id] || ''}
                        onChange={(event) => setRemarks((prev) => ({ ...prev, [item.id]: event.target.value }))}
                        placeholder="Enter reason / corrective action"
                        className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
                      />
                      <button
                        onClick={() => {
                          if (submitExceedanceRemark(item.id, remarks[item.id] || '')) {
                            setRemarks((prev) => ({ ...prev, [item.id]: '' }));
                          }
                        }}
                        className="rounded-lg bg-cyan-600 px-3 text-sm font-semibold text-white hover:bg-cyan-500"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`${surface} rounded-2xl border p-5 shadow-sm`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="space-y-2">
          {notifications.length === 0 && <p className={`text-sm ${muted}`}>Notifications will appear as daily totals exceed a configured limit.</p>}
          {notifications.slice(0, 20).map((notification) => {
            const isRead = notification.readByUserIds.includes(currentUser.id);
            return (
            <div
                key={notification.id}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${isRead ? (isDarkMode ? 'border-slate-800 opacity-70' : 'border-slate-200 opacity-70') : (isDarkMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50')}`}
            >
              <button
                onClick={() => markNotificationRead(notification.id)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                {isRead ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /> : <Bell className="mt-0.5 h-4 w-4 text-amber-400" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{notification.title} · {blockName(notification.blockId)}</span>
                  <span className={`block text-xs ${muted}`}>{notification.readingDate} · {notification.message}</span>
                </span>
              </button>
              <button
                onClick={async () => { await deleteNotification(notification.id); }}
                className={`rounded-lg p-1.5 ${isDarkMode ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                title="Delete notification"
                aria-label={`Delete ${notification.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
          })}
        </div>
      </section>
    </div>
  );
};
