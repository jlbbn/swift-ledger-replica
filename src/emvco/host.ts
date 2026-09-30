// ─── EMVCo L3 · Host Adquirente MOCK — entorno de certificación ──────────────
// Simulador lógico del autorizador para correr y auditar las pruebas en local:
//   T1  Red          — MTI 0800 (Network Management)  → 0810 · DE39 "00"
//   T2  Fallback     — MTI 0200 con POS Entry Mode banda (DE22=02) vs perfil
//                      TMS que exige chip (05) → rechazo DE39 "81" / "05"
//   T3  Store & Fwd  — MTI 0420 (Batch Upload) con floor limits del perfil TMS;
//                      excedidas = "Rechazada en Conciliación" (DE39 61);
//                      las válidas PENDING → SETTLED en el Ledger global.
//
// T4/T5 (hardware HSM L1/L2 y red directa) quedan SKIPPED: justifican la ruta BaaS.
// Puro estado y lógica — los resultados se imprimen SIEMPRE en consola con el
// prefix [EMVCo L3 · HOST MOCK] y, opcionalmente, al monitor vía `onLog`.

import { loadProfile } from "./profile.ts";
import type { TerminalProfile } from "./profile.ts";
import { nowMx, randNum } from "../lib/format.ts";

// ─── Tipos ISO 8583 (subset del harness) ─────────────────────────────────────
export type ResponseCode = "00" | "05" | "12" | "13" | "61" | "81";

// DE22 — PAN Entry Mode: 02 banda · 05 chip · 07 CTLS chip · 91 CTLS banda
export type EntryModeCode = "02" | "05" | "07" | "91";

export const RESPONSE_TEXT: Record<ResponseCode, string> = {
  "00": "APPROVED",
  "05": "DO NOT HONOR",
  "12": "INVALID TRANSACTION",
  "13": "INVALID AMOUNT",
  "61": "EXCEEDS FLOOR LIMIT — RECHAZADA EN CONCILIACIÓN",
  "81": "PIN CRYPTOGRAPHIC ERROR — FALLBACK NO PERMITIDO",
};

export interface AcquirerProfile {
  terminalId: string;
  requiredEntryMode: EntryModeCode;
  fallbackAllowed: boolean;
  fallbackDeclineCode: Extract<ResponseCode, "81" | "05">;
  offlineMaxAmount: number;
  offlineMaxQueue: number;
  forceDecline: boolean;
  currency: string;
}

export interface HostAdvice {
  mti: string;
  stan: string;
  responseCode: ResponseCode;
  approved: boolean;
  detail: string;
}

export type HostLogKind = "tx" | "rx" | "err" | "info" | "audit";
export type HostLogFn = (kind: HostLogKind, text: string) => void;

export interface HostOpts {
  onLog?: HostLogFn;
  latencyMs?: number;
}

// ─── Logger dual: consola del navegador (siempre) + monitor (opcional) ───────
function hostLog(onLog: HostLogFn | undefined, kind: HostLogKind, text: string) {
  console.log(`[EMVCo L3 · HOST MOCK] ${text}`);
  onLog?.(kind, text);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stan = () => randNum(6); // DE11

export function getAcquirerProfile(cfg: TerminalProfile = loadProfile()): AcquirerProfile {
  return {
    terminalId: cfg.terminalId,
    requiredEntryMode: "05",
    fallbackAllowed: cfg.magstripeFallback,
    fallbackDeclineCode: "81",
    offlineMaxAmount: cfg.offlineMaxAmount,
    offlineMaxQueue: cfg.offlineMaxQueue,
    forceDecline: cfg.forceDecline,
    currency: cfg.currency,
  };
}

// ─── Estado global del entorno (cola + ledger, localStorage) ─────────────────
export interface QueuedSale {
  id: string;
  ref: string;
  total: number; // unidades
  entryMode: string;
  time: string;
  authCode: string | null;
}

export interface LedgerEntry {
  id: string;
  ref: string;
  authCode: string | null;
  time: string;
  amountCents: number;
  currency: string;
  status: "PENDING" | "SETTLED";
  detail: string;
}

const QUEUE_KEY = "emvco-cert-queue";
const LEDGER_KEY = "emvco-cert-ledger";

export function loadQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function saveQueue(q: QueuedSale[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* noop */ }
}
export function loadLedger(): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function saveLedger(entries: LedgerEntry[]) {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(entries)); } catch { /* noop */ }
}

