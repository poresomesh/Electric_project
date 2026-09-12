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
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    return data as SharedCampusState;
  } catch {
    return null;
  }
}

export async function saveSharedState(
  payload: Partial<SharedCampusState> & { version?: number }
): Promise<SharedCampusState | null> {
  try {
    // वर्तमान सर्व्हर स्टेट आणून व्हर्जन नंबर सुरक्षितपणे मॅनेज करणे
    const currentRemote = await fetchSharedState();
    const nextVersion = (currentRemote?.version || 0) + 1;

    const res = await fetch(stateUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...payload,
        version: nextVersion,
      }),
    });
    
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as SharedCampusState;
  } catch (err) {
    console.error('saveSharedState error:', err);
    return null;
  }
}

export function overlaySharedState(
  local: SharedCampusState,
  remote: SharedCampusState
): SharedCampusState {
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