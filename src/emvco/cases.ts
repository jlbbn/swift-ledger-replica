// ─── Catálogo de casos de prueba EMVCo L3 ────────────────────────────────────
// Cada caso empaqueta su wire ISO 8583 real (packISO), lo muestra en el monitor,
// ejecuta la lógica del host y compara esperado vs actual. Los casos son puros
// salvo L3-12 (flujo end-to-end que persiste cola/ledger para evidencia).

import {
  enqueueOfflineSale, evaluateOfflineEnqueue, getAcquirerProfile, handleEchoTest,
  loadLedger, processOfflineBatch, processReversal, validateTransaction,
} from "./host.ts";
import type { AcquirerProfile, HostLogKind, QueuedSale } from "./host.ts";
import {
  batch0420Fields, echo0800Fields, packISO, response0210Fields, reversal0400Fields, sale0200Fields,
} from "./iso8583.ts";
import { iccDataTLV, TEST_CARDS } from "./cards.ts";
import type { TerminalProfile } from "./profile.ts";
import { nowMx, randNum } from "../lib/format.ts";

export interface CaseCtx {
  profile: TerminalProfile;
  push: (kind: HostLogKind, text: string) => void;
  runId: string;
}

export interface CaseResult {
  id: string;
  name: string;
  mti: string;
  objective: string;
  expected: string;
  actual: string;
  pass: boolean;
}

interface CertCase {
  id: string;
  name: string;
  mti: string;
  objective: string;
  expected: string;
  run: (ctx: CaseCtx) => Promise<{ actual: string; pass: boolean }>;
}

const st = () => randNum(6);
const mkQueueItem = (ref: string, total: number, entryMode = "CHIP"): QueuedSale => ({
  id: `Q${Date.now()}${randNum(3)}`, ref, total, entryMode, time: nowMx(), authCode: randNum(6), stan: st(),
});

const txWire = (ctx: CaseCtx, packed: { ascii: string; wireHex: string }) => {
  ctx.push("tx", `→ ${packed.ascii}`);
  ctx.push("tx", `  wire ${packed.wireHex}`);
};
const rxWire = (ctx: CaseCtx, packed: { ascii: string; wireHex: string }) => {
  ctx.push("rx", `← ${packed.ascii}`);
  ctx.push("rx", `  wire ${packed.wireHex}`);
};

const acq = (p: TerminalProfile, over: Partial<AcquirerProfile> = {}): AcquirerProfile => ({ ...getAcquirerProfile(p), ...over });

