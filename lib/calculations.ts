/* ════════════════════════════════════════════════
   DEMAND ANALYTICS - CALCULATION LIBRARY
   All formulas and functions ported verbatim from HTML
   ════════════════════════════════════════════════ */

/* ── Data structure ── */
export const STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 
  'Delhi', 'Rajasthan', 'Uttar Pradesh', 'West Bengal'
];

export const BRANCHES: Record<string, string[]> = {
  'Maharashtra': [
    'Mumbai North', 'Mumbai South', 'Mumbai Central',
    'Pune East', 'Pune West', 'Nagpur', 'Nashik', 'Aurangabad'
  ],
  'Karnataka': [
    'Bangalore East', 'Bangalore West', 'Bangalore Central',
    'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere'
  ],
  'Tamil Nadu': [
    'Chennai Central', 'Chennai South', 'Chennai North',
    'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli'
  ],
  'Gujarat': [
    'Ahmedabad East', 'Ahmedabad West',
    'Surat North', 'Surat South',
    'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'
  ],
  'Delhi': [
    'Delhi North', 'Delhi South', 'Delhi East',
    'Delhi West', 'Delhi Central', 'Dwarka', 'Rohini', 'Noida Extension'
  ],
  'Rajasthan': [
    'Jaipur North', 'Jaipur South',
    'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'
  ],
  'Uttar Pradesh': [
    'Lucknow East', 'Lucknow West',
    'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad'
  ],
  'West Bengal': [
    'Kolkata North', 'Kolkata South', 'Kolkata East',
    'Howrah', 'Durgapur', 'Siliguri', 'Asansol'
  ],
};

