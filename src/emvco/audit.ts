// ─── Auditoría certificada (evidence trail) del entorno EMVCo ────────────────
// Cadena append-only con encadenamiento hash SHA-256: cada registro sella el
// hash del anterior, de modo que alterar cualquier evidencia rompe la cadena
// en la verificación. Cada corrida de pruebas agrupa sus evidencias bajo un
// `runId` (R<timestamp>) para trazabilidad de la ejecución. Exportable a
// JSON (paquete de certificación) y CSV (hoja de evidencias).

export type AuditVerdict = "PASS" | "FAIL" | "SKIPPED";

export interface AuditRecord {
  seq: number;
  id: string;
  runId: string;
  time: string;
  operator: string;
  test: string;
  mti: string;
  stan: string;
  responseCode: string;
  verdict: AuditVerdict;
  detail: string;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export interface AuditVerification {
  ok: boolean;
  records: number;
  brokenSeq?: number;
}

const AUDIT_KEY = "emvco-cert-audit";
export const AUDIT_GENESIS = "GENESIS";

export function newRunId(): string {
  return `R${Date.now()}`;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readChain(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeChain(chain: AuditRecord[]) {
  try { localStorage.setItem(AUDIT_KEY, JSON.stringify(chain)); } catch { /* storage lleno */ }
}

export function loadAudit(): AuditRecord[] {
  return readChain();
}

export async function appendAudit(input: {
  runId?: string;
  operator: string;
  test: string;
  mti: string;
  stan: string;
  responseCode: string;
  verdict: AuditVerdict;
  detail: string;
  payload: unknown;
}): Promise<AuditRecord> {
  const chain = readChain();
  const prev = chain[chain.length - 1];
  const record: AuditRecord = {
    seq: chain.length + 1,
    id: `A${Date.now()}${Math.floor(Math.random() * 1000)}`,
    runId: (input.runId ?? "—").slice(0, 24),
    time: new Date().toISOString(),
    operator: input.operator.slice(0, 24),
    test: input.test.slice(0, 80),
    mti: input.mti,
    stan: input.stan,
    responseCode: input.responseCode,
    verdict: input.verdict,
    detail: input.detail.slice(0, 200),
    payload: input.payload,
    prevHash: prev?.hash ?? AUDIT_GENESIS,
    hash: "",
  };
  record.hash = await sha256(JSON.stringify({ ...record, hash: undefined }));
  chain.push(record);
  writeChain(chain.slice(-500)); // ventana de 500 evidencias
  return record;
}

// Verificación de integridad: recomputa cada hash y el encadenamiento completo.
export async function verifyAudit(): Promise<AuditVerification> {
  const chain = readChain();
  let prevHash = AUDIT_GENESIS;
  for (const rec of chain) {
    const recomputed = await sha256(JSON.stringify({ ...rec, hash: undefined }));
    if (recomputed !== rec.hash || rec.prevHash !== prevHash) {
      return { ok: false, records: chain.length, brokenSeq: rec.seq };
    }
    prevHash = rec.hash;
  }
  return { ok: true, records: chain.length };
}

// Evidencia exportable (paquete de certificación).
export function exportAuditPackage(operator: string): string {
  const chain = readChain();
  return JSON.stringify({
    package: "swift-ledger-emvco-l3-audit",
    exportedAt: new Date().toISOString(),
    exportedBy: operator,
    environment: "certification-mock",
    records: chain.length,
    chain,
  }, null, 2);
}

// Hoja de evidencias CSV (seq,runId,sello,operador,prueba,mti,stan,de39,veredicto,detail,hash).
export function exportAuditCSV(): string {
  const chain = readChain();
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const header = "seq,runId,time,operator,test,mti,stan,responseCode,verdict,detail,hash";
  const rows = chain.map((r) => [
    r.seq, esc(r.runId), esc(r.time), esc(r.operator), esc(r.test), esc(r.mti), esc(r.stan),
    esc(r.responseCode), r.verdict, esc(r.detail), esc(r.hash),
  ].join(","));
  return [header, ...rows].join("\n");
}