// Encolado Store & Forward — sella AuthCode + BankReference + Timestamp
export function enqueueOfflineSale(input: { amount: number; entryMode: string; ref?: string }): { item: QueuedSale; entry: LedgerEntry } | { error: string } {
  const profile = loadProfile();
  if (!(input.amount > 0)) return { error: "MONTO INVÁLIDO" };
  if (input.amount > profile.offlineMaxAmount) {
    return { error: `EXCEDE LÍMITE OFFLINE (TOPE $${profile.offlineMaxAmount}) — DECLINADA EN TERMINAL` };
  }
  if (loadQueue().length >= profile.offlineMaxQueue) return { error: "MEMORIA LLENA — HAGA CIERRE DE LOTE" };
  const ref = (input.ref ?? `SF${randNum(10)}`).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || `SF${randNum(10)}`;
  const item: QueuedSale = {
    id: `Q${Date.now()}${randNum(3)}`,
    ref,
    total: input.amount,
    entryMode: input.entryMode,
    time: nowMx(),
    authCode: randNum(6),
  };
  const entry: LedgerEntry = {
    id: item.id,
    ref,
    authCode: item.authCode,
    time: item.time,
    amountCents: Math.round(item.total * 100),
    currency: profile.currency,
    status: "PENDING",
    detail: `Venta forzada offline · ${input.entryMode}`,
  };
  saveQueue([...loadQueue(), item]);
  saveLedger([...loadLedger(), entry]);
  return { item, entry };
}

// ─── T1 · Test de Red — MTI 0800 → 0810 · DE39 "00" ──────────────────────────
export interface EchoRequest {
  terminalId?: string;
  serial?: string;
  networkMgmt?: string; // DE70
}

export async function handleEchoTest(req: EchoRequest = {}, opts: HostOpts = {}): Promise<HostAdvice> {
  const profile = getAcquirerProfile();
  const tid = req.terminalId ?? profile.terminalId;
  const de70 = req.networkMgmt ?? "001";
  hostLog(opts.onLog, "tx", `← MTI 0800 NETWORK MGMT · TID ${tid} · DE70 ${de70} · ${req.serial ?? "—"}`);
  await sleep(opts.latencyMs ?? 400);
  const advice: HostAdvice = {
    mti: "0810",
    stan: stan(),
    responseCode: "00",
    approved: true,
    detail: `ECHO OK · LOGON ACEPTADO · DE39 00 (${RESPONSE_TEXT["00"]})`,
  };
  hostLog(opts.onLog, "rx", `→ MTI ${advice.mti} · STAN ${advice.stan} · DE39 ${advice.responseCode} · ${advice.detail}`);
  return advice;
}

// ─── T2 · Bloqueo de Fallback — MTI 0200 → 0210 ──────────────────────────────
export interface TxnPayload {
  mti?: string;
  amount?: number;
  entryMode?: string | null;
  cardNumber?: string | null;
  protocol?: string;
  terminalId?: string;
}

const ENTRY_MODE_TO_DE22: Record<string, EntryModeCode> = { CHIP: "05", CTLS: "07", BANDA: "02" };

export function parseEntryMode(raw?: string | null): EntryModeCode | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  if (up in ENTRY_MODE_TO_DE22) return ENTRY_MODE_TO_DE22[up];
  return (["02", "05", "07", "91"] as const).includes(up as EntryModeCode) ? (up as EntryModeCode) : null;
}