export const CAS: Record<string, string[]> = {
  // Maharashtra
  'Mumbai North':    ['MH-MN-0101', 'MH-MN-0102', 'MH-MN-0103', 'MH-MN-0104'],
  'Mumbai South':    ['MH-MS-0201', 'MH-MS-0202', 'MH-MS-0203'],
  'Mumbai Central':  ['MH-MC-0301', 'MH-MC-0302', 'MH-MC-0303', 'MH-MC-0304'],
  'Pune East':       ['MH-PE-0401', 'MH-PE-0402', 'MH-PE-0403'],
  'Pune West':       ['MH-PW-0501', 'MH-PW-0502'],
  'Nagpur':          ['MH-NG-0601', 'MH-NG-0602', 'MH-NG-0603'],
  'Nashik':          ['MH-NK-0701', 'MH-NK-0702'],
  'Aurangabad':      ['MH-AB-0801', 'MH-AB-0802', 'MH-AB-0803'],

  // Karnataka
  'Bangalore East':  ['KA-BE-1101', 'KA-BE-1102', 'KA-BE-1103', 'KA-BE-1104'],
  'Bangalore West':  ['KA-BW-1201', 'KA-BW-1202', 'KA-BW-1203'],
  'Bangalore Central': ['KA-BC-1301', 'KA-BC-1302', 'KA-BC-1303'],
  'Mysore':          ['KA-MY-1401', 'KA-MY-1402'],
  'Hubli':           ['KA-HB-1501', 'KA-HB-1502', 'KA-HB-1503'],
  'Mangalore':       ['KA-MG-1601', 'KA-MG-1602'],
  'Belgaum':         ['KA-BG-1701', 'KA-BG-1702'],
  'Davangere':       ['KA-DV-1801', 'KA-DV-1802'],

  // Tamil Nadu
  'Chennai Central': ['TN-CC-2101', 'TN-CC-2102', 'TN-CC-2103', 'TN-CC-2104'],
  'Chennai South':   ['TN-CS-2201', 'TN-CS-2202', 'TN-CS-2203'],
  'Chennai North':   ['TN-CN-2301', 'TN-CN-2302'],
  'Coimbatore':      ['TN-CB-2401', 'TN-CB-2402', 'TN-CB-2403'],
  'Madurai':         ['TN-MD-2501', 'TN-MD-2502'],
  'Salem':           ['TN-SL-2601', 'TN-SL-2602'],
  'Trichy':          ['TN-TR-2701', 'TN-TR-2702', 'TN-TR-2703'],
  'Tirunelveli':     ['TN-TV-2801', 'TN-TV-2802'],

  // Gujarat
  'Ahmedabad East':  ['GJ-AE-3101', 'GJ-AE-3102', 'GJ-AE-3103'],
  'Ahmedabad West':  ['GJ-AW-3201', 'GJ-AW-3202', 'GJ-AW-3203'],
  'Surat North':     ['GJ-SN-3301', 'GJ-SN-3302'],
  'Surat South':     ['GJ-SS-3401', 'GJ-SS-3402', 'GJ-SS-3403'],
  'Vadodara':        ['GJ-VD-3501', 'GJ-VD-3502'],
  'Rajkot':          ['GJ-RJ-3601', 'GJ-RJ-3602', 'GJ-RJ-3603'],
  'Gandhinagar':     ['GJ-GN-3701', 'GJ-GN-3702'],
  'Bhavnagar':       ['GJ-BV-3801', 'GJ-BV-3802'],

  // Delhi
  'Delhi North':     ['DL-DN-4101', 'DL-DN-4102', 'DL-DN-4103'],
  'Delhi South':     ['DL-DS-4201', 'DL-DS-4202', 'DL-DS-4203', 'DL-DS-4204'],
  'Delhi East':      ['DL-DE-4301', 'DL-DE-4302'],
  'Delhi West':      ['DL-DW-4401', 'DL-DW-4402', 'DL-DW-4403'],
  'Delhi Central':   ['DL-DC-4501', 'DL-DC-4502'],
  'Dwarka':          ['DL-DK-4601', 'DL-DK-4602'],
  'Rohini':          ['DL-RH-4701', 'DL-RH-4702', 'DL-RH-4703'],
  'Noida Extension': ['DL-NE-4801', 'DL-NE-4802'],

  // Rajasthan
  'Jaipur North':    ['RJ-JN-5101', 'RJ-JN-5102', 'RJ-JN-5103'],
  'Jaipur South':    ['RJ-JS-5201', 'RJ-JS-5202'],
  'Jodhpur':         ['RJ-JD-5301', 'RJ-JD-5302', 'RJ-JD-5303'],
  'Udaipur':         ['RJ-UD-5401', 'RJ-UD-5402'],
  'Kota':            ['RJ-KT-5501', 'RJ-KT-5502'],
  'Ajmer':           ['RJ-AJ-5601', 'RJ-AJ-5602'],
  'Bikaner':         ['RJ-BK-5701', 'RJ-BK-5702'],

  // Uttar Pradesh
  'Lucknow East':    ['UP-LE-6101', 'UP-LE-6102', 'UP-LE-6103'],
  'Lucknow West':    ['UP-LW-6201', 'UP-LW-6202'],
  'Kanpur':          ['UP-KN-6301', 'UP-KN-6302', 'UP-KN-6303'],
  'Agra':            ['UP-AG-6401', 'UP-AG-6402'],
  'Varanasi':        ['UP-VR-6501', 'UP-VR-6502', 'UP-VR-6503'],
  'Allahabad':       ['UP-AL-6601', 'UP-AL-6602'],
  'Meerut':          ['UP-ME-6701', 'UP-ME-6702'],
  'Ghaziabad':       ['UP-GZ-6801', 'UP-GZ-6802', 'UP-GZ-6803'],

  // West Bengal
  'Kolkata North':   ['WB-KN-7101', 'WB-KN-7102', 'WB-KN-7103'],
  'Kolkata South':   ['WB-KS-7201', 'WB-KS-7202', 'WB-KS-7203'],
  'Kolkata East':    ['WB-KE-7301', 'WB-KE-7302'],
  'Howrah':          ['WB-HW-7401', 'WB-HW-7402', 'WB-HW-7403'],
  'Durgapur':        ['WB-DP-7501', 'WB-DP-7502'],
  'Siliguri':        ['WB-SL-7601', 'WB-SL-7602'],
  'Asansol':         ['WB-AS-7701', 'WB-AS-7702'],
};

