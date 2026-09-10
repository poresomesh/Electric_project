import type { SharedCampusState } from './mergeState';
import { applyTombstones, mergeById, mergeNotifications } from './mergeState';

export type { SharedCampusState } from './mergeState';
export { applyTombstones, mergeById, mergeSharedState } from './mergeState';

function stateUrl(): string {
  return '/api/state';
}

export async function fetchSharedState(): Promise<SharedCampusState | null> {
  try {
    const res = await fetch(stateUrl(), { 
      cache: 'no-store',
      credentials: 'include', // महत्त्वाचे: सेशन कुकी पाठवण्यासाठी
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    if (data.error) return null;
    return data as SharedCampusState;
  } catch {
    return null;
  }
}

export async function saveSharedState(
  payload: Partial<SharedCampusState> & { version?: number }
): Promise<SharedCampusState | null> {
  try {
    const res = await fetch(stateUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // महत्त्वाचे: सेव्ह करताना 401 एरर न येण्यासाठी
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as SharedCampusState;
  } catch {
    return null;
  }
}

export function overlaySharedState(
  local: SharedCampusState,
  remote: SharedCampusState
): SharedCampusState {
  // जर सर्व्हरवर व्हर्जन किंवा डेटा असेल, तर क्लाउड डेटालाच थेट प्राधान्य द्या (मिश्रण करू नका)
  if (remote && (remote.version || 0) > 0) {
    return remote;
  }

  const deletedReadingIds = Array.from(
    new Set([...(local.deletedReadingIds || []), ...(remote.deletedReadingIds || [])])
  );
  const deletedMsebReadingIds = Array.from(
    new Set([...(local.deletedMsebReadingIds || []), ...(remote.deletedMsebReadingIds || [])])
  );
  const deletedNotificationIds = Array.from(
    new Set([...(local.deletedNotificationIds || []), ...(remote.deletedNotificationIds || [])])
  );
  const deletedUserIds = Array.from(new Set([...(local.deletedUserIds || []), ...(remote.deletedUserIds || [])]));
  return {
    version: Math.max(local.version || 0, remote.version || 0),
    users: applyTombstones(mergeById(local.users, remote.users), deletedUserIds),
    blocks: mergeById(local.blocks, remote.blocks),
    meters: mergeById(local.meters, remote.meters),
    readings: applyTombstones(mergeById(local.readings, remote.readings), deletedReadingIds),
    tariff: remote.tariff || local.tariff,
    msebBlocks: mergeById(local.msebBlocks, remote.msebBlocks),
    msebReadings: applyTombstones(mergeById(local.msebReadings, remote.msebReadings), deletedMsebReadingIds),
    msebTariffs: { ...(local.msebTariffs || {}), ...(remote.msebTariffs || {}) },
    deletedReadingIds,
    deletedMsebReadingIds,
    deletedNotificationIds,
    deletedUserIds,
    userPasswordPolicyVersion: remote.userPasswordPolicyVersion ?? local.userPasswordPolicyVersion ?? 0,
    dailyLimits: mergeById(local.dailyLimits || [], remote.dailyLimits || []),
    exceedances: mergeById(local.exceedances || [], remote.exceedances || []),
    notifications: applyTombstones(
      mergeNotifications(local.notifications || [], remote.notifications || []),
      deletedNotificationIds
    ),
  };
}