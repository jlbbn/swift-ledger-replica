import { Panel } from "../components/Panel.tsx";
import { ROUTE_LABELS } from "../components/Topbar.tsx";

export default function Placeholder({ route }: { route: string }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Swift Ledger · Consola del operador</div>
          <h1 className="h1">{ROUTE_LABELS[route] ?? route}</h1>
          <p className="sub">Módulo de solo lectura de la réplica del entorno de certificación.</p>
        </div>
      </div>
      <Panel title={ROUTE_LABELS[route] ?? route} desc="Este módulo se muestra con fines de navegación en la réplica; no realiza operaciones.">
        <div className="empty">Sin registros en este módulo.</div>
      </Panel>
    </div>
  );
}
