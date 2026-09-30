import { useEffect, useState } from "react";
import { Badge, Panel } from "../Panel.tsx";
import { exportAuditCSV, exportAuditPackage, loadAudit, verifyAudit } from "../../emvco/audit.ts";
import type { AuditRecord, AuditVerification } from "../../emvco/audit.ts";

export default function AuditPanel({ tick, operator, notify }: { tick: number; operator: string; notify: (t: string) => void }) {
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [integrity, setIntegrity] = useState<AuditVerification | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setAudit(loadAudit()); }, [tick]);

  const checkIntegrity = async () => {
    setBusy(true);
    const v = await verifyAudit();
    setIntegrity(v);
    setBusy(false);
    notify(v.ok ? `Cadena íntegra · ${v.records} evidencias` : `Cadena comprometida en #${v.brokenSeq}`);
  };

  const download = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="emvco-lab">
      <Panel
        title="EMVCo L3 Certification · Host + Audit"
        desc="Cadena append-only con encadenamiento SHA-256 por corrida (runId). Alterar cualquier evidencia rompe la verificación. Exportable como paquete de certificación."
      right={
        <div className="row">
          <button className="btn btn-sm" onClick={checkIntegrity} disabled={busy}>{busy ? "◌ Verificando…" : "Verificar integridad"}</button>
          <button className="btn btn-sm" onClick={() => { download(exportAuditPackage(operator), `emvco-audit-${Date.now()}.json`, "application/json"); notify("Paquete JSON exportado"); }}>Exportar JSON</button>
          <button className="btn btn-sm" onClick={() => { download(exportAuditCSV(), `emvco-audit-${Date.now()}.csv`, "text/csv"); notify("Hoja CSV exportada"); }}>Exportar CSV</button>
        </div>
      }
    >
      <div className="row" style={{ marginBottom: 8 }}>
        {integrity && (integrity.ok
          ? <Badge tone="ok">✓ Cadena íntegra · {integrity.records} evidencias</Badge>
          : <Badge tone="err">✗ Cadena comprometida en el registro #{integrity.brokenSeq}</Badge>)}
        <span className="card-desc">{audit.length} registro(s) · ventana 500</span>
      </div>
      {audit.length === 0 ? <div className="empty">Sin evidencias todavía — ejecuta una prueba desde el Ejecutor.</div> : (
        <table className="table">
          <thead><tr><th>SEQ</th><th>RUN</th><th>SELLO</th><th>OPERADOR</th><th>PRUEBA</th><th>DE39</th><th>VEREDICTO</th><th>HASH</th></tr></thead>
          <tbody>
            {[...audit].reverse().map((r) => (
              <tr key={r.id}>
                <td className="mono">#{r.seq}</td>
                <td className="mono" style={{ fontSize: 9.5 }}>{r.runId}</td>
                <td className="mono" style={{ whiteSpace: "nowrap", fontSize: 9.5 }}>{new Date(r.time).toLocaleString("es-MX", { hour12: false })}</td>
                <td>{r.operator}</td>
                <td style={{ maxWidth: 240 }}>{r.test}<div className="faint" style={{ fontSize: 9 }}>{r.detail}</div></td>
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
