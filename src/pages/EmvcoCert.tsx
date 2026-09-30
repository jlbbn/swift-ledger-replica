import { useState } from "react";
import ExecutorPanel from "../components/emvco/ExecutorPanel.tsx";
import IsoLab from "../components/emvco/IsoLab.tsx";
import AuditPanel from "../components/emvco/AuditPanel.tsx";

type Tab = "executor" | "iso" | "audit";

const TABS: [Tab, string][] = [
  ["executor", "Ejecutor de pruebas"],
  ["iso", "Laboratorio ISO 8583"],
  ["audit", "Auditoría certificada"],
];

export default function EmvcoCert({ operator, notify }: { operator: string; notify: (t: string) => void }) {
  const [tab, setTab] = useState<Tab>("executor");
  const [auditTick, setAuditTick] = useState(0);

  return (
    <div className="emvco-lab">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: "#78BE20" }}>EMVCo L3 · Entorno de certificación</div>
          <h1 className="h1" style={{ color: "#003359" }}>Certificación EMVCo L3 · Host + Audit</h1>
          <p className="sub">
            Harness lógico del adquirente (MTI 0800 / 0200 / 0400 / 0420) contra el perfil TMS del terminal
            bajo certificación, con capa ISO 8583 real y evidence trail encadenado SHA-256.
          </p>
        </div>
      </div>

      <div className="lab-banner">
        <div>
          <div className="lab-title">EMVCo L3 Certification Environment</div>
          <div className="lab-sub">
            T4/T5 (hardware HSM y red directa) permanecen SKIPPED — justifican la migración a la ruta
            BaaS/API. No es un producto certificado por EMVCo.
          </div>
        </div>
        <div className="lab-meta">
          <span className="chip" style={{ borderColor: "#d4dbe6", color: "#55617a" }}>Operador · {operator}</span>
          <span className="chip" style={{ borderColor: "#d4dbe6", color: "#55617a" }}>ISO 8583:1993 subset</span>
          <span className="chip" style={{ borderColor: "#d4dbe6", color: "#55617a" }}>Audit · SHA-256 chain</span>
        </div>
      </div>

      <div className="subtabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`subtab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "executor" && <ExecutorPanel operator={operator} notify={notify} onAuditTick={() => setAuditTick((t) => t + 1)} />}
      {tab === "iso" && <IsoLab />}
      {tab === "audit" && <AuditPanel tick={auditTick} operator={operator} notify={notify} />}
    </div>
  );
}