export const BILL_CATEGORIES = [
  'Electricity',
  'Water',
  'Gas',
  'Telecom - Postpaid',
  'Telecom - Broadband',
  'DTH',
  'Insurance',
  'Loan Repayment',
  'FASTag',
  'Municipal Tax',
  'Housing Society',
  'Education Fees',
  'Hospital',
  'Cable TV',
] as const;

export type BillCategory = typeof BILL_CATEGORIES[number] | 'all';

export const YEARLY_LABELS = ['FY22', 'FY23', 'FY24', 'FY25'];
export const MONTHLY_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/* ── Per-CA base parameters (stable across renders) ── */
const CA_PARAMS: Record<string, any> = {};

/* ── Seeded random helpers ── */
function seed(s: number): number {
  const x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
}

function sr(s: number, min: number, max: number): number {
  return min + seed(s) * (max - min);
}

function getCAParams(ca: string) {
  if (!ca || ca.length === 0) return null;
  if (CA_PARAMS[ca]) return CA_PARAMS[ca];
  
  let h = 0;
  for (let i = 0; i < ca.length; i++) {
    h = Math.imul(31, h) + ca.charCodeAt(i) | 0;
  }
  
  const base = 380 + Math.abs(h % 160);
  const contracted = Math.round((base * sr(h, 0.85, 0.95)) / 10) * 10;
  const sanctioned = Math.round(contracted * sr(h + 1, 1.05, 1.20) / 10) * 10;
  const connected = Math.round(contracted * sr(h + 2, 0.90, 1.05) / 10) * 10;
  const tariffRate = sr(h + 3, 6.5, 9.5);       // ₹/kWh energy tariff
  const demandRate = sr(h + 4, 400, 600);        // ₹/kVA/month demand charge rate
  const basePF = sr(h + 5, 0.82, 0.96);          // base power factor
  
  CA_PARAMS[ca] = { base, contracted, sanctioned, connected, tariffRate, demandRate, basePF };
  return CA_PARAMS[ca];
}

