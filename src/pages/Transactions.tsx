import { Panel } from "../components/Panel.tsx";

export default function Transactions({ notify }: { notify: (t: string) => void }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Operaciones</div>
          <h1 className="h1">Transacciones</h1>
          <p className="sub">Registros de solo lectura del servicio de transacciones.</p>
        </div>
        <button className="btn" onClick={() => notify("Sin transacciones coincidentes")}>⟳ Actualizar</button>
      </div>

      <div className="card">
        <div className="empty">⧉ El servicio no devolvió transacciones coincidentes.</div>
      </div>

      <Panel
        title="Pagos con tarjeta Stripe"
        desc="Los pagos introducidos online con tarjeta se verifican directamente con Stripe; este servidor retiene solo un token. Esto no es un MOTO ni un terminal de entrada del operador."
        right={<button className="btn btn-sm btn-ghost" onClick={() => notify("Lista actualizada")}>Actualizar lista</button>}
      >
        <div className="section-label">Flujo de trabajo de ventas pendientes</div>
        <p className="card-desc">
          Solo se guarda la intención de venta — nunca tarjetas ni tokens de pago. Reconectar solo comprueba estados; nunca carga automáticamente. Las ventas fallidas requieren gestión manual.
        </p>
        <p className="card-desc">Cuando el almacenamiento local alcance 200 ventas, solo las intenciones de venta del servidor verificado y los estados de los terminales se retienen localmente. El historial del servidor nunca se descarta.</p>
        <div className="section-label">Historial de transacciones de Stripe</div>
        <div className="empty">Sin pagos de Stripe</div>
      </Panel>
    </div>
  );
}