export const CERT_CASES: CertCase[] = [
  {
    id: "L3-01", name: "Logon / Echo test", mti: "0800",
    objective: "Verificar conectividad y logon con el host (Network Management).",
    expected: "MTI 0810 · DE39 00",
    run: async (ctx) => {
      const s = st();
      txWire(ctx, packISO("0800", echo0800Fields(ctx.profile, s)));
      const a = await handleEchoTest({ terminalId: ctx.profile.terminalId, serial: ctx.profile.serial }, { onLog: ctx.push, latencyMs: 250 });
      rxWire(ctx, packISO("0810", response0210Fields(a)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: a.approved && a.responseCode === "00" };
    },
  },
  {
    id: "L3-02", name: "Venta chip aprobada (ARQC)", mti: "0200",
    objective: "Venta con chip lectura EMV — DE55 con ARQC válido.",
    expected: "MTI 0210 · DE39 00",
    run: async (ctx) => {
      const card = TEST_CARDS[0];
      const s = st();
      const amount = 250.5;
      txWire(ctx, packISO("0200", sale0200Fields({
        amount, entryMode: "CHIP", stanStr: s, profile: ctx.profile,
        pan: card.pan, exp: card.exp, icc: iccDataTLV(card, Math.round(amount * 100)),
      })));
      const a = validateTransaction({ mti: "0200", amount, entryMode: "CHIP" }, acq(ctx.profile));
      rxWire(ctx, packISO("0210", response0210Fields(a, s)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: a.approved && a.responseCode === "00" };
    },
  },
  {
    id: "L3-03", name: "Bloqueo de fallback a banda", mti: "0200",
    objective: "DE22=02 (banda) con perfil TMS que exige chip → rechazo de fallback.",
    expected: "MTI 0210 · DE39 81",
    run: async (ctx) => {
      const card = TEST_CARDS[1];
      const s = st();
      txWire(ctx, packISO("0200", sale0200Fields({
        amount: 100, entryMode: "BANDA", stanStr: s, profile: ctx.profile,
        pan: card.pan, exp: card.exp,
      })));
      const a = validateTransaction({ mti: "0200", amount: 100, entryMode: "BANDA" }, acq(ctx.profile, { fallbackAllowed: false }));
      rxWire(ctx, packISO("0210", response0210Fields(a)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: !a.approved && a.responseCode === "81" };
    },
  },
  {
    id: "L3-04", name: "Fallback permitido (perfil laxo)", mti: "0200",
    objective: "Control: con MAGSTRIPE FALLBACK = SI la banda es aceptada.",
    expected: "MTI 0210 · DE39 00",
    run: async (ctx) => {
      const s = st();
      txWire(ctx, packISO("0200", sale0200Fields({ amount: 100, entryMode: "BANDA", stanStr: s, profile: ctx.profile })));
      const a = validateTransaction({ mti: "0200", amount: 100, entryMode: "BANDA" }, acq(ctx.profile, { fallbackAllowed: true }));
      rxWire(ctx, packISO("0210", response0210Fields(a)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: a.approved && a.responseCode === "00" };
    },
  },
  {
    id: "L3-05", name: "Declinación forzada por perfil", mti: "0200",
    objective: "Switch de pruebas del TMS (forceDecline) → do not honor.",
    expected: "MTI 0210 · DE39 05",
    run: async (ctx) => {
      const s = st();
      txWire(ctx, packISO("0200", sale0200Fields({ amount: 100, entryMode: "CHIP", stanStr: s, profile: ctx.profile })));
      const a = validateTransaction({ mti: "0200", amount: 100, entryMode: "CHIP" }, acq(ctx.profile, { forceDecline: true }));
      rxWire(ctx, packISO("0210", response0210Fields(a)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: !a.approved && a.responseCode === "05" };
    },
  },
  {
    id: "L3-06", name: "Monto inválido", mti: "0200",
    objective: "DE4 = 0 → invalid amount antes de cualquier política.",
    expected: "MTI 0210 · DE39 13",
    run: async (ctx) => {
      const s = st();
      txWire(ctx, packISO("0200", sale0200Fields({ amount: 0, entryMode: "CHIP", stanStr: s, profile: ctx.profile })));
      const a = validateTransaction({ mti: "0200", amount: 0, entryMode: "CHIP" }, acq(ctx.profile));
      rxWire(ctx, packISO("0210", response0210Fields(a)));
      return { actual: `MTI ${a.mti} · DE39 ${a.responseCode}`, pass: !a.approved && a.responseCode === "13" };
    },
  },
  {
    id: "L3-07", name: "Lote dentro de floor limit", mti: "0420",
    objective: "Batch upload: ítems bajo el tope offline → aprobados en conciliación.",
    expected: "2 aprobadas · 0 rechazadas",
    run: async (ctx) => {
      const queue = [mkQueueItem("FLUJO7A", 100), mkQueueItem("FLUJO7B", 250.5)];
      for (const q of queue) txWire(ctx, packISO("0420", batch0420Fields(q, ctx.profile)));
      const r = await processOfflineBatch(queue, { onLog: ctx.push, dryRun: true, batchId: `${ctx.runId}-L3-07` });
      for (const i of r.items) rxWire(ctx, packISO("0430", response0210Fields({ stan: queue.find((q) => q.ref === i.ref)?.stan ?? st(), responseCode: i.responseCode })));
      return { actual: `${r.approved} aprobadas · ${r.rejected} rechazadas`, pass: r.approved === 2 && r.rejected === 0 };
    },
  },
  {
    id: "L3-08", name: "Lote excede floor limit", mti: "0420",
    objective: "Ítem sobre offlineMaxAmount → Rechazada en Conciliación (host revalida en 0420).",
    expected: "1 rechazada · DE39 61",
    run: async (ctx) => {
      const queue = [mkQueueItem("FLUJO8A", 100), mkQueueItem("FLUJO8B", ctx.profile.offlineMaxAmount + 1000)];
      for (const q of queue) txWire(ctx, packISO("0420", batch0420Fields(q, ctx.profile)));
      const r = await processOfflineBatch(queue, { onLog: ctx.push, dryRun: true, batchId: `${ctx.runId}-L3-08` });
      for (const i of r.items) rxWire(ctx, packISO("0430", response0210Fields({ stan: queue.find((q) => q.ref === i.ref)?.stan ?? st(), responseCode: i.responseCode })));
      const over = r.items.find((i) => i.decision === "REJECTED");
      return { actual: `${r.approved} aprobadas · ${r.rejected} rechazadas · DE39 ${over?.responseCode ?? "—"}`, pass: r.rejected === 1 && over?.responseCode === "61" };
    },
  },
  {
    id: "L3-09", name: "Cola llena → rechazo en terminal", mti: "—",
    objective: "Encolado offline con cola al máximo del perfil → declinación local.",
    expected: "MEMORIA LLENA — HAGA CIERRE DE LOTE",
    run: async (ctx) => {
      const gate = evaluateOfflineEnqueue(ctx.profile.offlineMaxQueue, 10, ctx.profile);
      const actual = gate.ok ? "ENCOLADA (inesperado)" : gate.error;
      ctx.push("err", `↛ TERMINAL · ${actual}`);
      return { actual, pass: !gate.ok && gate.error.includes("MEMORIA LLENA") };
    },
  },
  {
    id: "L3-10", name: "REF/STAN duplicado en lote", mti: "0420",
    objective: "Dos ítems con la misma referencia en un lote → duplicate transmission.",
    expected: "2ª ítem rechazada · DE39 94",
    run: async (ctx) => {
      const queue = [mkQueueItem("DUP0001", 100), { ...mkQueueItem("DUP0001", 150) }];
      for (const q of queue) txWire(ctx, packISO("0420", batch0420Fields(q, ctx.profile)));
      const r = await processOfflineBatch(queue, { onLog: ctx.push, dryRun: true, batchId: `${ctx.runId}-L3-10` });
      const dup = r.items[1];
      return { actual: `ítem 2 → DE39 ${dup.responseCode} · ${dup.decision}`, pass: dup.decision === "REJECTED" && dup.responseCode === "94" };
    },
  },
  {
    id: "L3-11", name: "Reversión por timeout", mti: "0200→0400",
    objective: "Sin respuesta 0210 en 8s → reversión 0400 que conserva el STAN.",
    expected: "MTI 0410 · DE39 00 · mismo STAN",
    run: async (ctx) => {
      const s = st();
      txWire(ctx, packISO("0200", sale0200Fields({ amount: 500, entryMode: "CHIP", stanStr: s, profile: ctx.profile })));
      const original = validateTransaction({ mti: "0200", amount: 500, entryMode: "CHIP" }, acq(ctx.profile));
      ctx.push("err", `✗ TIMEOUT esperando 0210 (8s) · STAN ${s} sin respuesta — iniciando reversión`);
      txWire(ctx, packISO("0400", reversal0400Fields(original)));
      const rev = await processReversal(original, { onLog: ctx.push, latencyMs: 200 });
      rxWire(ctx, packISO("0410", response0210Fields(rev)));
      return { actual: `MTI ${rev.mti} · DE39 ${rev.responseCode} · STAN ${rev.stan}`, pass: rev.approved && rev.stan === original.stan };
    },
  },
  {
    id: "L3-12", name: "Flujo completo offline + cierre", mti: "0200+0420",
    objective: "Venta forzada encolada → cierre de lote → Ledger PENDING → SETTLED.",
    expected: "1 SETTLED en ledger · cola vacía",
    run: async (ctx) => {
      const enq = enqueueOfflineSale({ amount: 75, entryMode: "CHIP" });
      if ("error" in enq) return { actual: `ENCOLADO RECHAZADO: ${enq.error}`, pass: false };
      ctx.push("info", `S&F · venta ${enq.item.ref} sellada (auth ${enq.item.authCode}) · ledger PENDING`);
      const r = await processOfflineBatch(undefined, { onLog: ctx.push, batchId: `${ctx.runId}-L3-12` });
      const settled = loadLedger().some((e) => e.id === enq.item.id && e.status === "SETTLED");
      return { actual: `${r.approved}/${r.received} liquidadas · ledger ${settled ? "SETTLED ✓" : "sin cambio ✗"}`, pass: r.approved === 1 && settled };
    },
  },
];

export async function runCaseById(id: string, ctx: CaseCtx): Promise<CaseResult> {
  const c = CERT_CASES.find((x) => x.id === id);
  if (!c) throw new Error(`caso ${id} no existe`);
  ctx.push("info", `▶ ${c.id} · ${c.name}`);
  const r = await c.run(ctx);
  ctx.push(r.pass ? "info" : "err", `${r.pass ? "✓" : "✗"} ${c.id} — esperado: ${c.expected} · obtenido: ${r.actual}`);
  return { id: c.id, name: c.name, mti: c.mti, objective: c.objective, expected: c.expected, actual: r.actual, pass: r.pass };
}

export async function runAllCases(ctx: CaseCtx): Promise<CaseResult[]> {
  const out: CaseResult[] = [];
  for (const c of CERT_CASES) out.push(await runCaseById(c.id, ctx));
  const passed = out.filter((r) => r.pass).length;
  ctx.push("info", `CATÁLOGO L3 COMPLETO: ${passed}/${out.length} casos en verde`);
  return out;
}
