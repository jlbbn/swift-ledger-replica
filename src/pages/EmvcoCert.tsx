import { useEffect, useRef, useState } from "react";
import { Badge, Field, Panel } from "../components/Panel.tsx";
import { fmt } from "../lib/format.ts";
import { loadProfile, saveProfile } from "../emvco/profile.ts";
import type { TerminalProfile } from "../emvco/profile.ts";
import {
  enqueueOfflineSale, getAcquirerProfile, handleEchoTest, loadLedger, loadQueue,
  processOfflineBatch, runEmvcoTestSuite, validateTransaction,
} from "../emvco/host.ts";
import type { HostLogKind, LedgerEntry, QueuedSale, SuiteResult } from "../emvco/host.ts";
import { appendAudit, exportAuditPackage, loadAudit, verifyAudit } from "../emvco/audit.ts";
import type { AuditRecord, AuditVerification } from "../emvco/audit.ts";

interface LogLine { id: number; time: string; kind: HostLogKind; text: string }

export default function EmvcoCert({ operator, notify }: { operator: string; notify: (t: string) => void }) {
  const [profile, setProfile] = useState<TerminalProfile>(loadProfile);
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [suite, setSuite] = useState<SuiteResult | null>(null);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [integrity, setIntegrity] = useState<AuditVerification | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [entryMode, setEntryMode] = useState<"CHIP" | "CTLS" | "BANDA">("CHIP");
  const [txnMode, setTxnMode] = useState<"BANDA" | "CHIP">("BANDA");
  const [txnAmount, setTxnAmount] = useState("100");
  const logId = useRef(0);
  const consoleRef = useRef<HTMLDivElement>(null);

  const push = (kind: HostLogKind, text: string) =>
    setLogs((prev) => [...prev.slice(-199), {
      id: ++logId.current,
      time: new Date().toLocaleTimeString("es-MX", { hour12: false }),
      kind, text,
    }]);

  const refresh = () => { setQueue(loadQueue()); setLedger(loadLedger()); setAudit(loadAudit()); };
  useEffect(refresh, []);
  useEffect(() => { consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight }); }, [logs]);

  const persistProfile = (p: TerminalProfile) => { setProfile(p); saveProfile(p); };

  const runT1 = async () => {
    setBusy("T1");
    const a = await handleEchoTest({ terminalId: profile.terminalId, serial: profile.serial }, { onLog: push, latencyMs: 350 });
    await appendAudit({ operator, test: "T1 ECHO (MTI 0800)", mti: a.mti, stan: a.stan, responseCode: a.responseCode, verdict: a.approved ? "PASS" : "FAIL", detail: a.detail, payload: { terminalId: profile.terminalId } });
    refresh(); setBusy(null);
    notify(`T1 ECHO · DE39 ${a.responseCode}`);
  };

  const runT2 = async () => {
    setBusy("T2");
    const amt = parseFloat(txnAmount) || 0;
    const a = validateTransaction({ mti: "0200", amount: amt, entryMode: txnMode }, getAcquirerProfile(profile));
    await appendAudit({ operator, test: `T2 AUTORIZACIÓN (MTI 0200 · DE22 ${txnMode === "BANDA" ? "02" : "05"})`, mti: a.mti, stan: a.stan, responseCode: a.responseCode, verdict: a.approved ? "PASS" : "FAIL", detail: a.detail, payload: { amount: amt, entryMode: txnMode } });
    push(a.approved ? "rx" : "err", `T2 → MTI ${a.mti} · STAN ${a.stan} · DE39 ${a.responseCode} · ${a.detail}`);
    refresh(); setBusy(null);
  };

  const runT3 = async () => {
    setBusy("T3");
    const r = await processOfflineBatch(undefined, { onLog: push, batchId: `B${Date.now()}` });
    for (const i of r.items) {
      await appendAudit({ operator, test: `T3 BATCH ${r.batchId} · ${i.ref}`, mti: "0430", stan: "—", responseCode: i.responseCode, verdict: i.decision === "APPROVED" ? "PASS" : "FAIL", detail: i.detail, payload: { amountCents: i.amountCents, entryMode: i.entryMode } });
    }
    refresh(); setBusy(null);
    notify(`T3 CIERRE DE LOTE · ${r.approved}/${r.received} liquidadas · ${r.rejected} rechazadas`);
  };

  const runSuite = async () => {
    setBusy("SUITE");
    const s = await runEmvcoTestSuite({ onLog: push });
    setSuite(s);
    for (const t of s.tests) {
      await appendAudit({ operator, test: t.name, mti: "—", stan: "—", responseCode: "—", verdict: t.skipped ? "SKIPPED" : t.ok ? "PASS" : "FAIL", detail: t.detail, payload: { suite: true } });
    }
    refresh(); setBusy(null);
    notify(`Suite EMVCo L3 · ${s.passed} OK · ${s.skipped} SKIPPED`);
  };

  const enqueue = () => {
    const amt = parseFloat(amount);
    const r = enqueueOfflineSale({ amount: Number.isFinite(amt) ? amt : 0, entryMode });
    if ("error" in r) { push("err", `VENTA OFFLINE RECHAZADA: ${r.error}`); notify(r.error); return; }
    push("info", `VENTA FORZADA guardada en cola offline (${loadQueue().length}/${profile.offlineMaxQueue}) · ${r.item.ref} · ${r.item.authCode}`);
    setAmount(""); refresh();
  };

  const checkIntegrity = async () => { setIntegrity(await verifyAudit()); };
  const exportPkg = () => {
    const blob = new Blob([exportAuditPackage(operator)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `emvco-audit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    notify("Paquete de evidencia exportado");
  };

  const pending = ledger.filter((e) => e.status === "PENDING").reduce((a, e) => a + e.amountCents, 0);
  const available = ledger.filter((e) => e.status === "SETTLED").reduce((a, e) => a + e.amountCents, 0);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">EMVCo L3 · Entorno de certificación · operador {operator}</div>
          <h1 className="h1">Certificación EMVCo L3 · Host simulado + auditoría</h1>
          <p className="sub">
            Harness lógico del adquirente (MTI 0800/0200/0420) contra el perfil TMS del terminal bajo certificación.
            Cada ejecución se sella en la auditoría con encadenamiento SHA-256: evidencia verificable y exportable.
          </p>
        </div>
        <span className="chip"><span className="dot ok" />TID {profile.terminalId}</span>
      </div>

      <div className="grid3">
        <Panel title="Perfil TMS · terminal bajo certificación" desc="Configuración saneada campo a campo; única fuente de floor limits y política de fallback.">
          <Field label="Comercio"><input className="input" value={profile.merchant} onChange={(e) => persistProfile({ ...profile, merchant: e.target.value })} /></Field>
          <Field label="ID de terminal"><input className="input" value={profile.terminalId} onChange={(e) => persistProfile({ ...profile, terminalId: e.target.value })} /></Field>
          <div className="row-between" style={{ marginTop: 12 }}>
            <span className="card-desc">MAGSTRIPE FALLBACK (banda permitida)</span>
            <button className={`toggle ${profile.magstripeFallback ? "on" : ""}`} onClick={() => persistProfile({ ...profile, magstripeFallback: !profile.magstripeFallback })} aria-label="MAGSTRIPE FALLBACK" />
          </div>
          <div className="grid2" style={{ marginTop: 10 }}>
            <Field label="Floor limit offline (tope $)">
              <input className="input" type="number" min={0} value={profile.offlineMaxAmount} onChange={(e) => persistProfile({ ...profile, offlineMaxAmount: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <Field label="Máx. cola">
              <input className="input" type="number" min={1} value={profile.offlineMaxQueue} onChange={(e) => persistProfile({ ...profile, offlineMaxQueue: Math.max(1, Number(e.target.value) || 1) })} />
            </Field>
          </div>
          <div className="row-between" style={{ marginTop: 10 }}>
            <span className="card-desc">Forzar declinación (prueba negativa)</span>
            <button className={`toggle ${profile.forceDecline ? "on" : ""}`} onClick={() => persistProfile({ ...profile, forceDecline: !profile.forceDecline })} aria-label="Forzar declinación" />
          </div>
        </Panel>

        <Panel title="Store & Forward · cola offline" desc="Encola ventas forzadas selladas (AuthCode + BankReference + Timestamp).">
          <div className="grid2">
            <Field label="Monto">
              <input className="input" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
            </Field>
            <Field label="Modo de lectura">
              <select className="select" value={entryMode} onChange={(e) => setEntryMode(e.target.value as "CHIP" | "CTLS" | "BANDA")}>
                <option value="CHIP">CHIP (DE22 05)</option>
                <option value="CTLS">CTLS (DE22 07)</option>
                <option value="BANDA">BANDA (DE22 02)</option>
              </select>
            </Field>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={enqueue}>Encolar venta offline</button>
          <div className="section-label">Cola · {queue.length}/{profile.offlineMaxQueue}</div>
          {queue.length === 0 ? <div className="empty">Cola vacía.</div> : queue.map((q) => (
            <div className="queue-item" key={q.id}><span>{q.ref} · {q.entryMode}</span><span>$ {fmt(q.total)} · {q.authCode}</span></div>
          ))}
          <div className="section-label">Balances del ledger</div>
          <div className="kv"><span className="k">PENDING</span><span className="v warn-text">$ {fmt(pending / 100)}</span></div>
          <div className="kv"><span className="k">AVAILABLE</span><span className="v ok-text">$ {fmt(available / 100)}</span></div>
        </Panel>

        <Panel title="Ejecución de pruebas" desc="Cada corrida se sella en la auditoría certificada.">
          <div className="stack" style={{ gap: 8 }}>
            <button className="btn btn-primary" disabled={busy !== null} onClick={runT1}>
              {busy === "T1" ? "◌ Ejecutando…" : "T1 · TEST DE RED — MTI 0800 → 0810 · DE39 00"}
            </button>
            <div className="grid2">
              <Field label="Monto (DE4)">
                <input className="input" inputMode="decimal" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              </Field>
              <Field label="Entry mode (DE22)">
                <select className="select" value={txnMode} onChange={(e) => setTxnMode(e.target.value as "BANDA" | "CHIP")}>
                  <option value="BANDA">BANDA (02)</option>
                  <option value="CHIP">CHIP (05)</option>
                </select>
              </Field>
            </div>
            <button className="btn" disabled={busy !== null} onClick={runT2}>
              {busy === "T2" ? "◌ Ejecutando…" : "T2 · AUTORIZACIÓN — MTI 0200 → 0210 (fallback)"}
            </button>
            <button className="btn" disabled={busy !== null || queue.length === 0} onClick={runT3}>
              {busy === "T3" ? "◌ Conciliando…" : "T3 · CIERRE DE LOTE — MTI 0420 → 0430 (floor limits)"}
            </button>
            <button className="btn btn-primary" disabled={busy !== null} onClick={runSuite}>
              {busy === "SUITE" ? "◌ Corriendo suite…" : "▶ SUITE EMVCo L3 COMPLETA"}
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid2">
        <Panel title="Monitor de certificación" desc="Diálogo crudo POS ↔ host simulado.">
          <div className="console" ref={consoleRef}>
            {logs.length === 0 ? <span className="faint">$ esperando ejecución de pruebas…</span> :
              logs.map((l) => (
                <div key={l.id}>
                  <span className="t">[{l.time}]</span>
                  <span className={`log-${l.kind}`}>{l.text}</span>
                </div>
              ))}
          </div>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="faint" style={{ fontSize: 10 }}>
              <span className="log-tx">verde</span> = request · <span className="log-rx">blanco</span> = response · <span className="log-err">rojo</span> = rechazo · <span className="log-audit">violeta</span> = auditoría
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setLogs([])}>Limpiar</button>
          </div>
        </Panel>

        <Panel title="Resultados de la suite" desc="Veredicto por caso de prueba.">
          {!suite ? <div className="empty">Aún no se corre la suite.</div> : (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <Badge tone="ok">{suite.passed} OK</Badge>
                <Badge tone="warn">{suite.skipped} SKIPPED</Badge>
                {suite.failed > 0 && <Badge tone="err">{suite.failed} FALLIDAS</Badge>}
              </div>
              <table className="table">
                <thead><tr><th>CASO</th><th>VEREDICTO</th><th>DETALLE</th></tr></thead>
                <tbody>
                  {suite.tests.map((t) => (
                    <tr key={t.name}>
                      <td className="mono" style={{ whiteSpace: "nowrap" }}>{t.name}</td>
                      <td>{t.ok ? <Badge tone="ok">PASS</Badge> : t.skipped ? <Badge tone="warn">SKIPPED</Badge> : <Badge tone="err">FAIL</Badge>}</td>
                      <td className="muted" style={{ fontSize: 10.5 }}>{t.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>
      </div>

      <Panel
        title="Auditoría certificada · evidence trail"
        desc="Cadena append-only con encadenamiento SHA-256. Alterar cualquier evidencia rompe la verificación. Exportable como paquete de certificación."
        right={
          <div className="row">
            <button className="btn btn-sm" onClick={checkIntegrity}>Verificar integridad</button>
            <button className="btn btn-sm" onClick={exportPkg}>Exportar evidencia (JSON)</button>
          </div>
        }
      >
        <div className="row" style={{ marginBottom: 8 }}>
          {integrity && (integrity.ok
            ? <Badge tone="ok">✓ Cadena íntegra · {integrity.records} evidencias</Badge>
            : <Badge tone="err">✗ Cadena comprometida en el registro #{integrity.brokenSeq}</Badge>)}
          <span className="card-desc">{audit.length} registro(s) · ventana 500</span>
        </div>
        {audit.length === 0 ? <div className="empty">Sin evidencias todavía — ejecuta una prueba.</div> : (
          <table className="table">
            <thead><tr><th>SEQ</th><th>SELLO</th><th>OPERADOR</th><th>PRUEBA</th><th>DE39</th><th>VEREDICTO</th><th>HASH</th></tr></thead>
            <tbody>
              {[...audit].reverse().map((r) => (
                <tr key={r.id}>
                  <td className="mono">#{r.seq}</td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{new Date(r.time).toLocaleString("es-MX", { hour12: false })}</td>
                  <td>{r.operator}</td>
                  <td style={{ maxWidth: 260 }}>{r.test}<div className="faint" style={{ fontSize: 9 }}>{r.detail}</div></td>
                  <td className="mono">{r.responseCode}</td>
                  <td>{r.verdict === "PASS" ? <Badge tone="ok">PASS</Badge> : r.verdict === "SKIPPED" ? <Badge tone="warn">SKIPPED</Badge> : <Badge tone="err">FAIL</Badge>}</td>
                  <td className="hash" title={r.hash}>{r.hash.slice(0, 16)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
