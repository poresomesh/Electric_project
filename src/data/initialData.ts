import { Block, Meter, MeterReading, TariffConfig, User } from '../types';

export const INITIAL_TARIFF: TariffConfig = {
  baseRatePerUnit: 8.00, // ₹ 8.00 per kWh
  fixedChargesMonthly: 500.00, // ₹ 500.00 Fixed Demand Charges
  dutyTaxPercent: 6.0, // 6% Electricity Duty
  fuelSurchargePercent: 1.5, // 1.5% Fuel Surcharge
  currencySymbol: '₹',
  currencyCode: 'INR',
  slabEnabled: false,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'Tejas',
    name: 'Tejas',
    role: 'admin',
    assignedBlockId: 'ALL',
    email: 'tejas.electrical@company.com',
    phone: '+91 98765 43210',
    department: 'Electrical Engineering Dept',
    designation: 'Chief Administrator & Lead Engineer',
  },
  {
    id: 'usr-incharge-a',
    username: 'incharge_a',
    name: 'Sunil Verma',
    role: 'block_incharge',
    assignedBlockId: 'block-a',
    email: 'sunil.block_a@company.com',
    phone: '+91 98111 22233',
    department: 'Block A Operations',
    designation: 'Block A In-Charge (Assembly Plant)',
  },
  {
    id: 'usr-incharge-b',
    username: 'incharge_b',
    name: 'Ramesh Kumar',
    role: 'block_incharge',
    assignedBlockId: 'block-b',
    email: 'ramesh.block_b@company.com',
    phone: '+91 98222 33344',
    department: 'Block B Heavy Fabrication',
    designation: 'Block B In-Charge (Machinery Plant)',
  },
  {
    id: 'usr-incharge-c',
    username: 'incharge_c',
    name: 'Priya Sharma',
    role: 'block_incharge',
    assignedBlockId: 'block-c',
    email: 'priya.block_c@company.com',
    phone: '+91 98333 44455',
    department: 'Block C R&D Center',
    designation: 'Block C In-Charge (Testing Lab)',
  },
  {
    id: 'usr-incharge-d',
    username: 'incharge_d',
    name: 'Vikram Patel',
    role: 'block_incharge',
    assignedBlockId: 'block-d',
    email: 'vikram.block_d@company.com',
    phone: '+91 98444 55566',
    department: 'Block D IT & Administration',
    designation: 'Block D In-Charge (Admin Building)',
  },
  {
    id: 'usr-viewer',
    username: 'viewer',
    name: 'Auditor Rahul Mehta',
    role: 'viewer',
    assignedBlockId: 'ALL',
    email: 'audit.energy@company.com',
    phone: '+91 98555 66677',
    department: 'Plant Safety & Energy Audit',
    designation: 'Energy Audit Officer (View Only)',
  },
];

export const INITIAL_BLOCKS: Block[] = [
  {
    id: 'block-a',
    name: 'A Block',
    code: 'BLK-A',
    category: 'production',
    description: 'Main Assembly Line, SMT Lines & Packaging Section',
    inchargeName: 'Sunil Verma',
    inchargeId: 'usr-incharge-a',
    capacityKva: 500,
    targetMonthlyKwh: 4000,
    color: '#3b82f6', // blue
  },
  {
    id: 'block-b',
    name: 'B Block',
    code: 'BLK-B',
    category: 'production',
    description: 'Heavy Machinery, CNC Milling & Metal Fabrication',
    inchargeName: 'Ramesh Kumar',
    inchargeId: 'usr-incharge-b',
    capacityKva: 750,
    targetMonthlyKwh: 6500,
    color: '#10b981', // emerald
  },
  {
    id: 'block-c',
    name: 'C Block',
    code: 'BLK-C',
    category: 'utility',
    description: 'Central HVAC Chiller Plant & Compressed Air Substation',
    inchargeName: 'Priya Sharma',
    inchargeId: 'usr-incharge-c',
    capacityKva: 400,
    targetMonthlyKwh: 3800,
    color: '#f59e0b', // amber
  },
  {
    id: 'block-d',
    name: 'D Block',
    code: 'BLK-D',
    category: 'office',
    description: 'Administrative Office, IT Server Rooms & Lighting',
    inchargeName: 'Vikram Patel',
    inchargeId: 'usr-incharge-d',
    capacityKva: 250,
    targetMonthlyKwh: 2200,
    color: '#8b5cf6', // purple
  },
];

export const INITIAL_METERS: Meter[] = [
  {
    id: 'mtr-a01',
    meterNumber: 'MTR-001',
    blockId: 'block-a',
    name: 'Main Incomer Feeder (Main Meter)',
    meterType: 'main_incomer',
    multiplier: 1,
    location: 'Block A Sub-panel 01 (South Gate)',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
  {
    id: 'mtr-a02',
    meterNumber: 'MTR-002',
    blockId: 'block-a',
    name: 'SMT Line & Assembly Feeder',
    meterType: 'heavy_machinery',
    multiplier: 1,
    location: 'Block A Floor 2 Control Room',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
  {
    id: 'mtr-b01',
    meterNumber: 'MTR-003',
    blockId: 'block-b',
    name: 'CNC & Press Line Main Incomer',
    meterType: 'main_incomer',
    multiplier: 1,
    location: 'Block B Transformer Yard #2',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
  {
    id: 'mtr-b02',
    meterNumber: 'MTR-004',
    blockId: 'block-b',
    name: 'Welding & Induction Furnace',
    meterType: 'heavy_machinery',
    multiplier: 1,
    location: 'Block B Bay 4 Distribution Box',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
  {
    id: 'mtr-c01',
    meterNumber: 'MTR-005',
    blockId: 'block-c',
    name: 'Central Chiller Compressor Incomer',
    meterType: 'hvac_plant',
    multiplier: 1,
    location: 'Block C Plant Room 1',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
  {
    id: 'mtr-d01',
    meterNumber: 'MTR-006',
    blockId: 'block-d',
    name: 'Admin & Server UPS Incomer',
    meterType: 'main_incomer',
    multiplier: 1,
    location: 'Block D Basement Electrical Switchgear',
    status: 'active',
    lastReadingDate: '-',
    lastReadingValue: 0,
  },
];

// Clean state: Initial readings kept empty for fresh manual user entry of kWh and kVAh
export const INITIAL_READINGS: MeterReading[] = [];

// Clean state: Historical monthly data starts empty, computed dynamically from user entered readings
export const HISTORICAL_MONTHLY_DATA: Array<{ month: string; shortMonth: string; units: number; bill: number; costPerUnit: number }> = [];
