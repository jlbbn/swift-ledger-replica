import { useEffect, useRef, useState } from "react";
import { Badge, Field, Panel } from "../Panel.tsx";
import { fmt } from "../../lib/format.ts";
import { loadProfile, saveProfile } from "../../emvco/profile.ts";
import type { TerminalProfile } from "../../emvco/profile.ts";
import {
  enqueueOfflineSale, handleEchoTest, loadLedger, loadQueue,
  processOfflineBatch, runEmvcoTestSuite, validateTransaction, getAcquirerProfile,
} from "../../emvco/host.ts";
import type { HostLogKind, LedgerEntry, QueuedSale, SuiteResult } from "../../emvco/host.ts";
import { CERT_CASES, runAllCases, runCaseById } from "../../emvco/cases.ts";
import type { CaseResult } from "../../emvco/cases.ts";
import { appendAudit, newRunId } from "../../emvco/audit.ts";

interface LogLine { id: number; time: string; kind: HostLogKind; text: string }

export default function ExecutorPanel({ operator, notify, onAuditTick }: {
  operator: string; notify: (t: string) => void; onAuditTick: () => void;
}) {
  const [profile, setProfile] = useState<TerminalProfile>(loadProfile);
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [suite, setSuite] = useState<SuiteResult | null>(null);
  const [caseResults, setCaseResults] = useState<Record<string, CaseResult>>({});
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

  const refresh = () => { setQueue(loadQueue()); setLedger(loadLedger()); };
  useEffect(refresh, []);
  useEffect(() => { consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight }); }, [logs]);

  const persistProfile = (p: TerminalProfile) => { setProfile(p); saveProfile(p); };

  const seal = async (runId: string, test: string, mti: string, stan: string, code: string, verdict: "PASS" | "FAIL" | "SKIPPED", detail: string, payload: unknown) => {
    await appendAudit({ runId, operator, test, mti, stan, responseCode: code, verdict, detail, payload });
    onAuditTick();
  };

  const runT1 = async () => {
    setBusy("T1");
    const runId = newRunId();
    push("audit", `run ${runId} · operador ${operator}`);
    const a = await handleEchoTest({ terminalId: profile.terminalId, serial: profile.serial }, { onLog: push, latencyMs: 350 });
    await seal(runId, "T1 ECHO (MTI 0800)", a.mti, a.stan, a.responseCode, a.approved ? "PASS" : "FAIL", a.detail, { terminalId: profile.terminalId });
    setBusy(null); notify(`T1 ECHO · DE39 ${a.responseCode}`);
  };

  const runT2 = async () => {
    setBusy("T2");
    const runId = newRunId();
    push("audit", `run ${runId} · operador ${operator}`);
    const amt = parseFloat(txnAmount) || 0;
    const a = validateTransaction({ mti: "0200", amount: amt, entryMode: txnMode }, getAcquirerProfile(profile));
    await seal(runId, `T2 AUTORIZACIÓN (MTI 0200 · DE22 ${txnMode === "BANDA" ? "02" : "05"})`, a.mti, a.stan, a.responseCode, a.approved ? "PASS" : "FAIL", a.detail, { amount: amt, entryMode: txnMode });
    push(a.approved ? "rx" : "err", `T2 → MTI ${a.mti} · STAN ${a.stan} · DE39 ${a.responseCode} · ${a.detail}`);
    setBusy(null);
  };

  const runT3 = async () => {
    setBusy("T3");
    const runId = newRunId();
    push("audit", `run ${runId} · operador ${operator}`);
    const r = await processOfflineBatch(undefined, { onLog: push, batchId: `${runId}-BATCH` });
    for (const i of r.items) {
      await seal(runId, `T3 BATCH ${r.batchId} · ${i.ref}`, "0430", "—", i.responseCode, i.decision === "APPROVED" ? "PASS" : "FAIL", i.detail, { amountCents: i.amountCents, entryMode: i.entryMode });
    }
    refresh(); setBusy(null);
    notify(`T3 CIERRE DE LOTE · ${r.approved}/${r.received} liquidadas · ${r.rejected} rechazadas`);
  };

  const runSuite = async () => {
    setBusy("SUITE");
    const runId = newRunId();
    push("audit", `run ${runId} · SUITE COMPLETA · operador ${operator}`);
    const s = await runEmvcoTestSuite({ onLog: push });
    setSuite(s);
    for (const t of s.tests) {
      await seal(runId, t.name, "—", "—", "—", t.skipped ? "SKIPPED" : t.ok ? "PASS" : "FAIL", t.detail, { suite: true });
    }
    setBusy(null); notify(`Suite EMVCo L3 · ${s.passed} OK · ${s.skipped} SKIPPED`);
  };

  const runCase = async (id: string) => {
    setBusy(id);
    const runId = newRunId();
    push("audit", `run ${runId} · caso ${id} · operador ${operator}`);
    const r = await runCaseById(id, { profile, push, runId });
    setCaseResults((prev) => ({ ...prev, [r.id]: r }));
    await seal(runId, `${r.id} ${r.name}`, r.mti, "—", r.actual.match(/DE39 (\d+)/)?.[1] ?? "—", r.pass ? "PASS" : "FAIL", `esperado ${r.expected} · obtenido ${r.actual}`, { case: r.id });
    setBusy(null);
  };

  const runCasesAll = async () => {
    setBusy("CASES");
    const runId = newRunId();
    push("audit", `run ${runId} · CATÁLOGO COMPLETO · operador ${operator}`);
    const results = await runAllCases({ profile, push, runId });
    setCaseResults(Object.fromEntries(results.map((r) => [r.id, r])));
    for (const r of results) {
      await seal(runId, `${r.id} ${r.name}`, r.mti, "—", r.actual.match(/DE39 (\d+)/)?.[1] ?? "—", r.pass ? "PASS" : "FAIL", `esperado ${r.expected} · obtenido ${r.actual}`, { case: r.id });
    }
    refresh(); setBusy(null);
    notify(`Catálogo L3 · ${results.filter((r) => r.pass).length}/${results.length} en verde`);
  };

  const enqueue = () => {
    const amt = parseFloat(amount);
    const r = enqueueOfflineSale({ amount: Number.isFinite(amt) ? amt : 0, entryMode });
    if ("error" in r) { push("err", `VENTA OFFLINE RECHAZADA: ${r.error}`); notify(r.error); return; }
    push("info", `VENTA FORZADA guardada en cola offline (${loadQueue().length}/${profile.offlineMaxQueue}) · ${r.item.ref} · auth ${r.item.authCode}`);
    setAmount(""); refresh();
  };

  const pending = ledger.filter((e) => e.status === "PENDING").reduce((a, e) => a + e.amountCents, 0);
  const available = ledger.filter((e) => e.status === "SETTLED").reduce((a, e) => a + e.amountCents, 0);
  const casesPassed = Object.values(caseResults).filter((r) => r.pass).length;

  return (
    <div className="stack">
      <div className="grid3">
        <Panel title="Perfil TMS · terminal bajo certificación" desc="Configuración saneada campo a campo; única fuente de floor limits y política de fallback.">
          <Field label="Comercio"><input className="input" value={profile.merchant} onChange={(e) => persistProfile({ ...profile, merchant: e.target.value })} /></Field>
          <Field label="ID de terminal"><input className="input" value={profile.terminalId} onChange={(e) => persistProfile({ ...profile, terminalId: e.target.value })} /></Field>
          <div className="row-between" style={{ marginTop: 12 }}>
            <span className="card-desc">MAGSTRIPE FALLBACK (banda permitida)</span>
            <button className={`toggle ${profile.magstripeFallback ? "on" : ""}`} onClick={() => persistProfile({ ...profile, magstripeFallback: !profile.magstripeFallback })} aria-label="MAGSTRIPE FALLBACK" />
          </div>
          <div className="grid2" style={{ marginTop: 10 }}>
            <Field label="Floor limit offline ($)">
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

        <Panel title="Store & Forward · cola offline" desc="Encola ventas forzadas selladas (AuthCode + BankReference + STAN).">
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

        <Panel title="Suite rápida T1–T5" desc="La suite de 6 con los 2 SKIPPED de hardware/red (ruta BaaS). Cada corrida se sella en auditoría.">
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
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <button className="btn" disabled={busy !== null} onClick={runT1}>{busy === "T1" ? "◌ Ejecutando…" : "T1 · ECHO — MTI 0800 → 0810"}</button>
            <button className="btn" disabled={busy !== null} onClick={runT2}>{busy === "T2" ? "◌ Ejecutando…" : "T2 · AUTORIZACIÓN — MTI 0200"}</button>
            <button className="btn" disabled={busy !== null || queue.length === 0} onClick={runT3}>{busy === "T3" ? "◌ Conciliando…" : "T3 · CIERRE DE LOTE — MTI 0420"}</button>
            <button className="btn btn-primary" disabled={busy !== null} onClick={runSuite}>{busy === "SUITE" ? "◌ Corriendo suite…" : "▶ SUITE EMVCo L3 (6 tests)"}</button>
          </div>
          {suite && (
            <div className="row" style={{ marginTop: 10 }}>
              <Badge tone="ok">{suite.passed} OK</Badge>
              <Badge tone="warn">{suite.skipped} SKIPPED</Badge>
              {suite.failed > 0 && <Badge tone="err">{suite.failed} FAIL</Badge>}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title={`Catálogo de casos L3 · ${casesPassed}/${CERT_CASES.length} en verde`}
        desc="Cada caso empaqueta su wire ISO 8583 real y compara esperado vs actual."
        right={<button className="btn btn-sm btn-primary" disabled={busy !== null} onClick={runCasesAll}>{busy === "CASES" ? "◌ Corriendo…" : "▶ RUN ALL CASES"}</button>}
      >
        <table className="table">
          <thead><tr><th>CASO</th><th>NOMBRE</th><th>MTI</th><th>ESPERADO</th><th>RESULTADO</th><th /></tr></thead>
          <tbody>
            {CERT_CASES.map((c) => {
              const r = caseResults[c.id];
              return (
                <tr key={c.id} className={r ? (r.pass ? "case-pass" : "case-fail") : ""}>
                  <td className="mono">{c.id}</td>
                  <td>{c.name}<div className="faint" style={{ fontSize: 9.5 }}>{c.objective}</div></td>
                  <td className="mono">{c.mti}</td>
                  <td className="muted" style={{ fontSize: 10.5 }}>{c.expected}</td>
                  <td>{r ? (r.pass ? <Badge tone="ok">PASS</Badge> : <Badge tone="err">FAIL</Badge>) : <Badge>—</Badge>}{r && <div className="faint mono" style={{ fontSize: 9.5, marginTop: 2 }}>{r.actual}</div>}</td>
                  <td><button className="btn btn-sm" disabled={busy !== null} onClick={() => runCase(c.id)}>RUN</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div className="grid2">
        <Panel title="Monitor de certificación" desc="Diálogo crudo POS ↔ host con wires ISO 8583.">
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
              <span className="log-tx">verde</span> request · <span className="log-rx">blanco</span> response · <span className="log-err">rojo</span> rechazo · <span className="log-audit">violeta</span> auditoría
            </span>
            <button className="btn btn-sm btn-ghost" onClick={() => setLogs([])}>Limpiar</button>
          </div>
        </Panel>

        <Panel title="Resultados de la suite" desc="Veredicto por caso de prueba (incluye SKIPPED de hardware/red).">
          {!suite ? <div className="empty">Aún no se corre la suite.</div> : (
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
          )}
        </Panel>
      </div>
    </div>
  );
}