/* ── Generate one bill record for a CA in period slot i ── */
export function genBill(ca: string, i: number, periodType: 'yearly' | 'monthly') {
  const p = getCAParams(ca);
  if (!p) return null;
  const s = p.base * 100 + i;

  /* Demand */
  const mdi = Math.round(p.base * (0.78 + seed(s) * 0.45));
  const excessKVA = Math.max(0, mdi - p.contracted);

  /* ── EXCESS DEMAND CHARGE ──
     Formula: MAX(0, MDI − Contracted demand) × demand_rate
     Captures penalty when actual peak demand exceeds contracted level */
  const excessCharge = Math.round(excessKVA * p.demandRate);

  /* ── FIXED / DEMAND CHARGE ──
     Formula: contracted_demand × demand_rate
     Base charge paid regardless of actual usage */
  const fixedCharge = Math.round(p.contracted * p.demandRate);

  /* Consumption */
  const hoursInPeriod = periodType === 'yearly' ? 8760 : 720;
  const loadFactor = sr(s + 10, 0.55, 0.85);
  const kwh = Math.round(mdi * hoursInPeriod * loadFactor * 0.001) * 1000; // round to nearest 1000

  /* ── ENERGY CHARGE ──
     Formula: kWh consumed × tariff rate (₹/kWh) */
  const energyCharge = Math.round(kwh * p.tariffRate);

  /* Power factor — varies month to month */
  const pf = Math.min(0.99, Math.max(0.72, p.basePF + seed(s + 20) * 0.12 - 0.06));

  /* ── POWER FACTOR PENALTY / INCENTIVE ──
     Penalty:   if PF < 0.90 → energyCharge × (0.90 − PF) / 0.90 × 1.5  (DISCOM formula approx)
     Incentive: if PF ≥ 0.95 → energyCharge × (PF − 0.95) / 0.95 × 0.5 */
  let pfPenalty = 0, pfIncentive = 0;
  if (pf < 0.90) pfPenalty = Math.round(energyCharge * ((0.90 - pf) / 0.90) * 1.5);
  else if (pf >= 0.95) pfIncentive = Math.round(energyCharge * ((pf - 0.95) / 0.95) * 0.5);

  /* ── TOD VIOLATION CHARGE ──
     Occurs when peak-hour consumption exceeds limits.
     Approximated as: 3% of energy charge when violation flag is true */
  const todViolation = seed(s + 30) < 0.35 ? Math.round(energyCharge * 0.03) : 0;

  /* ── LOW VOLTAGE SURCHARGE ──
     Applies when supply voltage is below nominal (HT/LT threshold).
     Formula: fixedCharge × 5% when low-voltage condition exists */
  const lvSurcharge = seed(s + 40) < 0.25 ? Math.round(fixedCharge * 0.05) : 0;

  /* Meter rent — fixed component */
  const meterRent = Math.round(sr(s + 50, 800, 2500));

  /* ── LATE PAYMENT SURCHARGE ──
     Formula: (totalBillBeforeLPS) × 2% per month overdue
     Occurs ~20% of the time */
  /* ── DIGITAL PAYMENT BENEFIT ──
     Discount offered by some billers for digital/online payment
     Credited as adjustment in next bill · occurs ~40% of CAs · 0.5-1% of energy charge */
  const digitalPaymentBenefit = (seed(s + 55) < 0.40)
    ? Math.round(energyCharge * (0.005 + seed(s + 57) * 0.005))
    : 0;

  /* ── EARLY PAYMENT DISCOUNT ──
     Offered by some DISCOMs for payment before due date
     Occurs ~30% of the time · 1-1.5% of energy + fixed charges */
  const earlyPaymentDiscount = seed(s + 58) < 0.30
    ? Math.round((fixedCharge + energyCharge) * (0.01 + seed(s + 59) * 0.005))
    : 0;

  const billBeforeLPS = fixedCharge + energyCharge + excessCharge + pfPenalty - pfIncentive + todViolation + lvSurcharge + meterRent;
  const latePayment = seed(s + 60) < 0.20 ? Math.round(billBeforeLPS * 0.02) : 0;

  /* Arrears — occasional adjustments */
  const arrears = seed(s + 70) < 0.15 ? Math.round(sr(s + 71, -5000, 8000)) : 0;

  /* ── TOTAL BILL ──
     = Fixed charge + Energy charge + Excess demand charge
     + PF penalty − PF incentive + TOD violation
     + LV surcharge + Meter rent + Late payment + Arrears */
  const totalBill = billBeforeLPS + latePayment + arrears - digitalPaymentBenefit - earlyPaymentDiscount;

  /* Total leakage = all avoidable charges */
  const totalLeakage = excessCharge + pfPenalty + todViolation + lvSurcharge + latePayment;

  return {
    mdi, contracted: p.contracted, sanctioned: p.sanctioned, connected: p.connected,
    kwh, fixedCharge, energyCharge, excessCharge, pfPenalty, pfIncentive,
    todViolation, lvSurcharge, meterRent, latePayment, arrears, totalBill,
    totalLeakage, pf, excessKVA,
    digitalPaymentBenefit, earlyPaymentDiscount
  };
}

export function getCABills(ca: string, view: 'yearly' | 'monthly') {
  const params = getCAParams(ca);
  if (!params) return [];
  const labels = view === 'yearly' ? YEARLY_LABELS : MONTHLY_LABELS;
  return labels.map((lbl, i) => {
    const bill = genBill(ca, i, view);
    return bill ? { label: lbl, ...bill } : null;
  }).filter(Boolean) as any[];
}

