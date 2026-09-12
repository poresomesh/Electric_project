import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Block,
  Meter,
  MeterReading,
  TariffConfig,
  User,
  BillCalculation,
  UserRole,
  ThemeMode,
  MsebBlock,
  MsebReading,
  MsebTariffConfig,
  MsebCustomCharge,
  MsebCostBreakdown,
  DailyLimitConfig,
  DailyExceedance,
  EnergyNotification,
} from '../types';
import { INITIAL_BLOCKS, INITIAL_METERS, INITIAL_READINGS, INITIAL_TARIFF, INITIAL_USERS } from '../data/initialData';
import { getTodayDateStr, getCurrentMonthStr, getCurrentYear, getPastNMonths } from '../utils/dateUtils';
import {
  fetchSharedState,
  overlaySharedState,
  saveSharedState,
  type SharedCampusState,
} from '../sync/sharedState';

interface EnergyContextType {
  isAuthenticated: boolean;
  currentUser: User;
  users: User[];
  blocks: Block[];
  allBlocks: Block[];
  meters: Meter[];
  allMeters: Meter[];
  readings: MeterReading[];
  allReadings: MeterReading[];
  tariff: TariffConfig;
  dailyLimits: DailyLimitConfig[];
  exceedances: DailyExceedance[];
  allExceedances: DailyExceedance[];
  notifications: EnergyNotification[];
  updateDailyLimit: (blockId: string, dailyLimitUnits: number) => boolean;
  submitExceedanceRemark: (exceedanceId: string, remark: string) => boolean;
  markNotificationRead: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  markAllNotificationsRead: () => void;

  // MSEB Separate Infrastructure & Billing
  msebBlocks: MsebBlock[];
  msebReadings: MsebReading[];
  msebTariff: MsebTariffConfig;
  getMsebTariff: (blockId: string) => MsebTariffConfig;
  updateMsebBlock: (id: string, updates: Partial<MsebBlock>) => void;
  addMsebReading: (reading: {
    msebBlockId: string;
    readingDate: string;
    readingTime?: string;
    meterNumber?: string;
    previousReadingKwh: number;
    currentReadingKwh: number;
    previousReadingKvah?: number;
    currentReadingKvah?: number;
    multiplier?: number;
    notes?: string;
  }) => Promise<{ success: boolean; unitsConsumedKwh: number; cost: number; message: string }>;
  deleteMsebReading: (id: string) => boolean;
  clearAllMsebReadings: (blockId?: string) => void;
  updateMsebTariff: (tariff: MsebTariffConfig) => void;
  updateMsebTariffForBlock: (blockId: string, tariff: MsebTariffConfig) => void;
  addMsebCustomCharge: (blockId: string, charge: Omit<MsebCustomCharge, 'id'>) => void;
  deleteMsebCustomCharge: (blockId: string, chargeId: string) => void;
  calculateMsebBillBreakdown: (blockId: string, units: number, demandKva?: number) => MsebCostBreakdown;

  // Theme & Appearance
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Role & Permissions
  isAdmin: boolean;
  isBlockIncharge: boolean;
  isViewer: boolean;
  userAssignedBlock: Block | null;
  canEnterReading: (blockId?: string) => boolean;
  canManageUsers: boolean;
  canEditTariff: boolean;

  // Auth actions
  login: (username: string, pass?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (user: Omit<User, 'id'> & { id?: string; password?: string }) => void;
  updateUser: (id: string, user: Partial<User> & { newId?: string }) => void;
  deleteUser: (id: string) => boolean;
  assignBlockCredentials: (
    blockId: string,
    credentials: {
      userId?: string;
      username: string;
      password: string;
      name?: string;
      phone?: string;
      designation?: string;
    }
  ) => Promise<{ success: boolean; message: string }>;

  // Reading actions
  addReading: (reading: {
    blockId: string;
    meterId: string;
    readingDate: string;
    readingTime?: string;
    previousReading?: number;
    currentReading: number;
    multiplier?: number;
    notes?: string;
    previousKvah?: number;
    currentKvah?: number;
    voltageRms?: number;
    powerFactor?: number;
    peakDemandKw?: number;
  }) => Promise<{ success: boolean; unitsConsumed: number; message: string; newReading?: MeterReading }>;
  addBatchReadings: (readingsList: Array<{
    blockId: string;
    meterId: string;
    readingDate: string;
    readingTime?: string;
    previousReading: number;
    currentReading: number;
    multiplier?: number;
    notes?: string;
    previousKvah?: number;
    currentKvah?: number;
    voltageRms?: number;
    powerFactor?: number;
    peakDemandKw?: number;
  }>) => Promise<{ success: boolean; count: number; totalUnits: number; message: string }>;
  deleteReading: (id: string) => boolean;
  deleteAllReadings: () => boolean;

  // Meter & Block actions
  addMeter: (meter: Omit<Meter, 'id' | 'lastReadingDate' | 'lastReadingValue'> & { initialReading: number; initialDate: string }) => void;
  updateMeter: (id: string, updates: Partial<Meter>) => void;
  deleteMeter: (id: string) => boolean;
  addBlock: (block: Omit<Block, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => boolean;
  updateTariff: (newTariff: TariffConfig) => void;

  // Calculations & Analytics
  calculateBill: (params: { blockId?: string; periodType: 'day' | 'week' | 'month' | 'year'; referenceDate?: string }) => BillCalculation;
  getDayWiseData: (blockId?: string, date?: string) => Array<{ time: string; units: number; kw: number; label: string }>;
  getWeekWiseData: (blockId?: string, referenceDate?: string) => Array<{ day: string; date: string; units: number; cost: number }>;
  getMonthWiseData: (blockId?: string, referenceDate?: string) => Array<{ period: string; units: number; cost: number; target: number }>;
  getYearWiseData: (blockId?: string, year?: number) => Array<{ month: string; shortMonth: string; units: number; bill: number }>;
  getBillComparison: (blockId?: string) => {
    monthlyList: Array<{ month: string; shortMonth: string; bill: number; units: number }>;
    currentMonthVsPrevMonth: { diffAmount: number; diffPercent: number; isIncrease: boolean; currentBill: number; prevBill: number; currentLabel: string; prevLabel: string };
    currentMonthVsPrevYear: { diffAmount: number; diffPercent: number; isIncrease: boolean; currentBill: number; prevYearBill: number; currentLabel: string; prevYearLabel: string };
  };

  // Utilities
  resetToDefaults: () => void;
  exportDatabaseJson: () => string;
  syncStatus: 'cloud' | 'local' | 'connecting' | 'error';
  lastSyncedAt: Date | null;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'voltwise_energy_';

const normalizeBlockStr = (val?: string) => {
  if (!val) return '';
  return val.toLowerCase().replace(/^(block|blk)[_-]/, '').trim();
};

export const EnergyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('voltwise_theme') as ThemeMode;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
      return saved;
    }
    return 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = useMemo(() => {
    if (theme === 'system') return systemPrefersDark;
    return theme === 'dark';
  }, [theme, systemPrefersDark]);

  useEffect(() => {
    localStorage.setItem('voltwise_theme', theme);
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme, isDarkMode]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    let list = INITIAL_USERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return list;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return INITIAL_USERS.find((user) => user.role === 'viewer') || INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as { user?: User };
        if (data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const [blocks, setBlocks] = useState<Block[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}blocks`);
    const initial = saved ? JSON.parse(saved) : INITIAL_BLOCKS;
    return (initial as Block[]).filter(
      (b) =>
        b.name?.trim().toLowerCase() !== 'e block' &&
        b.name?.trim().toLowerCase() !== 'block e' &&
        b.name?.trim().toLowerCase() !== 'e' &&
        b.code?.trim().toUpperCase() !== 'BLK-E' &&
        b.id !== 'block-e'
    );
  });

  const [meters, setMeters] = useState<Meter[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}meters`) || localStorage.getItem('voltwise_meters');
    return saved ? JSON.parse(saved) : INITIAL_METERS;
  });

