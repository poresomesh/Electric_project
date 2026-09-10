export type UserRole = 'admin' | 'block_incharge' | 'viewer';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedBlockId?: string; // 'ALL' or block id like 'block-a'
  email?: string;
  phone?: string;
  department: string;
  designation: string;
  password?: string;
  passwordHash?: string;
  passwordConfigured?: boolean;
}

export interface Block {
  id: string;
  name: string;
  code: string; // e.g., 'BLK-A'
  category: 'production' | 'utility' | 'office' | 'substation';
  description: string;
  inchargeName: string;
  inchargeId: string;
  capacityKva: number;
  targetMonthlyKwh: number;
  color: string;
}

export type MeterType = 'main_incomer' | 'sub_distribution' | 'hvac_plant' | 'heavy_machinery' | 'lighting_utility';

export interface Meter {
  id: string;
  meterNumber: string; // e.g. 'MTR-001'
  blockId: string;
  name: string;
  meterType: MeterType;
  multiplier: number; // CT/PT Multiplier Factor (default 1)
  location: string;
  status: 'active' | 'maintenance' | 'offline';
  lastReadingDate: string;
  lastReadingValue: number;
}

export interface MeterReading {
  id: string;
  blockId: string;
  meterId: string;
  meterNumber: string;
  readingDate: string; // YYYY-MM-DD
  readingTime?: string; // HH:mm
  previousReading: number; // kWh previous
  currentReading: number; // kWh current
  unitsConsumed: number; // (current - previous) * multiplier (kWh)
  multiplier: number;
  enteredBy: string; // user id
  enteredByName: string;
  notes?: string;
  // Electrical Main Meter Fields:
  previousKvah?: number;
  currentKvah?: number;
  kvahConsumed?: number;
  voltageRms?: number; // optional electrical metrics
  powerFactor?: number;
  peakDemandKw?: number;
  createdAt: string;
}

export interface DailyLimitConfig {
  id: string;
  blockId: string;
  dailyLimitUnits: number;
  effectiveFrom: string;
  updatedAt: string;
  updatedBy: string;
}

export type ExceedanceStatus = 'open' | 'responded' | 'acknowledged';

export interface DailyExceedance {
  id: string;
  blockId: string;
  readingDate: string;
  consumedUnits: number;
  dailyLimitUnits: number;
  excessUnits: number;
  status: ExceedanceStatus;
  remark?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface EnergyNotification {
  id: string;
  userId?: string;
  type: 'daily_limit_exceeded' | 'exceedance_remark_submitted';
  exceedanceId: string;
  blockId: string;
  readingDate: string;
  title: string;
  message: string;
  createdAt: string;
  readByUserIds: string[];
}

export interface TariffConfig {
  baseRatePerUnit: number; // e.g. 8.00 ₹/kWh
  fixedChargesMonthly: number; // e.g. 500.00 ₹
  dutyTaxPercent: number; // e.g. 6.0%
  fuelSurchargePercent: number; // e.g. 1.5%
  currencySymbol: string; // e.g. '₹'
  currencyCode: string; // 'INR', 'USD', etc.
  slabEnabled: boolean;
}

export interface BillCalculation {
  blockId: string;
  blockName: string;
  periodType: 'day' | 'week' | 'month' | 'year';
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalUnitsConsumed: number;
  energyCharges: number;
  fixedCharges: number;
  taxesAndDuties: number;
  fuelSurcharge: number;
  totalBill: number;
  averageRatePerUnit: number;
  readingsCount: number;
}

// MSEB Bill Specific Interfaces (completely separate from internal plant blocks)
export interface MsebBlock {
  id: string; // 'mseb-block-1' | 'mseb-block-2'
  name: string; // Manually editable by user (e.g. "MSEB Feeder 1", "Main Substation Incomer")
  code: string; // e.g. "MSEB-01"
  consumerNumber: string; // MSEB Consumer Number
  meterNumber: string; // MSEB Meter Number
  contractDemandKva: number; // e.g. 250 kVA
  sanctionedLoadKw: number; // e.g. 200 kW
  color: string;
}

export interface MsebReading {
  id: string;
  msebBlockId: string; // 'mseb-block-1' or 'mseb-block-2'
  readingDate: string; // YYYY-MM-DD
  readingTime: string; // HH:mm
  meterNumber: string;
  previousReadingKwh: number;
  currentReadingKwh: number;
  previousReadingKvah?: number;
  currentReadingKvah?: number;
  multiplier: number; // CT/PT Multiplier Factor (MF)
  unitsConsumedKwh: number; // (current - previous) * multiplier
  unitsConsumedKvah?: number; // (current - previous) * multiplier
  powerFactor?: number; // kWh / kVAh
  calculatedCost: number; // Total cost for this reading based on MSEB tariff
  enteredByName: string;
  notes?: string;
  createdAt: string;
}

export interface MsebCustomCharge {
  id: string;
  name: string; // e.g. "Regulatory Asset Surcharge", "Green Cess", "Meter Rent", "Harmonics Penalty"
  type: 'per_unit' | 'percentage_energy' | 'percentage_total' | 'fixed_monthly' | 'per_kva';
  value: number; // rate or percentage
  description?: string;
}

export interface MsebTariffConfig {
  baseRatePerUnit: number; // e.g. 8.50 ₹/kWh
  demandChargePerKva: number; // e.g. 450 ₹/kVA
  wheelingChargePerUnit: number; // e.g. 1.25 ₹/unit
  facPercent: number; // Fuel Adjustment Charge % e.g. 3.5%
  electricityDutyPercent: number; // e.g. 9.3%
  toseTaxPerUnit: number; // Tax on Sale of Electricity ₹/unit e.g. 0.15
  customCharges?: MsebCustomCharge[]; // Dynamic charges that user can add and delete at will
  currencySymbol: string;
  billingType: 'kwh' | 'kvah'; // MSEB often bills on kVAh for HT or kWh with PF penalty
  manualEffectiveRate?: number; // Optional manual override rate (₹/kWh)
  isManualEffectiveRate?: boolean; // True if manual rate is used instead of auto-calculated
}

export interface MsebCustomChargeDetail {
  id: string;
  name: string;
  type: 'per_unit' | 'percentage_energy' | 'percentage_total' | 'fixed_monthly' | 'per_kva';
  value: number;
  amount: number;
  rateLabel: string;
}

export interface MsebCostBreakdown {
  unitsConsumed: number;
  energyCharges: number;
  demandCharges: number;
  wheelingCharges: number;
  facCharges: number;
  electricityDuty: number;
  toseCharges: number;
  customChargesBreakdown: MsebCustomChargeDetail[];
  totalCustomCharges: number;
  totalMsebBill: number;
  effectiveCostPerUnit: number;
  isManualRate?: boolean;
}