/* ── Aggregate bill records across multiple CAs ──
   Sums all ₹ fields and averages demand/kWh/pf fields */
export function aggregateBills(billSets: any[][]) {
  const n = billSets[0].length;
  return billSets[0].map((_: any, i: number) => {
    const rows = billSets.map(d => d[i]);
    const sum = (f: string) => rows.reduce((a: number, r: any) => a + r[f], 0);
    const avg = (f: string) => Math.round(sum(f) / rows.length);
    return {
      label: rows[0].label,
      mdi: avg('mdi'),
      contracted: avg('contracted'),
      sanctioned: avg('sanctioned'),
      connected: avg('connected'),
      kwh: sum('kwh'),
      fixedCharge: sum('fixedCharge'),
      energyCharge: sum('energyCharge'),
      excessCharge: sum('excessCharge'),
      pfPenalty: sum('pfPenalty'),
      pfIncentive: sum('pfIncentive'),
      todViolation: sum('todViolation'),
      lvSurcharge: sum('lvSurcharge'),
      meterRent: sum('meterRent'),
      latePayment: sum('latePayment'),
      arrears: sum('arrears'),
      totalBill: sum('totalBill'),
      totalLeakage: sum('totalLeakage'),
      digitalPaymentBenefit: sum('digitalPaymentBenefit'),
      earlyPaymentDiscount:  sum('earlyPaymentDiscount'),
      pf: rows.reduce((a: number, r: any) => a + r.pf, 0) / rows.length,
      excessKVA: avg('excessKVA')
    };
  });
}

export function getBranchBills(branch: string, view: 'yearly' | 'monthly') {
  return aggregateBills(CAS[branch].map(ca => getCABills(ca, view)));
}

export function getStateBills(state: string, view: 'yearly' | 'monthly') {
  return aggregateBills(BRANCHES[state].map(br => getBranchBills(br, view)));
}

export function getAllBills(view: 'yearly' | 'monthly') {
  return aggregateBills(STATES.map(st => getStateBills(st, view)));
}

/* ── Currency formatters ── */
export function inr(v: number): string {
  return '₹' + (v / 100000).toFixed(1) + 'L';
}

export function inrK(v: number): string {
  return '₹' + (v / 1000).toFixed(0) + 'K';
}

/* ── Filter logic ── */
export function getFilteredBills(
  view: 'yearly' | 'monthly',
  stateF: string,
  branchF: string,
  caF: string
) {
  if (caF !== 'all') return getCABills(caF, view);
  if (branchF !== 'all') return getBranchBills(branchF, view);
  if (stateF !== 'all') return getStateBills(stateF, view);
  return getAllBills(view);
}

/* ── Chart helpers ── */
export function getChartColors() {
  const isDark = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    gridC: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    lblC: isDark ? '#999' : '#888'
  };
}

export const periodToView = {
  '1m': 'monthly' as const,
  '3m': 'monthly' as const,
  '6m': 'monthly' as const,
  '1y': 'yearly' as const,
  'custom': 'monthly' as const
};

/* ── Initialize all CA_PARAMS at module load (run at top level) ── */
Object.keys(CAS).forEach(branch => {
  CAS[branch].forEach(ca => {
    getCAParams(ca);
  });
});

console.log('calculations loaded, CA count:', Object.values(CAS).flat().length);

/* ── Meter reading distribution ──
   Returns for each month: count of bills falling into each kWh consumption range
   Range: 0 = faulty/same reading, then 100 kWh buckets up to max
   Used by: ConsumptionSection bill reading distribution chart */

export interface DistributionBucket {
  rangeLabel:  string   // e.g. "0", "1–100", "101–200"
  min:         number
  max:         number
  color:       string
}

export interface MonthlyDistribution {
  month:   string      // e.g. "Apr"
  buckets: number[]    // count per bucket, index matches DISTRIBUTION_BUCKETS
}