  const [readings, setReadings] = useState<MeterReading[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}readings`) || localStorage.getItem('voltwise_readings');
    return saved ? JSON.parse(saved) : INITIAL_READINGS;
  });

  const [dailyLimits, setDailyLimits] = useState<DailyLimitConfig[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}daily_limits`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        console.error('Failed to parse daily limit configuration', error);
      }
    }
    return [
      { id: 'limit-block-a', blockId: 'block-a', dailyLimitUnits: 200, effectiveFrom: getTodayDateStr(), updatedAt: new Date().toISOString(), updatedBy: 'system' },
      { id: 'limit-block-b', blockId: 'block-b', dailyLimitUnits: 250, effectiveFrom: getTodayDateStr(), updatedAt: new Date().toISOString(), updatedBy: 'system' },
      { id: 'limit-block-c', blockId: 'block-c', dailyLimitUnits: 180, effectiveFrom: getTodayDateStr(), updatedAt: new Date().toISOString(), updatedBy: 'system' },
      { id: 'limit-block-d', blockId: 'block-d', dailyLimitUnits: 180, effectiveFrom: getTodayDateStr(), updatedAt: new Date().toISOString(), updatedBy: 'system' },
    ];
  });

  const [exceedances, setExceedances] = useState<DailyExceedance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}exceedances`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        console.error('Failed to parse daily exceedance records', error);
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<EnergyNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        console.error('Failed to parse energy notifications', error);
      }
    }
    return [];
  });

  const [tariff, setTariff] = useState<TariffConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tariff`);
    return saved ? JSON.parse(saved) : INITIAL_TARIFF;
  });

  const DEFAULT_MSEB_BLOCKS: MsebBlock[] = [
    {
      id: 'mseb-block-1',
      name: 'MSEB Block 1',
      code: 'MSEB-01',
      consumerNumber: '081290345671',
      meterNumber: 'MTR-MSEB-101',
      contractDemandKva: 250,
      sanctionedLoadKw: 200,
      color: '#06b6d4',
    },
    {
      id: 'mseb-block-2',
      name: 'MSEB Block 2',
      code: 'MSEB-02',
      consumerNumber: '081290345672',
      meterNumber: 'MTR-MSEB-102',
      contractDemandKva: 250,
      sanctionedLoadKw: 200,
      color: '#3b82f6',
    },
  ];

  const DEFAULT_MSEB_TARIFFS: Record<string, MsebTariffConfig> = {
    'mseb-block-1': {
      baseRatePerUnit: 8.50,
      demandChargePerKva: 450,
      wheelingChargePerUnit: 1.25,
      facPercent: 3.5,
      electricityDutyPercent: 9.3,
      toseTaxPerUnit: 0.15,
      customCharges: [
        {
          id: 'cc-reg-asset-1',
          name: 'Regulatory Asset Surcharge',
          type: 'per_unit',
          value: 0.25,
          description: 'MERC regulatory asset recovery'
        }
      ],
      currencySymbol: '₹',
      billingType: 'kwh',
    },
    'mseb-block-2': {
      baseRatePerUnit: 8.90,
      demandChargePerKva: 480,
      wheelingChargePerUnit: 1.25,
      facPercent: 3.8,
      electricityDutyPercent: 9.3,
      toseTaxPerUnit: 0.15,
      customCharges: [
        {
          id: 'cc-green-cess-2',
          name: 'Green Energy Cess',
          type: 'per_unit',
          value: 0.12,
          description: 'Renewable development cess'
        }
      ],
      currencySymbol: '₹',
      billingType: 'kwh',
    },
  };

  const [msebBlocks, setMsebBlocks] = useState<MsebBlock[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mseb_blocks`);
    return saved ? JSON.parse(saved) : DEFAULT_MSEB_BLOCKS;
  });

  const [msebReadings, setMsebReadings] = useState<MsebReading[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mseb_readings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => !r.id.startsWith('mseb-rd-init'));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [msebTariffs, setMsebTariffs] = useState<Record<string, MsebTariffConfig>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mseb_tariffs_by_block`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_MSEB_TARIFFS;
  });

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}users`,
      JSON.stringify(users.map(({ password: _password, ...safeUser }) => safeUser))
    );
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}blocks`, JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}meters`, JSON.stringify(meters));
    localStorage.setItem('voltwise_meters', JSON.stringify(meters));
  }, [meters]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}readings`, JSON.stringify(readings));
    localStorage.setItem('voltwise_readings', JSON.stringify(readings));
  }, [readings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}daily_limits`, JSON.stringify(dailyLimits));
  }, [dailyLimits]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}exceedances`, JSON.stringify(exceedances));
  }, [exceedances]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tariff`, JSON.stringify(tariff));
  }, [tariff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}mseb_blocks`, JSON.stringify(msebBlocks));
  }, [msebBlocks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}mseb_readings`, JSON.stringify(msebReadings));
  }, [msebReadings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}mseb_tariffs_by_block`, JSON.stringify(msebTariffs));
  }, [msebTariffs]);

  const [deletedReadingIds, setDeletedReadingIds] = useState<string[]>([]);
  const [deletedMsebReadingIds, setDeletedMsebReadingIds] = useState<string[]>([]);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}deleted_notification_ids`);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch (error) {
      return [];
    }
  });
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'cloud' | 'local' | 'connecting' | 'error'>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const lastSeenVersionRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}deleted_notification_ids`, JSON.stringify(deletedNotificationIds));
  }, [deletedNotificationIds]);

  // Initial Load from Cloud DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchSharedState();
      if (cancelled) return;
      if (remote) {
        lastSeenVersionRef.current = remote.version || 0;
        if (remote.users && remote.users.length > 0) setUsers(remote.users);
        if (remote.blocks && remote.blocks.length > 0) setBlocks(remote.blocks);
        if (remote.readings && remote.readings.length > 0) setReadings(remote.readings);
        if (remote.meters && remote.meters.length > 0) setMeters(remote.meters);
        setLastSyncedAt(new Date());
        setSyncStatus('cloud');
      }
      setSyncReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const isBlockIncharge = currentUser.role === 'block_incharge';
  const isViewer = currentUser.role === 'viewer';

  const userAssignedBlock = useMemo(() => {
    if (!currentUser.assignedBlockId || currentUser.assignedBlockId === 'ALL') return null;
    const norm = normalizeBlockStr(currentUser.assignedBlockId);
    return blocks.find((b) => b.id === currentUser.assignedBlockId || normalizeBlockStr(b.id) === norm || normalizeBlockStr(b.code) === norm) || null;
  }, [currentUser, blocks]);

  const canEnterReading = (blockId?: string) => {
    if (isAdmin) return true;
    if (isBlockIncharge) {
      if (!blockId) return true;
      const bNorm = normalizeBlockStr(blockId);
      const uNorm = normalizeBlockStr(currentUser.assignedBlockId);
      return bNorm === uNorm || currentUser.assignedBlockId === blockId;
    }
    return false;
  };

  const canManageUsers = isAdmin;
  const canEditTariff = isAdmin;

  const login = async (username: string, pass?: string): Promise<boolean> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: username.trim(), password: (pass || '').trim() }),
    });
    if (!response.ok) return false;
    const data = await response.json() as { user?: User };
    if (!data.user) return false;
    setCurrentUser(data.user);
    setIsAuthenticated(true);
    const remote = await fetchSharedState();
    if (remote?.readings?.length) {
      setReadings(remote.readings);
      setLastSyncedAt(new Date());
    }
    return true;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setCurrentUser(INITIAL_USERS.find((user) => user.role === 'viewer') || INITIAL_USERS[0]);
  };

  // अचूक आणि काटेकोर आयडी मॅचिंग लॉजिक (नवीन नावांच्या ब्लॉकमध्ये जुना डेटा जाणे रोखण्यासाठी)
  const visibleBlocks = useMemo(() => {
    if (isAdmin || isViewer) return blocks;

    const uBlockId = (currentUser.assignedBlockId || '').toLowerCase().trim();
    const uid = (currentUser.id || '').toLowerCase().trim();
    const uname = (currentUser.username || '').toLowerCase().trim();
    
    const matched = blocks.filter((b) => {
      const bId = (b.id || '').toLowerCase().trim();
      const bCode = (b.code || '').toLowerCase().trim();
      const bInchargeId = (b.inchargeId || '').toLowerCase().trim();
      
      return (
        bId === uBlockId ||
        bCode === uBlockId ||
        bInchargeId === uid ||
        bInchargeId === uname
      );
    });

    if (matched.length > 0) return matched;

    if (uBlockId && uBlockId !== 'all') {
      const found = blocks.find(b => b.id.toLowerCase().trim() === uBlockId || b.code.toLowerCase().trim() === uBlockId);
      if (found) return [found];
    }

    return blocks.length > 0 ? [blocks[0]] : [];
  }, [blocks, isAdmin, isViewer, currentUser]);

  const visibleMeters = useMemo(() => {
    if (isAdmin || isViewer) return meters;
    const allowedBlockIds = new Set(visibleBlocks.map((b) => b.id.toLowerCase()));
    return meters.filter((m) => allowedBlockIds.has((m.blockId || '').toLowerCase()));
  }, [meters, visibleBlocks, isAdmin, isViewer]);

  const visibleReadings = useMemo(() => {
    let list = readings;
    if (!isAdmin && !isViewer) {
      const allowedBlockIds = new Set(visibleBlocks.map(b => b.id.toLowerCase()));
      const allowedBlockCodes = new Set(visibleBlocks.map(b => (b.code || '').toLowerCase()));
      
      list = readings.filter((r) => {
        const rBlock = (r.blockId || '').toLowerCase();
        return allowedBlockIds.has(rBlock) || allowedBlockCodes.has(rBlock);
      });
    }

    return [...list].sort((a, b) => {
      const dateCmp = (b.readingDate || '').localeCompare(a.readingDate || '');
      if (dateCmp !== 0) return dateCmp;
      const timeCmp = (b.readingTime || '').localeCompare(a.readingTime || '');
      if (timeCmp !== 0) return timeCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [readings, isAdmin, isViewer, visibleBlocks]);

  const visibleExceedances = useMemo(() => {
    if (isAdmin || isViewer || !currentUser.assignedBlockId || currentUser.assignedBlockId === 'ALL') {
      return exceedances;
    }
    const targetNorm = normalizeBlockStr(currentUser.assignedBlockId);
    return exceedances.filter((item) => normalizeBlockStr(item.blockId) === targetNorm);
  }, [exceedances, isAdmin, isViewer, currentUser.assignedBlockId]);

  const visibleDailyLimits = useMemo(() => {
    if (isAdmin || isViewer || !currentUser.assignedBlockId || currentUser.assignedBlockId === 'ALL') {
      return dailyLimits;
    }
    const targetNorm = normalizeBlockStr(currentUser.assignedBlockId);
    return dailyLimits.filter((limit) => normalizeBlockStr(limit.blockId) === targetNorm);
  }, [dailyLimits, isAdmin, isViewer, currentUser.assignedBlockId]);

  const visibleNotifications = useMemo(() => {
    if (isAdmin || isViewer || !currentUser.assignedBlockId || currentUser.assignedBlockId === 'ALL') {
      return notifications;
    }
    const targetNorm = normalizeBlockStr(currentUser.assignedBlockId);
    return notifications.filter((notification) =>
      notification.userId ? notification.userId === currentUser.id : normalizeBlockStr(notification.blockId) === targetNorm
    );
  }, [notifications, isAdmin, isViewer, currentUser]);

  const updateDailyLimit = (blockId: string, dailyLimitUnits: number): boolean => {
    if (!isAdmin || !Number.isFinite(dailyLimitUnits) || dailyLimitUnits <= 0) {
      return false;
    }
    const now = new Date().toISOString();
    setDailyLimits((prev) => {
      const existing = prev.find((limit) => limit.blockId === blockId);
      const updated = existing
        ? prev.map((limit) =>
          limit.blockId === blockId
            ? { ...limit, dailyLimitUnits, effectiveFrom: getTodayDateStr(), updatedAt: now, updatedBy: currentUser.id }
            : limit
        )
        : [...prev, {
          id: `limit-${blockId}`,
          blockId,
          dailyLimitUnits,
          effectiveFrom: getTodayDateStr(),
          updatedAt: now,
          updatedBy: currentUser.id,
        }];
      saveSharedState({ dailyLimits: updated });
      return updated;
    });
    return true;
  };

  const submitExceedanceRemark = (exceedanceId: string, remark: string): boolean => {
    const cleanRemark = remark.trim();
    const target = exceedances.find((item) => item.id === exceedanceId);
    if (!target || !cleanRemark || !canEnterReading(target.blockId)) {
      return false;
    }
    const adminUser = users.find((user) => user.role === 'admin');
    const submittedAt = new Date().toISOString();
    const updatedExceedances = exceedances.map((item) => item.id === exceedanceId
      ? { ...item, remark: cleanRemark, respondedBy: currentUser.id, respondedAt: submittedAt, status: 'responded' as const }
      : item);
    setExceedances(updatedExceedances);
    saveSharedState({ exceedances: updatedExceedances });

    setNotifications((prev) => {
      const notificationId = `remark-${exceedanceId}`;
      if (prev.some((notification) => notification.id === notificationId)) return prev;
      const updatedNotifs = [{
        id: notificationId,
        userId: adminUser?.id,
        type: 'exceedance_remark_submitted' as const,
        exceedanceId,
        blockId: target.blockId,
        readingDate: target.readingDate,
        title: 'Exceedance reason submitted',
        message: `${blocks.find((block) => block.id === target.blockId)?.name || target.blockId} submitted a reason for the ${target.readingDate} limit exceedance.`,
        createdAt: submittedAt,
        readByUserIds: [],
      }, ...prev];
      saveSharedState({ notifications: updatedNotifs });
      return updatedNotifs;
    });
    return true;
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notification) => {
      if (notification.id !== notificationId || notification.readByUserIds.includes(currentUser.id)) return notification;
      return { ...notification, readByUserIds: [...notification.readByUserIds, currentUser.id] };
    }));
  };

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) return false;
    setDeletedNotificationIds((prev) => (prev.includes(notificationId) ? prev : [...prev, notificationId]));
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    return true;
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((notification) => (
      notification.readByUserIds.includes(currentUser.id)
        ? notification
        : { ...notification, readByUserIds: [...notification.readByUserIds, currentUser.id] }
    )));
  };

  const addUser = (userData: Omit<User, 'id'> & { id?: string; password?: string }) => {
    if (currentUser.role !== 'admin') return;
    const cleanId = userData.id?.trim() || `usr-${Date.now().toString(36)}`;
    if (users.some((user) => user.id === cleanId || user.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return;
    }
    if (userData.role === 'admin') return;
    const newUser: User = {
      ...userData,
      id: cleanId,
      password: userData.password?.trim() || 'SOL@13',
      passwordConfigured: true,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveSharedState({ users: updatedUsers });
  };

  const updateUser = async (id: string, updates: Partial<User> & { newId?: string }) => {
    if (currentUser.role !== 'admin') return;
    const targetId = updates.newId?.trim() || updates.id || id;
    const existing = users.find((user) => user.id === id);
    if (!existing || existing.role === 'admin') return;
    if (users.some((user) => user.id !== id && (user.id === targetId || user.username.toLowerCase() === String(updates.username || existing.username).trim().toLowerCase()))) {
      return;
    }
    if (updates.role === 'admin') return;

    const updatedUsers = users.map((u) => (u.id === id ? { ...u, ...updates, id: targetId } : u));
    const updatedBlocks = blocks.map((b) =>
      b.inchargeId === id || b.inchargeId === targetId
        ? { ...b, inchargeId: targetId, inchargeName: updates.name || b.inchargeName }
        : b
    );

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(updatedUsers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}blocks`, JSON.stringify(updatedBlocks));
    } catch (e) {}

    setUsers(updatedUsers);
    setBlocks(updatedBlocks);

    try {
      const saved = await saveSharedState({
        users: updatedUsers,
        blocks: updatedBlocks,
        version: lastSeenVersionRef.current + 1,
      });

      if (saved?.version) {
        lastSeenVersionRef.current = saved.version;
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to sync updateUser to cloud:', err);
    }

    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates, id: targetId }));
    }
  };

  const assignBlockCredentials = async (
    blockId: string,
    credentials: {
      userId?: string;
      username: string;
      password: string;
      name?: string;
      phone?: string;
      designation?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'admin') {
      return Promise.resolve({ success: false, message: 'Only Administrator can assign credentials to blocks.' });
    }

    const targetBlock = blocks.find((b) => b.id === blockId);
    if (!targetBlock) {
      return Promise.resolve({ success: false, message: 'Specified block does not exist.' });
    }

    const cleanUsername = credentials.username.trim();
    const cleanPassword = credentials.password.trim();
    if (!cleanUsername || !cleanPassword) {
      return Promise.resolve({ success: false, message: 'Username and Password cannot be empty.' });
    }

    const existingIncharge = users.find(
      (u) =>
        (targetBlock.inchargeId && u.id === targetBlock.inchargeId) ||
        (u.assignedBlockId === blockId && u.role === 'block_incharge')
    );

    const assignedId = credentials.userId?.trim() || existingIncharge?.id || `usr-incharge-${blockId.replace('block-', '')}`;
    const assignedName = credentials.name?.trim() || existingIncharge?.name || `${targetBlock.name} In-Charge`;
    const assignedPhone = credentials.phone?.trim() || existingIncharge?.phone || '+91 98111 22233';
    const assignedDesignation = credentials.designation?.trim() || existingIncharge?.designation || `${targetBlock.name} In-Charge`;

    const usernameClash = users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== existingIncharge?.id && u.id !== assignedId
    );
    if (usernameClash) {
      return Promise.resolve({
        success: false,
        message: `Username "${cleanUsername}" is already assigned to "${usernameClash.name}". Please pick a unique username.`,
      });
    }

    const nextUsers = existingIncharge
      ? users.map((u) => u.id === existingIncharge.id
        ? { ...u, id: assignedId, username: cleanUsername, password: cleanPassword, name: assignedName, phone: assignedPhone, designation: assignedDesignation, assignedBlockId: blockId }
        : u)
      : [...users, {
        id: assignedId,
        username: cleanUsername,
        password: cleanPassword,
        passwordConfigured: true,
        name: assignedName,
        role: 'block_incharge' as const,
        assignedBlockId: blockId,
        email: `${cleanUsername.toLowerCase()}@company.com`,
        phone: assignedPhone,
        department: `${targetBlock.name} Operations`,
        designation: assignedDesignation,
      }];
    const nextBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, inchargeId: assignedId, inchargeName: assignedName } : b
    );

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(nextUsers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}blocks`, JSON.stringify(nextBlocks));
    } catch (e) {}

    setUsers(nextUsers);
    setBlocks(nextBlocks);

    try {
      const saved = await saveSharedState({
        users: nextUsers,
        blocks: nextBlocks,
        version: lastSeenVersionRef.current + 1,
      });
      if (saved && saved.version) {
        lastSeenVersionRef.current = saved.version;
        setLastSyncedAt(new Date());
      }
    } catch (syncErr) {
      console.error('Failed to sync credentials to cloud:', syncErr);
    }

    return Promise.resolve({
      success: true,
      message: `ID "${assignedId}", Username "${cleanUsername}", and Password successfully assigned to ${targetBlock.name}!`,
    });
  };

  const deleteUser = (id: string) => {
    if (currentUser.role !== 'admin') return false;
    if (users.length <= 1) return false;
    
    const updatedUsers = users.filter((u) => u.id !== id);
    const updatedDeletedIds = deletedUserIds.includes(id) ? deletedUserIds : [...deletedUserIds, id];

    setUsers(updatedUsers);
    setDeletedUserIds(updatedDeletedIds);

    void fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });

    void saveSharedState({
      users: updatedUsers,
      deletedUserIds: updatedDeletedIds,
    });

    setBlocks((prev) =>
      prev.map((b) => (b.inchargeId === id ? { ...b, inchargeId: undefined, inchargeName: 'Unassigned' } : b))
    );
    if (currentUser.id === id) {
      if (updatedUsers.length > 0) {
        setCurrentUser(updatedUsers[0]);
      }
    }
    return true;
  };

  const addReading = async ({
    blockId,
    meterId,
    readingDate,
    readingTime = '08:00',
    previousReading: explicitPrev,
    currentReading,
    multiplier = 1,
    notes = '',
    previousKvah: explicitPrevKvah,
    currentKvah,
    voltageRms = 415,
    powerFactor = 0.95,
    peakDemandKw,
  }: {
    blockId: string;
    meterId: string;
    readingDate: string;
    readingTime?: string;
    previousReading?: number;
    currentReading: number;
    multiplier?: number;
    notes?: string;
    previousKvah?: number;
    currentKvah?: number;
    voltageRms?: number;
    powerFactor?: number;
    peakDemandKw?: number;
  }) => {
    const targetMeter = meters.find((m) => m.id === meterId);
    const meterMultiplier = multiplier !== undefined && !isNaN(multiplier) && multiplier > 0 ? multiplier : (targetMeter?.multiplier || 1);
    const meterNumber = targetMeter?.meterNumber || 'MTR-001';

    let prev = 0;
    if (explicitPrev !== undefined && !isNaN(explicitPrev)) {
      prev = explicitPrev;
    } else {
      const pastReadings = readings
        .filter((r) => r.meterId === meterId && r.readingDate <= readingDate)
        .sort((a, b) => b.readingDate.localeCompare(a.readingDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (pastReadings.length > 0) {
        prev = pastReadings[0].currentReading;
      } else if (targetMeter && targetMeter.lastReadingValue > 0) {
        prev = targetMeter.lastReadingValue;
      }
    }

    if (currentReading < prev && prev > 0) {
      return {
        success: false,
        unitsConsumed: 0,
        message: `Current kWh reading (${currentReading}) cannot be less than previous reading (${prev}).`,
      };
    }

    const unitsConsumed = (currentReading - prev) * meterMultiplier;

    let prevKvahVal = explicitPrevKvah !== undefined ? explicitPrevKvah : 0;
    if (explicitPrevKvah === undefined && currentKvah !== undefined) {
      const pastKvah = readings
        .filter((r) => r.meterId === meterId && r.currentKvah !== undefined && r.readingDate <= readingDate)
        .sort((a, b) => b.readingDate.localeCompare(a.readingDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (pastKvah.length > 0 && pastKvah[0].currentKvah !== undefined) {
        prevKvahVal = pastKvah[0].currentKvah;
      }
    }

    const kvahConsumed = currentKvah !== undefined ? Math.max(0, (currentKvah - prevKvahVal) * meterMultiplier) : undefined;
    let calculatedPf = powerFactor;
    if (currentKvah !== undefined && kvahConsumed && kvahConsumed > 0 && unitsConsumed > 0) {
      calculatedPf = Math.min(1.0, +(unitsConsumed / kvahConsumed).toFixed(3));
    }

    const newReading: MeterReading = {
      id: `rdg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      blockId,
      meterId,
      meterNumber,
      readingDate,
      readingTime,
      previousReading: prev,
      currentReading,
      unitsConsumed,
      multiplier: meterMultiplier,
      enteredBy: currentUser.id,
      enteredByName: currentUser.name,
      notes,
      previousKvah: currentKvah !== undefined ? prevKvahVal : undefined,
      currentKvah,
      kvahConsumed,
      voltageRms,
      powerFactor: calculatedPf,
      peakDemandKw: peakDemandKw || +(unitsConsumed / 8).toFixed(1),
      createdAt: new Date().toISOString(),
    };

    const updatedReadings = [newReading, ...readings];
    const updatedMeters = meters.map((m) =>
      m.id === meterId
        ? {
            ...m,
            multiplier: meterMultiplier,
            lastReadingDate: readingDate,
            lastReadingValue: currentReading,
          }
        : m
    );

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}readings`, JSON.stringify(updatedReadings));
      localStorage.setItem('voltwise_readings', JSON.stringify(updatedReadings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}meters`, JSON.stringify(updatedMeters));
      localStorage.setItem('voltwise_meters', JSON.stringify(updatedMeters));
    } catch (e) {}

    setReadings(updatedReadings);
    setMeters(updatedMeters);

    try {
      const saved = await saveSharedState({
        readings: updatedReadings,
        meters: updatedMeters,
        version: lastSeenVersionRef.current + 1,
      });
      if (saved && saved.version) {
        lastSeenVersionRef.current = saved.version;
        setLastSyncedAt(new Date());
        setSyncStatus('cloud');
      }
    } catch (syncErr) {
      console.error('Failed to sync reading to server database:', syncErr);
    }

    return {
      success: true,
      unitsConsumed,
      message: `Reading recorded successfully: ${unitsConsumed.toLocaleString()} kWh units consumed!`,
      newReading,
    };
  };

  const addBatchReadings = async (
    readingsList: Array<{
      blockId: string;
      meterId: string;
      readingDate: string;
      readingTime?: string;
      previousReading: number;
      currentReading: number;
      multiplier?: number;
      notes?: string;
      previousKvah?: number;
      currentKvah?: number;
      voltageRms?: number;
      powerFactor?: number;
      peakDemandKw?: number;
    }>
  ) => {
    if (!readingsList || readingsList.length === 0) {
      return { success: false, count: 0, totalUnits: 0, message: 'No reading records provided' };
    }

    const createdReadings: MeterReading[] = [];
    let sumUnits = 0;
    const latestMeterUpdates = new Map<string, { date: string; value: number; multiplier?: number }>();

    for (let idx = 0; idx < readingsList.length; idx++) {
      const item = readingsList[idx];
      const meter = meters.find((m) => m.id === item.meterId);
      const mult = item.multiplier || meter?.multiplier || 1;
      const unitsConsumed = Math.max(0, (item.currentReading - item.previousReading) * mult);
      sumUnits += unitsConsumed;

      const kvahConsumed =
        item.currentKvah !== undefined && item.previousKvah !== undefined
          ? Math.max(0, (item.currentKvah - item.previousKvah) * mult)
          : undefined;

      let calcPf = item.powerFactor || 0.95;
      if (kvahConsumed && kvahConsumed > 0 && unitsConsumed > 0) {
        calcPf = Math.min(1.0, +(unitsConsumed / kvahConsumed).toFixed(2));
      }

      const newReading: MeterReading = {
        id: `rdg-batch-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        blockId: item.blockId,
        meterId: item.meterId,
        meterNumber: meter?.meterNumber || 'MTR-001',
        readingDate: item.readingDate,
        readingTime: item.readingTime || '08:00',
        previousReading: item.previousReading,
        currentReading: item.currentReading,
        multiplier: mult,
        unitsConsumed,
        enteredBy: currentUser.id,
        enteredByName: currentUser.name,
        notes: item.notes || 'Manual historical batch entry',
        previousKvah: item.previousKvah,
        currentKvah: item.currentKvah,
        kvahConsumed,
        voltageRms: item.voltageRms || 415,
        powerFactor: calcPf,
        peakDemandKw: item.peakDemandKw || +(unitsConsumed / 8).toFixed(1),
        createdAt: new Date().toISOString(),
      };

      createdReadings.push(newReading);
      const existing = latestMeterUpdates.get(item.meterId);
      if (!existing || item.readingDate >= existing.date) {
        latestMeterUpdates.set(item.meterId, { date: item.readingDate, value: item.currentReading, multiplier: mult });
      }
    }

    const updatedReadings = [...createdReadings, ...readings];
    const updatedMeters = meters.map((m) => {
      const update = latestMeterUpdates.get(m.id);
      return update ? { ...m, multiplier: update.multiplier || m.multiplier, lastReadingDate: update.date, lastReadingValue: update.value } : m;
    });

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}readings`, JSON.stringify(updatedReadings));
      localStorage.setItem('voltwise_readings', JSON.stringify(updatedReadings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}meters`, JSON.stringify(updatedMeters));
      localStorage.setItem('voltwise_meters', JSON.stringify(updatedMeters));
    } catch (e) {}

    setReadings(updatedReadings);
    setMeters(updatedMeters);

    await saveSharedState({
      readings: updatedReadings,
      meters: updatedMeters,
      version: lastSeenVersionRef.current + 1,
    });

    return {
      success: true,
      count: createdReadings.length,
      totalUnits: sumUnits,
      message: `Successfully saved ${createdReadings.length} historical readings (${sumUnits.toLocaleString()} kWh total units)!`,
    };
  };

  const deleteReading = (id: string) => {
    const updated = readings.filter((r) => r.id !== id);
    const updatedDeleted = [...deletedReadingIds, id];
    setDeletedReadingIds(updatedDeleted);
    setReadings(updated);
    saveSharedState({ readings: updated, deletedReadingIds: updatedDeleted });
    return true;
  };

  const deleteAllReadings = () => {
    if (currentUser.role !== 'admin') return false;
    const allIds = readings.map((r) => r.id);
    setDeletedReadingIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setReadings([]);
    saveSharedState({ readings: [], deletedReadingIds: Array.from(new Set([...deletedReadingIds, ...allIds])) });
    setMeters((prevMeters) =>
      prevMeters.map((m) => ({
        ...m,
        lastReadingDate: '-',
        lastReadingValue: 0,
      }))
    );
    return true;
  };

  const addMeter = (data: Omit<Meter, 'id' | 'lastReadingDate' | 'lastReadingValue'> & { initialReading: number; initialDate: string }) => {
    if (currentUser.role !== 'admin') return;
    const newMeter: Meter = {
      ...data,
      id: `mtr-${Date.now().toString(36)}`,
      lastReadingDate: data.initialDate || new Date().toISOString().split('T')[0],
      lastReadingValue: data.initialReading || 0,
    };
    const updated = [...meters, newMeter];
    setMeters(updated);
    saveSharedState({ meters: updated });
  };

  const updateMeter = (id: string, updates: Partial<Meter>) => {
    if (currentUser.role !== 'admin') return;
    const updated = meters.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMeters(updated);
    saveSharedState({ meters: updated });
  };

  const deleteMeter = (id: string) => {
    if (currentUser.role !== 'admin') return false;
    const updatedMeters = meters.filter((m) => m.id !== id);
    const updatedReadings = readings.filter((r) => r.meterId !== id);
    setMeters(updatedMeters);
    setReadings(updatedReadings);
    saveSharedState({ meters: updatedMeters, readings: updatedReadings });
    return true;
  };

  const addBlock = (data: Omit<Block, 'id'>) => {
    if (currentUser.role !== 'admin') return;
    const newBlock: Block = {
      ...data,
      id: `block-${Date.now().toString(36)}`,
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    saveSharedState({ blocks: updated });
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    if (currentUser.role !== 'admin') return;
    const updated = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBlocks(updated);
    saveSharedState({ blocks: updated });
  };

  const deleteBlock = (id: string) => {
    if (currentUser.role !== 'admin') return false;
    const updatedBlocks = blocks.filter((b) => b.id !== id);
    const updatedMeters = meters.filter((m) => m.blockId !== id);
    const updatedReadings = readings.filter((r) => r.blockId !== id);
    setBlocks(updatedBlocks);
    setMeters(updatedMeters);
    setReadings(updatedReadings);
    saveSharedState({ blocks: updatedBlocks, meters: updatedMeters, readings: updatedReadings });
    return true;
  };

  const updateTariff = (newTariff: TariffConfig) => {
    if (currentUser.role !== 'admin') return;
    setTariff(newTariff);
    saveSharedState({ tariff: newTariff });
  };

  const calculateBill = ({
    blockId,
    periodType,
    referenceDate = getTodayDateStr(),
  }: {
    blockId?: string;
    periodType: 'day' | 'week' | 'month' | 'year';
    referenceDate?: string;
  }): BillCalculation => {
    let effectiveBlockId = blockId;
    if (!isAdmin && currentUser.assignedBlockId && currentUser.assignedBlockId !== 'ALL') {
      effectiveBlockId = currentUser.assignedBlockId;
    } else if (!effectiveBlockId) {
      effectiveBlockId = 'ALL';
    }

    let filteredReadings = readings;

    if (effectiveBlockId && effectiveBlockId !== 'ALL') {
      const targetLetter = normalizeBlockStr(effectiveBlockId);
      filteredReadings = readings.filter((r) => {
        const rLetter = normalizeBlockStr(r.blockId);
        return rLetter === targetLetter || (r.blockId || '').toLowerCase() === effectiveBlockId?.toLowerCase();
      });
    } else if (!isAdmin) {
      filteredReadings = visibleReadings;
    }

    const refDate = new Date(referenceDate);
    const targetMonth = referenceDate.slice(0, 7) || getCurrentMonthStr();
    const targetYear = refDate.getFullYear() || getCurrentYear();

    let startDate = '';
    let endDate = referenceDate;
    let periodLabel = '';

    if (periodType === 'day') {
      startDate = referenceDate;
      endDate = referenceDate;
      periodLabel = `Day (${referenceDate})`;
      filteredReadings = filteredReadings.filter((r) => r.readingDate === referenceDate);
    } else if (periodType === 'week') {
      const start = new Date(refDate);
      start.setDate(start.getDate() - 6);
      startDate = start.toISOString().split('T')[0];
      periodLabel = `Week (${startDate} to ${endDate})`;
      filteredReadings = filteredReadings.filter((r) => r.readingDate >= startDate && r.readingDate <= endDate);
    } else if (periodType === 'month') {
      startDate = `${targetMonth}-01`;
      endDate = `${targetMonth}-31`;
      const monthName = refDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      periodLabel = `${monthName}`;
      filteredReadings = filteredReadings.filter((r) => r.readingDate && r.readingDate.startsWith(targetMonth));
    } else {
      startDate = `${targetYear}-01-01`;
      endDate = `${targetYear}-12-31`;
      periodLabel = `Year ${targetYear}`;
      filteredReadings = filteredReadings.filter((r) => r.readingDate && r.readingDate.startsWith(`${targetYear}`));
    }

    const totalUnits = filteredReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
    const unitsConsumed = totalUnits;
    const energyCharges = +(unitsConsumed * tariff.baseRatePerUnit).toFixed(2);

    let fixedCharges = unitsConsumed > 0 ? tariff.fixedChargesMonthly : 0;
    if (periodType === 'day') fixedCharges = +(fixedCharges / 30).toFixed(2);
    else if (periodType === 'week') fixedCharges = +((fixedCharges * 7) / 30).toFixed(2);
    else if (periodType === 'year') fixedCharges = +(fixedCharges * 12).toFixed(2);

    const dutyTax = +(energyCharges * (tariff.dutyTaxPercent / 100)).toFixed(2);
    const fuelSurcharge = +(energyCharges * (tariff.fuelSurchargePercent / 100)).toFixed(2);
    const taxesAndDuties = +(dutyTax + fuelSurcharge).toFixed(2);

    const totalBill = +(energyCharges + fixedCharges + taxesAndDuties).toFixed(2);
    const averageRatePerUnit = unitsConsumed > 0 ? +(totalBill / unitsConsumed).toFixed(2) : tariff.baseRatePerUnit;
    
    const targetLetter = normalizeBlockStr(effectiveBlockId);
    const matchedBlock = blocks.find((b) => normalizeBlockStr(b.id) === targetLetter || b.id.toLowerCase() === effectiveBlockId?.toLowerCase());
    const blockName = effectiveBlockId && effectiveBlockId !== 'ALL' ? (matchedBlock?.name || `${targetLetter.toUpperCase()} Block`) : 'All Department Blocks';

    return {
      blockId: effectiveBlockId || 'ALL',
      blockName,
      periodType,
      periodLabel,
      startDate,
      endDate,
      totalUnitsConsumed: unitsConsumed,
      energyCharges,
      fixedCharges,
      taxesAndDuties,
      fuelSurcharge,
      totalBill,
      averageRatePerUnit,
      readingsCount: filteredReadings.length,
    };
  };

  const getDayWiseData = (blockId?: string, date = getTodayDateStr()) => {
    const effectiveBlockId = (isBlockIncharge && currentUser.assignedBlockId)
      ? currentUser.assignedBlockId
      : blockId;

    let dayReadings = visibleReadings.filter((r) => r.readingDate === date);
    if (effectiveBlockId && effectiveBlockId !== 'ALL') {
      const targetNorm = normalizeBlockStr(effectiveBlockId);
      dayReadings = dayReadings.filter((r) => normalizeBlockStr(r.blockId) === targetNorm || r.blockId === effectiveBlockId);
    }
    const totalDayUnits = dayReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);

    const timeSlots = [
      '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
      '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:59'
    ];

    if (totalDayUnits === 0) {
      return timeSlots.map((time) => ({
        time,
        units: 0,
        kw: 0,
        cost: 0,
        label: `${time} (0 kWh)`,
      }));
    }

    const slotWeights = [0.03, 0.03, 0.04, 0.06, 0.10, 0.12, 0.11, 0.13, 0.14, 0.10, 0.07, 0.04, 0.03];
    return timeSlots.map((time, idx) => {
      const units = +(totalDayUnits * (slotWeights[idx] || 0.08)).toFixed(1);
      return {
        time,
        units,
        kw: +(units * 1.5).toFixed(1),
        cost: +(units * tariff.baseRatePerUnit).toFixed(0),
        label: `${time} (${units} kWh)`,
      };
    });
  };

  const getWeekWiseData = (blockId?: string, referenceDate = getTodayDateStr()) => {
    const effectiveBlockId = (isBlockIncharge && currentUser.assignedBlockId)
      ? currentUser.assignedBlockId
      : blockId;

    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: Array<{ day: string; date: string; units: number; cost: number }> = [];
    const ref = new Date(referenceDate);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(ref);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysName[d.getDay()];

      let dayReadings = visibleReadings.filter((r) => r.readingDate === dateStr);
      if (effectiveBlockId && effectiveBlockId !== 'ALL') {
        const targetNorm = normalizeBlockStr(effectiveBlockId);
        dayReadings = dayReadings.filter((r) => normalizeBlockStr(r.blockId) === targetNorm || r.blockId === effectiveBlockId);
      }

      const units = dayReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
      result.push({
        day: dayName,
        date: dateStr.slice(5),
        units,
        cost: +(units * tariff.baseRatePerUnit).toFixed(0),
      });
    }

    return result;
  };

  const getMonthWiseData = (blockId?: string, referenceDate = getTodayDateStr()) => {
    const effectiveBlockId = (isBlockIncharge && currentUser.assignedBlockId)
      ? currentUser.assignedBlockId
      : blockId;

    const targetMonth = referenceDate.slice(0, 7) || getCurrentMonthStr();
    let monthReadings = visibleReadings.filter((r) => r.readingDate.startsWith(targetMonth));
    if (effectiveBlockId && effectiveBlockId !== 'ALL') {
      const targetNorm = normalizeBlockStr(effectiveBlockId);
      monthReadings = monthReadings.filter((r) => normalizeBlockStr(r.blockId) === targetNorm || r.blockId === effectiveBlockId);
    }

    const refDateObj = new Date(referenceDate);
    const monthShort = refDateObj.toLocaleDateString('en-US', { month: 'short' });

    const weeks = [
      { period: `W1 (${monthShort} 1-7)`, startDay: 1, endDay: 7 },
      { period: `W2 (${monthShort} 8-14)`, startDay: 8, endDay: 14 },
      { period: `W3 (${monthShort} 15-21)`, startDay: 15, endDay: 21 },
      { period: `W4 (${monthShort} 22-31)`, startDay: 22, endDay: 31 },
    ];

    return weeks.map((w) => {
      const wReadings = monthReadings.filter((r) => {
        const parts = r.readingDate.split('-');
        const day = parseInt(parts[2] || '0', 10);
        return day >= w.startDay && day <= w.endDay;
      });

      const units = wReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
      return {
        period: w.period,
        units,
        cost: +(units * tariff.baseRatePerUnit).toFixed(0),
      };
    });
  };

  const getYearWiseData = (blockId?: string, year = getCurrentYear()) => {
    const effectiveBlockId = (isBlockIncharge && currentUser.assignedBlockId)
      ? currentUser.assignedBlockId
      : blockId;

    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthsName.map((shortMonth, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const targetPrefix = `${year}-${monthNum}`;

      let monthReadings = visibleReadings.filter((r) => r.readingDate.startsWith(targetPrefix));
      if (effectiveBlockId && effectiveBlockId !== 'ALL') {
        const targetNorm = normalizeBlockStr(effectiveBlockId);
        monthReadings = monthReadings.filter((r) => normalizeBlockStr(r.blockId) === targetNorm || r.blockId === effectiveBlockId);
      }

      const units = monthReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
      const energyCharge = units * tariff.baseRatePerUnit;
      const bill = units > 0
        ? Math.round(energyCharge + tariff.fixedChargesMonthly + energyCharge * ((tariff.dutyTaxPercent + tariff.fuelSurchargePercent) / 100))
        : 0;

      return {
        month: `${shortMonth} ${year}`,
        shortMonth,
        units,
        bill,
      };
    });
  };

  const getBillComparison = (referenceDate = getTodayDateStr()) => {
    const past6Months = getPastNMonths(6, referenceDate);

    const monthlyList = past6Months.map(({ monthStr, label, shortLabel }) => {
      let monthReadings = visibleReadings.filter((r) => r.readingDate.startsWith(monthStr));
      const units = monthReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);

      const energyCharge = units * tariff.baseRatePerUnit;
      const bill = units > 0
        ? Math.round(energyCharge + tariff.fixedChargesMonthly + energyCharge * ((tariff.dutyTaxPercent + tariff.fuelSurchargePercent) / 100))
        : 0;

      return {
        month: label,
        shortMonth: shortLabel,
        monthStr,
        bill,
        units,
        costPerUnit: units > 0 ? +(bill / units).toFixed(2) : tariff.baseRatePerUnit,
      };
    });

    const currentMonthData = monthlyList[monthlyList.length - 1] || { bill: 0, units: 0, month: 'Current', shortMonth: 'Current' };
    const prevMonthData = monthlyList[monthlyList.length - 2] || { bill: 0, units: 0, month: 'Previous', shortMonth: 'Previous' };

    const [curYear, curMonth] = (referenceDate || getTodayDateStr()).split('-').map(Number);
    const prevYearMonthStr = `${curYear - 1}-${String(curMonth).padStart(2, '0')}`;
    const prevYearReadings = visibleReadings.filter((r) => r.readingDate.startsWith(prevYearMonthStr));
    const prevYearUnits = prevYearReadings.reduce((sum, r) => sum + r.unitsConsumed, 0);
    const prevYearEnergyCharge = prevYearUnits * tariff.baseRatePerUnit;
    const prevYearBill = prevYearUnits > 0
      ? Math.round(prevYearEnergyCharge + tariff.fixedChargesMonthly + prevYearEnergyCharge * ((tariff.dutyTaxPercent + tariff.fuelSurchargePercent) / 100))
      : 0;

    const momDiff = currentMonthData.bill - prevMonthData.bill;
    const momPercent = prevMonthData.bill > 0
      ? +((momDiff / prevMonthData.bill) * 100).toFixed(2)
      : (currentMonthData.bill > 0 ? 100 : 0);

    const yoyDiff = currentMonthData.bill - prevYearBill;
    const yoyPercent = prevYearBill > 0
      ? +((yoyDiff / prevYearBill) * 100).toFixed(2)
      : (currentMonthData.bill > 0 ? 100 : 0);

    return {
      monthlyList,
      currentMonthVsPrevMonth: {
        diffAmount: momDiff,
        diffPercent: momPercent,
        isIncrease: momDiff >= 0,
        currentBill: currentMonthData.bill,
        prevBill: prevMonthData.bill,
        currentLabel: currentMonthData.month,
        prevLabel: prevMonthData.month,
      },
      currentMonthVsPrevYear: {
        diffAmount: yoyDiff,
        diffPercent: yoyPercent,
        isIncrease: yoyDiff >= 0,
        currentBill: currentMonthData.bill,
        prevYearBill: prevYearBill,
        currentLabel: currentMonthData.month,
        prevYearLabel: `${currentMonthData.shortMonth?.split(' ')[0] || 'Mo'} ${curYear - 1}`,
      },
    };
  };

  const resetToDefaults = () => {
    if (currentUser.role !== 'admin') return;
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setBlocks(INITIAL_BLOCKS);
    setMeters(INITIAL_METERS);
    setReadings(INITIAL_READINGS);
    setTariff(INITIAL_TARIFF);
    setMsebBlocks(DEFAULT_MSEB_BLOCKS);
    setMsebReadings([]);
    setMsebTariffs(DEFAULT_MSEB_TARIFFS);
    setDeletedReadingIds([]);
    setDeletedMsebReadingIds([]);
    setDailyLimits([]);
    setExceedances([]);
    setNotifications([]);
    setDeletedNotificationIds([]);
    saveSharedState({
      users: INITIAL_USERS,
      blocks: INITIAL_BLOCKS,
      meters: INITIAL_METERS,
      readings: INITIAL_READINGS,
      tariff: INITIAL_TARIFF,
      msebBlocks: DEFAULT_MSEB_BLOCKS,
      msebReadings: [],
      msebTariffs: DEFAULT_MSEB_TARIFFS,
      deletedReadingIds: [],
      deletedMsebReadingIds: [],
      dailyLimits: [],
      exceedances: [],
      notifications: [],
    });
    localStorage.clear();
  };

  const exportDatabaseJson = () => {
    const data = {
      users,
      blocks,
      meters,
      readings,
      tariff,
      exportDate: new Date().toISOString(),
      system: 'VoltWise Electrical Department Energy Monitoring & Billing',
    };
    return JSON.stringify(data, null, 2);
  };

  const getMsebTariff = (blockId: string): MsebTariffConfig => {
    return (
      msebTariffs[blockId] ||
      DEFAULT_MSEB_TARIFFS[blockId] ||
      DEFAULT_MSEB_TARIFFS['mseb-block-1']
    );
  };

  const msebTariff = useMemo(() => {
    return getMsebTariff(msebBlocks[0]?.id || 'mseb-block-1');
  }, [msebTariffs, msebBlocks]);

  const updateMsebBlock = (id: string, updates: Partial<MsebBlock>) => {
    const updated = msebBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setMsebBlocks(updated);
    saveSharedState({ msebBlocks: updated });
  };

  const updateMsebTariffForBlock = (blockId: string, newTariff: MsebTariffConfig) => {
    const updated = { ...msebTariffs, [blockId]: newTariff };
    setMsebTariffs(updated);
    saveSharedState({ msebTariffs: updated });
  };

  const updateMsebTariff = (newTariff: MsebTariffConfig) => {
    const firstId = msebBlocks[0]?.id || 'mseb-block-1';
    updateMsebTariffForBlock(firstId, newTariff);
  };

  const addMsebCustomCharge = (blockId: string, charge: Omit<MsebCustomCharge, 'id'>) => {
    const currentTariff = getMsebTariff(blockId);
    const newCharge: MsebCustomCharge = {
      ...charge,
      id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updatedCustomCharges = [...(currentTariff.customCharges || []), newCharge];
    updateMsebTariffForBlock(blockId, {
      ...currentTariff,
      customCharges: updatedCustomCharges,
    });
  };

  const deleteMsebCustomCharge = (blockId: string, chargeId: string) => {
    const currentTariff = getMsebTariff(blockId);
    const updatedCustomCharges = (currentTariff.customCharges || []).filter((c) => c.id !== chargeId);
    updateMsebTariffForBlock(blockId, {
      ...currentTariff,
      customCharges: updatedCustomCharges,
    });
  };

  const calculateMsebBillBreakdown = (
    blockId: string = 'mseb-block-1',
    units: number,
    demandKva: number = 250
  ): MsebCostBreakdown => {
    const tariff = getMsebTariff(blockId);
    const energyCharges = units * tariff.baseRatePerUnit;
    const wheelingCharges = units * tariff.wheelingChargePerUnit;
    const demandCharges = demandKva * tariff.demandChargePerKva;
    const facCharges = (energyCharges + wheelingCharges) * (tariff.facPercent / 100);
    const electricityDuty = (energyCharges + wheelingCharges + facCharges + demandCharges) * (tariff.electricityDutyPercent / 100);
    const toseCharges = units * tariff.toseTaxPerUnit;

    let totalCustomCharges = 0;
    const customChargesBreakdown = (tariff.customCharges || []).map((cc) => {
      let amt = 0;
      let rateLabel = '';
      if (cc.type === 'per_unit') {
        amt = units * cc.value;
        rateLabel = `₹${cc.value.toFixed(2)}/unit`;
      } else if (cc.type === 'percentage_energy') {
        amt = (cc.value / 100) * energyCharges;
        rateLabel = `${cc.value}% of energy`;
      } else if (cc.type === 'percentage_total') {
        amt = (cc.value / 100) * (energyCharges + demandCharges + wheelingCharges);
        rateLabel = `${cc.value}% of base bill`;
      } else if (cc.type === 'fixed_monthly') {
        amt = cc.value;
        rateLabel = `₹${cc.value.toFixed(2)} flat`;
      } else if (cc.type === 'per_kva') {
        amt = demandKva * cc.value;
        rateLabel = `₹${cc.value.toFixed(2)}/kVA`;
      }
      const rounded = Math.round(amt);
      totalCustomCharges += rounded;
      return {
        id: cc.id,
        name: cc.name,
        type: cc.type,
        value: cc.value,
        amount: rounded,
        rateLabel,
      };
    });

    const totalMsebBill = Math.round(
      energyCharges +
      demandCharges +
      wheelingCharges +
      facCharges +
      electricityDuty +
      toseCharges +
      totalCustomCharges
    );
    const calculatedEffective = units > 0 ? +(totalMsebBill / units).toFixed(2) : +(tariff.baseRatePerUnit * 1.35).toFixed(2);

    let finalTotalBill = totalMsebBill;
    let finalEffectiveRate = calculatedEffective;
    const isManualRate = Boolean(tariff.isManualEffectiveRate && tariff.manualEffectiveRate && tariff.manualEffectiveRate > 0);

    if (isManualRate && tariff.manualEffectiveRate) {
      finalEffectiveRate = +(tariff.manualEffectiveRate).toFixed(2);
      if (units > 0) {
        finalTotalBill = Math.round(units * finalEffectiveRate);
      }
    }

    return {
      unitsConsumed: units,
      energyCharges: Math.round(energyCharges),
      demandCharges: Math.round(demandCharges),
      wheelingCharges: Math.round(wheelingCharges),
      facCharges: Math.round(facCharges),
      electricityDuty: Math.round(electricityDuty),
      toseCharges: Math.round(toseCharges),
      customChargesBreakdown,
      totalCustomCharges,
      totalMsebBill: finalTotalBill,
      effectiveCostPerUnit: finalEffectiveRate,
      isManualRate,
    };
  };

  const addMsebReading = async (params: {
    msebBlockId: string;
    readingDate: string;
    readingTime?: string;
    meterNumber?: string;
    previousReadingKwh: number;
    currentReadingKwh: number;
    previousReadingKvah?: number;
    currentReadingKvah?: number;
    multiplier?: number;
    notes?: string;
  }) => {
    const mf = params.multiplier && params.multiplier > 0 ? params.multiplier : 1;
    const unitsKwh = Math.max(0, (params.currentReadingKwh - params.previousReadingKwh) * mf);
    let unitsKvah: number | undefined = undefined;
    let powerFactor: number | undefined = undefined;

    if (params.currentReadingKvah !== undefined && params.previousReadingKvah !== undefined) {
      unitsKvah = Math.max(0, (params.currentReadingKvah - params.previousReadingKvah) * mf);
      powerFactor = unitsKvah > 0 ? Math.min(1.0, +(unitsKwh / unitsKvah).toFixed(3)) : 0.95;
    }

    const block = msebBlocks.find((b) => b.id === params.msebBlockId);
    const blockTariff = getMsebTariff(params.msebBlockId);
    const targetUnits = blockTariff.billingType === 'kvah' && unitsKvah !== undefined ? unitsKvah : unitsKwh;

    const customRatePerUnit = (blockTariff.customCharges || [])
      .filter((c) => c.type === 'per_unit')
      .reduce((sum, c) => sum + c.value, 0);

    const baseMarginalRate = (blockTariff.baseRatePerUnit + blockTariff.wheelingChargePerUnit + blockTariff.toseTaxPerUnit + customRatePerUnit) *
      (1 + (blockTariff.facPercent + blockTariff.electricityDutyPercent) / 100);
    const calculatedCost = Math.round(targetUnits * baseMarginalRate);

    const newReading: MsebReading = {
      id: `mseb-rd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      msebBlockId: params.msebBlockId,
      readingDate: params.readingDate,
      readingTime: params.readingTime || '08:00',
      meterNumber: params.meterNumber || block?.meterNumber || 'MTR-MSEB',
      previousReadingKwh: params.previousReadingKwh,
      currentReadingKwh: params.currentReadingKwh,
      previousReadingKvah: params.previousReadingKvah,
      currentReadingKvah: params.currentReadingKvah,
      multiplier: mf,
      unitsConsumedKwh: unitsKwh,
      unitsConsumedKvah: unitsKvah,
      powerFactor: powerFactor ?? 0.95,
      calculatedCost,
      enteredByName: currentUser.name,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    const updatedReadings = [newReading, ...msebReadings];
    await saveSharedState({ msebReadings: updatedReadings });
    setMsebReadings(updatedReadings);

    return {
      success: true,
      unitsConsumedKwh: unitsKwh,
      cost: calculatedCost,
      message: `MSEB Reading recorded successfully for ${block?.name || 'MSEB Block'}!`,
    };
  };

  const deleteMsebReading = (id: string) => {
    const updated = msebReadings.filter((r) => r.id !== id);
    const updatedDeleted = [...deletedMsebReadingIds, id];
    setDeletedMsebReadingIds(updatedDeleted);
    setMsebReadings(updated);
    saveSharedState({ msebReadings: updated, deletedMsebReadingIds: updatedDeleted });
    return true;
  };

  const clearAllMsebReadings = (blockId?: string) => {
    const extra = msebReadings.filter((r) => (blockId ? r.msebBlockId === blockId : true)).map((r) => r.id);
    const updatedDeleted = Array.from(new Set([...deletedMsebReadingIds, ...extra]));
    const updated = blockId ? msebReadings.filter((r) => r.msebBlockId !== blockId) : [];
    setDeletedMsebReadingIds(updatedDeleted);
    setMsebReadings(updated);
    saveSharedState({ msebReadings: updated, deletedMsebReadingIds: updatedDeleted });
  };

  return (
    <EnergyContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        users,
        blocks: visibleBlocks,
        allBlocks: blocks,
        meters: visibleMeters,
        allMeters: meters,
        readings: visibleReadings,
        allReadings: readings,
        tariff,
        dailyLimits: visibleDailyLimits,
        exceedances: visibleExceedances,
        allExceedances: exceedances,
        notifications: visibleNotifications,
        updateDailyLimit,
        submitExceedanceRemark,
        markNotificationRead,
        deleteNotification,
        markAllNotificationsRead,
        msebBlocks,
        msebReadings,
        msebTariff,
        getMsebTariff,
        updateMsebBlock,
        addMsebReading,
        deleteMsebReading,
        clearAllMsebReadings,
        updateMsebTariff,
        updateMsebTariffForBlock,
        addMsebCustomCharge,
        deleteMsebCustomCharge,
        calculateMsebBillBreakdown,
        theme,
        isDarkMode,
        setTheme,
        toggleTheme,
        isAdmin,
        isBlockIncharge,
        isViewer,
        userAssignedBlock,
        canEnterReading,
        canManageUsers,
        canEditTariff,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        assignBlockCredentials,
        addReading,
        addBatchReadings,
        deleteReading,
        deleteAllReadings,
        addMeter,
        updateMeter,
        deleteMeter,
        addBlock,
        updateBlock,
        deleteBlock,
        updateTariff,
        calculateBill,
        getDayWiseData,
        getWeekWiseData,
        getMonthWiseData,
        getYearWiseData,
        getBillComparison,
        resetToDefaults,
        exportDatabaseJson,
        syncStatus,
        lastSyncedAt,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};