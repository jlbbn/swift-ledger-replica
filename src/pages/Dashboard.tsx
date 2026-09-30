import { Panel } from "../components/Panel.tsx";

export default function Dashboard({ notify }: { notify: (t: string) => void }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Operaciones</div>
          <h1 className="h1">Panel de operaciones</h1>
          <p className="sub">Métricas de solo lectura calculadas desde el servicio de transacciones.</p>
        </div>
        <button className="btn" onClick={() => notify("Métricas actualizadas")}>⟳ Actualizar</button>
      </div>

      <div className="stat-grid">
        <div className="card"><div className="stat-label">Transacciones de hoy</div><div className="stat-value">0</div><div className="stat-sub">Registradas por el servicio</div></div>
        <div className="card"><div className="stat-label">Volumen registrado</div><div className="stat-value">$0.00</div><div className="stat-sub">No es un saldo liquidado</div></div>
        <div className="card"><div className="stat-label">Pendientes / procesando</div><div className="stat-value">0</div><div className="stat-sub">Registros actuales</div></div>
        <div className="card"><div className="stat-label">Estado financiero</div><div className="stat-value" style={{ letterSpacing: "0.08em" }}>VERIFY</div><div className="stat-sub">Compruebe cada módulo</div></div>
      </div>

      <div className="grid2">
        <Panel title="Actividad reciente" right={<button className="btn btn-sm btn-ghost" onClick={() => notify("Transacciones")}>Ver transacciones →</button>}>
          <div className="empty">No hay transacciones registradas.</div>
        </Panel>
        <Panel title="Servicios">
          <div className="kv"><span className="k">Sesión</span><span className="v ok-text">Autenticada</span></div>
          <div className="kv"><span className="k">Registro USDT</span><span className="v">los estados y pedidos se cargan desde el backend</span></div>
          <div className="kv"><span className="k">Pagos con tarjeta</span><span className="v">la disponibilidad se comprueba directamente en el módulo Stripe</span></div>
          <button className="btn btn-sm" style={{ marginTop: 10, width: "100%" }} onClick={() => notify("Abriendo órdenes USDT")}>Abrir órdenes USDT →</button>
        </Panel>
      </div>
    </div>
  );
}
