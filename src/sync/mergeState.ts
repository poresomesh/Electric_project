import type {
  Block,
  Meter,
  MeterReading,
  MsebBlock,
  MsebReading,
  MsebTariffConfig,
  TariffConfig,
  User,
  DailyLimitConfig,
  DailyExceedance,
  EnergyNotification,
} from '../types';

export interface SharedCampusState {
  version: number;
  users: User[];
  blocks: Block[];
  meters: Meter[];
  readings: MeterReading[];
  tariff: TariffConfig;
  msebBlocks: MsebBlock[];
  msebReadings: MsebReading[];
  msebTariffs: Record<string, MsebTariffConfig>;
  deletedReadingIds: string[];
  deletedMsebReadingIds: string[];
  deletedNotificationIds: string[];
  deletedUserIds: string[];
  dailyLimits: DailyLimitConfig[];
  exceedances: DailyExceedance[];
  notifications: EnergyNotification[];
  userPasswordPolicyVersion?: number;
}

export function mergeById<T extends { id: string }>(base: T[] = [], incoming: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of base) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of incoming) {
    if (item?.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function mergeNotifications(
  base: EnergyNotification[] = [],
  incoming: EnergyNotification[] = []
): EnergyNotification[] {
  const map = new Map<string, EnergyNotification>();
  for (const notification of base) {
    if (notification?.id) map.set(notification.id, notification);
  }
  for (const notification of incoming) {
    if (!notification?.id) continue;
    const existing = map.get(notification.id);
    map.set(notification.id, existing
      ? {
          ...existing,
          ...notification,
          readByUserIds: Array.from(new Set([
            ...(existing.readByUserIds || []),
            ...(notification.readByUserIds || []),
          ])),
        }
      : notification);
  }
  return Array.from(map.values());
}

export function applyTombstones<T extends { id: string }>(items: T[], deletedIds: string[] = []): T[] {
  if (!deletedIds.length) return items;
  const deleted = new Set(deletedIds);
  return items.filter((item) => !deleted.has(item.id));
}

export function mergeSharedState(
  current: SharedCampusState | null,
  incoming: Partial<SharedCampusState>
): SharedCampusState {
  const base: SharedCampusState = current || {
    version: 0,
    users: [],
    blocks: [],
    meters: [],
    readings: [],
    tariff: incoming.tariff as TariffConfig,
    msebBlocks: [],
    msebReadings: [],
    msebTariffs: {},
    deletedReadingIds: [],
    deletedMsebReadingIds: [],
    deletedNotificationIds: [],
    deletedUserIds: [],
    dailyLimits: [],
    exceedances: [],
    notifications: [],
    userPasswordPolicyVersion: 0,
  };

  const deletedReadingIds = Array.from(
    new Set([...(base.deletedReadingIds || []), ...(incoming.deletedReadingIds || [])])
  );
  const deletedMsebReadingIds = Array.from(
    new Set([...(base.deletedMsebReadingIds || []), ...(incoming.deletedMsebReadingIds || [])])
  );
  const deletedNotificationIds = Array.from(
    new Set([...(base.deletedNotificationIds || []), ...(incoming.deletedNotificationIds || [])])
  );
  const deletedUserIds = Array.from(new Set([...(base.deletedUserIds || []), ...(incoming.deletedUserIds || [])]));

  return {
    version: (base.version || 0) + 1,
    users: applyTombstones(incoming.users?.length ? mergeById(base.users, incoming.users) : base.users, deletedUserIds),
    blocks: incoming.blocks?.length ? mergeById(base.blocks, incoming.blocks) : base.blocks,
    meters: incoming.meters?.length ? mergeById(base.meters, incoming.meters) : base.meters,
    readings: applyTombstones(mergeById(base.readings, incoming.readings || []), deletedReadingIds),
    tariff: incoming.tariff || base.tariff,
    msebBlocks: incoming.msebBlocks?.length ? mergeById(base.msebBlocks, incoming.msebBlocks) : base.msebBlocks,
    msebReadings: applyTombstones(
      mergeById(base.msebReadings, incoming.msebReadings || []),
      deletedMsebReadingIds
    ),
    msebTariffs: { ...(base.msebTariffs || {}), ...(incoming.msebTariffs || {}) },
    deletedReadingIds,
    deletedMsebReadingIds,
    dailyLimits: incoming.dailyLimits?.length ? mergeById(base.dailyLimits, incoming.dailyLimits) : base.dailyLimits,
    exceedances: incoming.exceedances?.length ? mergeById(base.exceedances, incoming.exceedances) : base.exceedances,
    notifications: applyTombstones(
      incoming.notifications?.length ? mergeNotifications(base.notifications, incoming.notifications) : base.notifications,
      deletedNotificationIds
    ),
    deletedNotificationIds,
    deletedUserIds,
    userPasswordPolicyVersion: incoming.userPasswordPolicyVersion ?? base.userPasswordPolicyVersion ?? 0,
  };
}
