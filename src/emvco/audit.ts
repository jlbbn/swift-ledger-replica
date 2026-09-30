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
    environment: "emvco-l3-certification",
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

// ─── Informe de evidencias · membrete estilo documento EMVCo ─────────────────
// HTML standalone con la identidad oficial: Arial, títulos en negrita cursiva
// azul marino #003359, regla separadora verde hoja #78BE20, tablas con borde
// navy, cuerpo 10pt #333 y enlaces en azul #0000FF subrayado.
export function buildAuditReportHTML(operator: string): string {
  const chain = readChain();
  const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pass = chain.filter((r) => r.verdict === "PASS").length;
  const skipped = chain.filter((r) => r.verdict === "SKIPPED").length;
  const failed = chain.filter((r) => r.verdict === "FAIL").length;
  const rows = chain.map((r) => `
    <tr>
      <td>${r.seq}</td>
      <td>${esc(r.runId)}</td>
      <td>${esc(new Date(r.time).toLocaleString("es-MX", { hour12: false }))}</td>
      <td>${esc(r.operator)}</td>
      <td>${esc(r.test)}<div class="detail">${esc(r.detail)}</div></td>
      <td class="mono">${esc(r.mti)}</td>
      <td class="mono">${esc(r.stan)}</td>
      <td class="mono">${esc(r.responseCode)}</td>
      <td class="${r.verdict === "PASS" ? "vpass" : r.verdict === "SKIPPED" ? "vskip" : "vfail"}">${r.verdict}</td>
      <td class="mono hash">${esc(r.hash.slice(0, 20))}…</td>
    </tr>`).join("");
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>EMVCo L3 Certification · Host + Audit — Reporte de evidencias</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #333333; margin: 32px; }
  .brand { font-size: 16pt; font-weight: bold; font-style: italic; color: #003359; }
  .doc { font-size: 11pt; color: #333333; margin-top: 2px; }
  .rule { border: none; border-top: 2px solid #78BE20; margin: 10px 0 16px; }
  h2 { font-size: 14pt; font-weight: bold; font-style: italic; color: #003359; margin: 18px 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  .meta td { border: 1px solid #003359; padding: 4px 8px; font-size: 10pt; }
  .meta td.k { background: #f4f8fb; font-weight: bold; color: #003359; width: 220px; }
  .ev th { border: 1px solid #003359; color: #003359; background: #f4f8fb; padding: 4px 6px; font-size: 9pt; text-align: left; }
  .ev td { border: 1px solid #003359; padding: 4px 6px; font-size: 9pt; vertical-align: top; }
  .mono { font-family: "Courier New", monospace; }
  .hash { font-size: 8pt; color: #555; }
  .detail { font-size: 8pt; color: #666; margin-top: 2px; }
  .vpass { color: #3f7a0d; font-weight: bold; }
  .vskip { color: #b45309; font-weight: bold; }
  .vfail { color: #c62828; font-weight: bold; }
  a { color: #0000ff; text-decoration: underline; }
  .foot { margin-top: 24px; font-size: 8pt; color: #666; border-top: 1px solid #c9d3df; padding-top: 8px; }
</style>
</head>
<body>
  <div class="brand">EMVCo L3 Certification · Host + Audit</div>
  <div class="doc">Reporte de evidencias — EMVCo L3 Certification · Host + Audit</div>
  <hr class="rule">
  <table class="meta">
    <tr><td class="k">Paquete</td><td>swift-ledger-emvco-l3-audit</td></tr>
    <tr><td class="k">Generado</td><td>${esc(new Date().toLocaleString("es-MX", { hour12: false }))}</td></tr>
    <tr><td class="k">Operador</td><td>${esc(operator)}</td></tr>
    <tr><td class="k">Entorno</td><td>EMVCo L3 · ISO 8583:1993 subset</td></tr>
    <tr><td class="k">Resumen</td><td><b>${pass} PASS</b> · ${skipped} SKIPPED (requieren fondeo externo — ruta BaaS) · ${failed} FAIL</td></tr>
    <tr><td class="k">Evidencias</td><td>${chain.length} registro(s)</td></tr>
  </table>
  <h2>Evidencias (${chain.length})</h2>
  <table class="ev">
    <thead><tr>
      <th>SEQ</th><th>RUN</th><th>SELLO</th><th>OPERADOR</th><th>PRUEBA</th>
      <th>MTI</th><th>STAN</th><th>DE39</th><th>VEREDICTO</th><th>HASH</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="10">Sin evidencias registradas.</td></tr>'}</tbody>
  </table>
  <p class="foot">
    EMV®, el logotipo de EMVCo, el icono de pago EMV Secure Remote Commerce, las marcas EMV Contactless,
    las marcas EMV QR y las marcas de certificación EMVCo son marcas comerciales o marcas registradas de
    EMVCo, LLC en los Estados Unidos y en otros países, usadas aquí con fines de referencia y con permiso.
    Todos los derechos reservados. Contacto: <a href="mailto:3ds_approval@emvco.com">3ds_approval@emvco.com</a>.
    Este documento se genera en el entorno interno de certificación L3; la certificación formal
    es emitida únicamente por EMVCo.
  </p>
</body>
</html>`;
}
