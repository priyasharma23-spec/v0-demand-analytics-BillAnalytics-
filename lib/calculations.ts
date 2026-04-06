/* ════════════════════════════════════════════════
   DEMAND ANALYTICS - CALCULATION LIBRARY
   All formulas and functions ported verbatim from HTML
   ════════════════════════════════════════════════ */

/* ── Data structure ── */
export const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal'
];

export const BRANCHES: Record<string, string[]> = {
  'Andhra Pradesh': ['AP-VISAKHAPATNAM', 'AP-HYDERABAD'],
  'Assam': ['AS-GUWAHATI'],
  'Bihar': ['BR-PATNA'],
  'Chhattisgarh': ['CG-RAIPUR'],
  'Delhi': ['DL-DELHI'],
  'Goa': ['GA-PANAJI'],
  'Gujarat': ['GJ-AHMEDABAD', 'GJ-SURAT'],
  'Haryana': ['HR-GURUGRAM'],
  'Himachal Pradesh': ['HP-SHIMLA'],
  'Jharkhand': ['JH-RANCHI'],
  'Karnataka': ['KA-BANGALORE', 'KA-MYSORE'],
  'Kerala': ['KL-KOCHI'],
  'Madhya Pradesh': ['MP-INDORE'],
  'Maharashtra': ['MH-MUMBAI', 'MH-PUNE'],
  'Manipur': ['MN-IMPHAL'],
  'Meghalaya': ['ML-SHILLONG'],
  'Mizoram': ['MZ-AIZAWL'],
  'Nagaland': ['NL-KOHIMA'],
  'Odisha': ['OD-BHUBANESWAR'],
  'Punjab': ['PB-PUNJAB'],
  'Rajasthan': ['RJ-JAIPUR'],
  'Sikkim': ['SK-GANGTOK'],
  'Tamil Nadu': ['TN-CHENNAI'],
  'Telangana': ['TG-HYDERABAD'],
  'Tripura': ['TR-AGARTALA'],
  'Uttar Pradesh': ['UP-LUCKNOW', 'UP-KANPUR'],
  'Uttarakhand': ['UT-DEHRADUN'],
  'West Bengal': ['WB-KOLKATA']
};

export const CAS: Record<string, string[]> = {
  'AP-VISAKHAPATNAM': ['AP-VIZ-CA001', 'AP-VIZ-CA002', 'AP-VIZ-CA003'],
  'AP-HYDERABAD': ['AP-HYD-CA001', 'AP-HYD-CA002'],
  'AS-GUWAHATI': ['AS-GUW-CA001'],
  'BR-PATNA': ['BR-PAT-CA001'],
  'CG-RAIPUR': ['CG-RAI-CA001'],
  'DL-DELHI': ['DL-DEL-CA001', 'DL-DEL-CA002'],
  'GA-PANAJI': ['GA-PAN-CA001'],
  'GJ-AHMEDABAD': ['GJ-AHM-CA001', 'GJ-AHM-CA002'],
  'GJ-SURAT': ['GJ-SUR-CA001'],
  'HR-GURUGRAM': ['HR-GUR-CA001'],
  'HP-SHIMLA': ['HP-SHM-CA001'],
  'JH-RANCHI': ['JH-RAN-CA001'],
  'KA-BANGALORE': ['KA-BLR-CA001', 'KA-BLR-CA002'],
  'KA-MYSORE': ['KA-MYS-CA001'],
  'KL-KOCHI': ['KL-KOC-CA001'],
  'MP-INDORE': ['MP-IND-CA001'],
  'MH-MUMBAI': ['MH-MUM-CA001', 'MH-MUM-CA002', 'MH-MUM-CA003'],
  'MH-PUNE': ['MH-PUN-CA001'],
  'MN-IMPHAL': ['MN-IMP-CA001'],
  'ML-SHILLONG': ['ML-SHL-CA001'],
  'MZ-AIZAWL': ['MZ-AIZ-CA001'],
  'NL-KOHIMA': ['NL-KOH-CA001'],
  'OD-BHUBANESWAR': ['OD-BHU-CA001'],
  'PB-PUNJAB': ['PB-PUN-CA001'],
  'RJ-JAIPUR': ['RJ-JAI-CA001', 'RJ-JAI-CA002'],
  'SK-GANGTOK': ['SK-GAN-CA001'],
  'TN-CHENNAI': ['TN-CHN-CA001', 'TN-CHN-CA002'],
  'TG-HYDERABAD': ['TG-HYD-CA001'],
  'TR-AGARTALA': ['TR-AGA-CA001'],
  'UP-LUCKNOW': ['UP-LKN-CA001'],
  'UP-KANPUR': ['UP-KNP-CA001'],
  'UT-DEHRADUN': ['UT-DEH-CA001'],
  'WB-KOLKATA': ['WB-KOL-CA001', 'WB-KOL-CA002']
};

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
  const billBeforeLPS = fixedCharge + energyCharge + excessCharge + pfPenalty - pfIncentive + todViolation + lvSurcharge + meterRent;
  const latePayment = seed(s + 60) < 0.20 ? Math.round(billBeforeLPS * 0.02) : 0;

  /* Arrears — occasional adjustments */
  const arrears = seed(s + 70) < 0.15 ? Math.round(sr(s + 71, -5000, 8000)) : 0;

  /* ── TOTAL BILL ──
     = Fixed charge + Energy charge + Excess demand charge
     + PF penalty − PF incentive + TOD violation
     + LV surcharge + Meter rent + Late payment + Arrears */
  const totalBill = billBeforeLPS + latePayment + arrears;

  /* Total leakage = all avoidable charges */
  const totalLeakage = excessCharge + pfPenalty + todViolation + lvSurcharge + latePayment;

  return {
    mdi, contracted: p.contracted, sanctioned: p.sanctioned, connected: p.connected,
    kwh, fixedCharge, energyCharge, excessCharge, pfPenalty, pfIncentive,
    todViolation, lvSurcharge, meterRent, latePayment, arrears, totalBill,
    totalLeakage, pf, excessKVA
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
