import { Badge, Panel } from "../components/Panel.tsx";

export default function UsdtTron({ notify }: { notify: (t: string) => void }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin only · Operaciones</div>
          <h1 className="h1">USDT · Motor de pago TRON</h1>
          <p className="sub">Las lecturas de Mainnet y las pruebas de Nile son independientes. La firma y el envío de datos en Mainnet siguen bloqueados. Se requiere el navegador Ledger para el flujo de hardware de Nile.</p>
        </div>
        <span className="chip err">ENVÍO DE RED PRINCIPAL BLOQUEADO · sin firma automática</span>
      </div>

      <div className="grid3">
        <Panel title="Nodo de la red principal" right={<Badge tone="ok">Conectado</Badge>}>
          <div className="kv"><span className="k">Bloque</span><span className="v">86,704,026</span></div>
          <div className="kv"><span className="k">Retraso</span><span className="v">4.2 s</span></div>
          <div className="kv"><span className="k">Proveedor</span><span className="v">TronGrid (alternativa)</span></div>
          <div className="kv"><span className="k">Cadena</span><span className="v ok-text">Mainnet identity verified</span></div>
          <div className="kv"><span className="k">Última lectura</span><span className="v">hace 3 s · cada 10 s</span></div>
        </Panel>
        <Panel title="Cartera de la plataforma Mainnet · Tesorería separada">
          <div className="kv"><span className="k">Dirección</span><span className="v">TAD1jHKPAh5wbGYcXiSevt9DCD9ouy4u</span></div>
          <div className="kv"><span className="k">TRX</span><span className="v">40.000001</span></div>
          <div className="kv"><span className="k">USDT-TRC20</span><span className="v">0.000000</span></div>
          <div className="kv"><span className="k">Energía / ancho de banda</span><span className="v">0 / 600</span></div>
          <div className="kv"><span className="k">Tronscan</span><span className="v" style={{ color: "#38bdf8" }}>Ver en Tronscan ↗</span></div>
        </Panel>
        <Panel title="Firmante" right={<Badge tone="warn">Desconectado</Badge>}>
          <div className="kv"><span className="k">Libro mayor</span><span className="v">aprobación manual</span></div>
          <div className="kv"><span className="k">Clave en servidor</span><span className="v">ninguna</span></div>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => notify("Ledger no detectado · conecta el dispositivo USB")}>Conectar el libro mayor</button>
          <p className="card-desc" style={{ marginTop: 8 }}>Use Chrome o Edge de escritorio mediante HTTPS (o localhost). Nunca introduzca su PIN aquí.</p>
        </Panel>
      </div>

      <div className="grid2">
        <Panel title="Pagos USDT de Nile" desc="Red de pruebas Nile · solo lectura." right={<button className="btn btn-sm btn-ghost" onClick={() => notify("Pagos de Nile actualizados")}>Actualizar</button>}>
          <div className="empty">No hay pagos de Nile registrados.</div>
        </Panel>
        <Panel title="Depósitos y retiros USDT" desc="Los retiros requieren aprobación manual del firmante.">
          <div className="kv"><span className="k">Depósitos USDT on-chain</span><span className="v">0.000000</span></div>
          <div className="kv"><span className="k">Total USDT interno</span><span className="v warn-text">No disponible</span></div>
          <div className="kv"><span className="k">Retiros pendientes</span><span className="v">0</span></div>
        </Panel>
      </div>
    </div>
  );
}