export const DISTRIBUTION_BUCKETS: DistributionBucket[] = [
  { rangeLabel: '0 (Faulty)',    min: 0,       max: 0,       color: '#F09595' },
  { rangeLabel: '<100K',         min: 1,       max: 100000,  color: '#B5D4F4' },
  { rangeLabel: '100K–150K',     min: 100000,  max: 150000,  color: '#EF9F27' },
  { rangeLabel: '150K–200K',     min: 150000,  max: 200000,  color: '#1D9E75' },
  { rangeLabel: '200K–300K',     min: 200000,  max: 300000,  color: '#378ADD' },
  { rangeLabel: '300K+',         min: 300000,  max: Infinity, color: '#E24B4A' },
];

// Cache so we don't recompute on every render
let _distCache: MonthlyDistribution[] | null = null;

export function getConsumptionDistribution(): MonthlyDistribution[] {
  const allCAs = Object.values(CAS).flat()

  const result = MONTHLY_LABELS.map((month, mi) => {
    // Collect all CA readings for this month
    const readings: number[] = allCAs.map((ca, ci) => {
      const bills = getCABills(ca, 'monthly')
      const bill = bills[mi]
      if (!bill) return -1
      // Simulate ~3% faulty meters (same opening and closing reading = 0 unit diff)
      // Use deterministic seed so same CA always faulty in same month
      const isFaulty = ((ci * 7 + mi * 13) % 33 === 0)
      if (isFaulty) return 0
      // Round to nearest 100 kWh
      return Math.round((bill.kwh ?? 0) / 100) * 100
    }).filter(v => v >= 0)

    // Count bills per bucket
    const buckets = DISTRIBUTION_BUCKETS.map(bucket => {
      if (bucket.max === 0) {
        // Exact zero = faulty/same reading
        return readings.filter(v => v === 0).length
      }
      return readings.filter(v => v >= (bucket.min === 0 ? 1 : bucket.min) && v <= bucket.max).length
    })

    return { month, buckets }
  })

  return result
}

/* ── State consumption summary ──
   Returns total kWh and total bill per state for ranking chart
   Used by: ConsumptionSection top consuming states chart */

export interface StateConsumptionSummary {
  state:     string
  totalKwh:  number
  totalBill: number
  avgRate:   number   // ₹ per kWh
}

let _stateConsCache: StateConsumptionSummary[] | null = null;

export function getStateConsumptionSummary(): StateConsumptionSummary[] {
  const result = STATES.map(state => {
    const d = getStateBills(state, 'monthly');
    const totalKwh  = d.reduce((s, r) => s + r.kwh, 0);
    const totalBill = d.reduce((s, r) => s + r.totalBill, 0);
    const avgRate   = totalKwh > 0
      ? Math.round((totalBill / totalKwh) * 100) / 100
      : 0;
    return { state, totalKwh, totalBill, avgRate };
  }).sort((a, b) => b.totalKwh - a.totalKwh);

  return result;
}

/* ── Unit consumption vs bill amount trend ──
   Returns monthly kWh and bill amount for dual-axis chart
   Used by: ConsumptionSection unit consumption vs bill amount chart */

export interface ConsumptionVsBillPoint {
  month:     string
  totalKwh:  number
  totalBill: number
  ratePerUnit: number
}

let _consBillCache: ConsumptionVsBillPoint[] | null = null;

export function getConsumptionVsBill(
  stateF: string,
  branchF: string,
  caF: string
): ConsumptionVsBillPoint[] {
  // This one is filter-aware so do not cache globally
  const data = getFilteredBills('monthly', stateF, branchF, caF);
  return data.map(d => ({
    month:       d.label,
    totalKwh:    d.kwh,
    totalBill:   d.totalBill,
    ratePerUnit: d.kwh > 0 ? Math.round(d.totalBill / d.kwh * 100) / 100 : 0,
  }));
}
