// ─── Perfil TMS del terminal bajo certificación ──────────────────────────────
// Única puerta de entrada de la configuración del entorno EMVCo: todo lo que
// entre (storage, UI, perfil importado) se sanea campo a campo y se clamp a
// rangos seguros, con auto-sanación persistente (mismo patrón que la consola).

export interface TerminalProfile {
  merchant: string;
  terminalId: string;
  serial: string;
  currency: "MXN" | "USD";
  // Política de entrada (fallback)
  magstripeFallback: boolean; // MAGSTRIPE FALLBACK — si es false, el TMS exige chip (DE22 05)
  // Riesgo offline (floor limits)
  offlineMaxAmount: number;
  offlineMaxQueue: number;
  // Switch de pruebas
  forceDecline: boolean;
}

export const DEFAULT_PROFILE: TerminalProfile = {
  merchant: "SWIFT LEDGER CERT",
  terminalId: "SL-CERT-0001",
  serial: "ACBA2A93D486",
  currency: "MXN",
  magstripeFallback: true,
  offlineMaxAmount: 5000,
  offlineMaxQueue: 50,
  forceDecline: false,
};

const PROFILE_KEY = "emvco-cert-profile";

const clampNum = (v: unknown, min: number, max: number, fb: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fb;
};
const cleanStr = (v: unknown, max: number, fb: string): string => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || fb;
};

export function sanitizeProfile(raw: unknown): TerminalProfile {
  const src = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const p: TerminalProfile = {
    merchant: cleanStr(src.merchant, 40, DEFAULT_PROFILE.merchant).toUpperCase(),
    terminalId: cleanStr(src.terminalId, 20, DEFAULT_PROFILE.terminalId).toUpperCase(),
    serial: cleanStr(src.serial, 24, DEFAULT_PROFILE.serial).toUpperCase(),
    currency: src.currency === "USD" ? "USD" : "MXN",
    magstripeFallback: typeof src.magstripeFallback === "boolean" ? src.magstripeFallback : DEFAULT_PROFILE.magstripeFallback,
    offlineMaxAmount: clampNum(src.offlineMaxAmount, 0, 10000000, DEFAULT_PROFILE.offlineMaxAmount),
    offlineMaxQueue: clampNum(src.offlineMaxQueue, 1, 500, DEFAULT_PROFILE.offlineMaxQueue),
    forceDecline: typeof src.forceDecline === "boolean" ? src.forceDecline : DEFAULT_PROFILE.forceDecline,
  };
  return p;
}

export function loadProfile(): TerminalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const clean = sanitizeProfile(JSON.parse(raw));
    if (JSON.stringify(clean) !== raw) saveProfile(clean); // auto-sanación
    return clean;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(p: TerminalProfile) {
  const clean = sanitizeProfile(p);
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(clean)); } catch { /* storage lleno */ }
}