export function validateTransaction(payload: TxnPayload, profile: AcquirerProfile = getAcquirerProfile()): HostAdvice {
  const em = parseEntryMode(payload.entryMode);
  let code: ResponseCode = "00";
  let detail = RESPONSE_TEXT["00"];

  if (typeof payload.amount === "number" && !(payload.amount > 0)) {
    code = "13"; detail = `MONTO INVÁLIDO (${payload.amount}) — DE39 13`;
  } else if (em === null) {
    code = "12"; detail = `POS ENTRY MODE INVÁLIDO (${String(payload.entryMode)}) — DE39 12`;
  } else if ((em === "02" || em === "91") && profile.requiredEntryMode === "05" && !profile.fallbackAllowed) {
    code = profile.fallbackDeclineCode;
    detail = `FALLBACK A BANDA (DE22 ${em}) NO PERMITIDO — PERFIL TMS EXIGE CHIP (05) · DE39 ${code}`;
  } else if (profile.forceDecline) {
    code = "05"; detail = "FORZAR DECLINACIÓN ACTIVO EN PERFIL TMS — DE39 05";
  }

  const advice: HostAdvice = {
    mti: "0210",
    stan: stan(),
    responseCode: code,
    approved: code === "00",
    detail,
  };
  hostLog(undefined, advice.approved ? "rx" : "err",
    `${advice.approved ? "→" : "↛"} MTI ${advice.mti} · STAN ${advice.stan} · DE22 ${em ?? "??"} · DE39 ${code} · ${detail}`);
  return advice;
}

// ─── T3 · Store & Forward / Floor Limits — MTI 0420 → 0430 ──────────────────
export type BatchDecision = "APPROVED" | "REJECTED";

export interface BatchItemResult {
  queueId: string;
  ref: string;
  amountCents: number;
  entryMode: string;
  decision: BatchDecision;
  responseCode: ResponseCode;
  detail: string;
}

export interface BatchSettlementResult {
  batchId: string;
  received: number;
  approved: number;
  rejected: number;
  approvedCents: number;
  rejectedCents: number;
  items: BatchItemResult[];
}

export interface BatchOpts extends HostOpts {
  profile?: AcquirerProfile;
  batchId?: string;
  dryRun?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export async function processOfflineBatch(batchQueue?: QueuedSale[], opts: BatchOpts = {}): Promise<BatchSettlementResult> {
  const profile = opts.profile ?? getAcquirerProfile();
  const queue = batchQueue ?? loadQueue();
  const batchId = opts.batchId ?? `B${Date.now()}`;
  const limitCents = Math.round(profile.offlineMaxAmount * 100);
  const result: BatchSettlementResult = {
    batchId, received: queue.length, approved: 0, rejected: 0, approvedCents: 0, rejectedCents: 0, items: [],
  };

  hostLog(opts.onLog, "tx", `← MTI 0420 BATCH UPLOAD · ${batchId} · ${queue.length} ítem(s) · floor limit $${profile.offlineMaxAmount} ${profile.currency} (${limitCents}¢)`);

  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    const amountCents = Math.round(q.total * 100);
    opts.onProgress?.(i + 1, queue.length);
    await sleep(opts.latencyMs ?? 180);

    // El host RE-VALIDA cada ítem contra los floor limits del perfil TMS
    const overLimit = amountCents > limitCents;
    const item: BatchItemResult = overLimit
      ? { queueId: q.id, ref: q.ref, amountCents, entryMode: q.entryMode, decision: "REJECTED", responseCode: "61",
          detail: `RECHAZADA EN CONCILIACIÓN — EXCEDE FLOOR LIMIT OFFLINE ($${profile.offlineMaxAmount}) · DE39 61` }
      : { queueId: q.id, ref: q.ref, amountCents, entryMode: q.entryMode, decision: "APPROVED", responseCode: "00",
          detail: "APROBADA EN CONCILIACIÓN · DE39 00" };
    result.items.push(item);
    if (item.decision === "APPROVED") { result.approved++; result.approvedCents += amountCents; }
    else { result.rejected++; result.rejectedCents += amountCents; }
    hostLog(opts.onLog, item.decision === "APPROVED" ? "rx" : "err",
      `→ MTI 0430 [${i + 1}/${queue.length}] · ${q.ref} · ${amountCents}¢ · DE39 ${item.responseCode} · ${item.detail}`);
  }

  if (opts.dryRun) {
    hostLog(opts.onLog, "info", `BATCH UPLOAD ${batchId} (dry-run): ${result.approved} aprobadas · ${result.rejected} rechazada(s) · sin mutación de estado`);
    return result;
  }

