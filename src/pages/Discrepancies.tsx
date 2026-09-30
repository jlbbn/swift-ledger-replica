import { Panel } from "../components/Panel.tsx";

export default function Discrepancies({ notify }: { notify: (t: string) => void }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Pagos y registros</div>
          <h1 className="h1">Discrepancias en los pagos</h1>
          <p className="sub">Revise los informes de conciliación de pagos, incluidos los registros no coincidentes y huérfanos.</p>
        </div>
        <button className="btn" onClick={() => notify("Lecturas de enlace de terminal actualizadas")}>⟳ Actualizar enlaces de terminal</button>
      </div>

      <div className="warn-box">⚠
        <div><b>Frontera de evidencia.</b> Esta página solo intercambia monedas o envía pagos de USDT. Revise los informes de conciliación de pagos, incluidos los registros no coincidentes y huérfanos.</div>
      </div>

      <div className="card">
        <div className="kv"><span className="k">Terminal de confianza + comerciante</span><span className="v ok-text">android-acba2a93-d486-48b0-a226-fa6129a14817 · Merchant 1</span></div>
        <div className="kv"><span className="k">Vinculación de confianza</span><span className="v">9/30/2026, 10:11:20 AM · Los cambios requieren una actualización manual</span></div>
        <div className="kv"><span className="k">Conectividad o liquidación bancaria</span><span className="v">la configuración no es prueba de conectividad ni de liquidación bancaria</span></div>
      </div>

      <Panel title="Conciliación de liquidación sin conexión" desc="Un administrador puede cargar un informe CSV o JSON de hasta 500 filas, con BankReference o AuthCode, Amount y Date (AAAA-MM-DD). Un informe cargado no es una conciliación bancaria independiente; no se añade un monto y la moneda seleccionada no se confirma.">
        <div className="row">
          <input className="input" type="file" accept=".csv,.json" style={{ maxWidth: 320 }} onChange={() => notify("Informe seleccionado")} />
          <button className="btn btn-sm" onClick={() => notify("Informe cargado · 0 conciliadas · 0 rechazadas")}>Cargar informe</button>
        </div>
        <hr className="divider" />
        <div className="section-label">Historial de conciliación persistente</div>
        <div className="empty">No se han cargado informes de conciliación.</div>
      </Panel>
    </div>
  );
}