  // Conciliación contra el Ledger global: aprobadas PENDING → SETTLED;
  // rechazadas salen del pool PENDING (su traza queda en el reporte y la auditoría).
  const approvedIds = new Set(result.items.filter((i) => i.decision === "APPROVED").map((i) => i.queueId));
  const rejectedIds = new Set(result.items.filter((i) => i.decision === "REJECTED").map((i) => i.queueId));
  const nextLedger = loadLedger()
    .map((e) => approvedIds.has(e.id) && e.status === "PENDING"
      ? { ...e, status: "SETTLED" as const, detail: `${e.detail} · liquidada en ${batchId} (DE39 00)` }
      : e)
    .filter((e) => !(rejectedIds.has(e.id) && e.status === "PENDING"));
  saveLedger(nextLedger);
  saveQueue(loadQueue().filter((q) => !approvedIds.has(q.id) && !rejectedIds.has(q.id)));

  hostLog(opts.onLog, "info", `BATCH UPLOAD ${batchId} conciliado: ${result.approved}/${result.received} SETTLED (${result.approvedCents}¢) · ${result.rejected} rechazada(s) en conciliación (${result.rejectedCents}¢) · Ledger y cola actualizados`);
  return result;
}

// ─── Suite EMVCo L3 ──────────────────────────────────────────────────────────
// T1–T3 lógicas locales. T4/T5 físicas/de red: SKIPPED — justifican ruta BaaS.
export interface SuiteResult {
  passed: number;
  failed: number;
  skipped: number;
  tests: { name: string; ok: boolean; skipped: boolean; detail: string }[];
}

export async function runEmvcoTestSuite(opts: HostOpts = {}): Promise<SuiteResult> {
  const profile = getAcquirerProfile();
  const suite: SuiteResult = { passed: 0, failed: 0, skipped: 0, tests: [] };
  const check = (name: string, ok: boolean, detail: string) => {
    const skipped = !ok && detail.startsWith("SKIPPED");
    suite.tests.push({ name, ok, skipped, detail });
    if (skipped) suite.skipped++;
    else if (ok) suite.passed++;
    else suite.failed++;
    hostLog(opts.onLog, ok || skipped ? "info" : "err",
      `SUITE ${ok ? "✓" : skipped ? "⊘" : "✗"} ${name} — ${detail}`);
  };

  const echo = await handleEchoTest({}, { onLog: opts.onLog });
  check("T1 ECHO (MTI 0800)", echo.responseCode === "00", `MTI ${echo.mti} · DE39 ${echo.responseCode}`);

  const fb = validateTransaction({ mti: "0200", amount: 100, entryMode: "BANDA" }, { ...profile, fallbackAllowed: false });
  check("T2 FALLBACK BLOQUEADO (MTI 0200 · DE22 02)", !fb.approved && fb.responseCode === "81", `DE39 ${fb.responseCode}`);

  const chip = validateTransaction({ mti: "0200", amount: 100, entryMode: "CHIP" }, { ...profile, fallbackAllowed: false });
  check("T2b CHIP PERMITIDO (control)", chip.approved && chip.responseCode === "00", `DE39 ${chip.responseCode}`);

  const over = profile.offlineMaxAmount + 1000;
  const batch = await processOfflineBatch(
    [
      { id: "T3A", ref: "SUITEOK1", total: 100, entryMode: "CHIP", time: nowMx(), authCode: null },
      { id: "T3B", ref: "SUITEOVER", total: over, entryMode: "CHIP", time: nowMx(), authCode: null },
    ],
    { onLog: opts.onLog, dryRun: true, batchId: `SUITE-${Date.now()}` },
  );
  const overItem = batch.items.find((i) => i.queueId === "T3B");
  check("T3 FLOOR LIMIT (MTI 0420)", batch.rejected === 1 && overItem?.decision === "REJECTED" && overItem.responseCode === "61",
    `${batch.approved} aprobada(s) · ${batch.rejected} rechazada(s) · DE39 ${overItem?.responseCode ?? "—"}`);

  check("T4 CERTIFICACIÓN FÍSICA L1/L2 HSM", false,
    "SKIPPED - Requiere Hardware HSM > $15,000 USD (Fuera de alcance Fase 1)");
  check("T5 CONEXIÓN DIRECTA RED ADQUIRENTE", false,
    "SKIPPED - Requiere Auditoría PCI-DSS > $12,000 USD (Migrando a ruta BaaS/API de $3,000 USD)");

  hostLog(opts.onLog, "info",
    `SUITE EMVCo L3: ${suite.passed} OK · ${suite.skipped} SKIPPED (Requieren fondeo externo)${suite.failed ? ` · ${suite.failed} FALLIDA(S)` : ""}`);
  return suite;
}
