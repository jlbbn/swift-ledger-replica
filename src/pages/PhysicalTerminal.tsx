import { useState } from "react";
import { Badge, Field, Panel } from "../components/Panel.tsx";
import { fmt, nowMx, randNum } from "../lib/format.ts";

interface OfflineSale { ref: string; amount: number; currency: string; source: string; time: string }

export default function PhysicalTerminal({ notify }: { notify: (t: string) => void }) {
  const [amount, setAmount] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [sales, setSales] = useState<OfflineSale[]>([]);

  const register = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) { notify("Monto inválido"); return; }
    const ref = (bankRef.trim() || `OL${randNum(8)}`).toUpperCase().slice(0, 12);
    setSales((s) => [...s, { ref, amount: n, currency: "USD", source: "Manual terminal", time: nowMx() }]);
    setAmount(""); setBankRef("");
    notify(`Venta sin conexión registrada · ${ref}`);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Operaciones · terminal físico</div>
          <h1 className="h1">Terminal físico · PosLink</h1>
          <p className="sub">Las ventas en consignación se permiten aquí, pero Stripe, USDT o un formulario de entrada de tarjeta no están activos. La red de terminales de pago Stripe o cualquier red de pagos con tarjeta no está conectada.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => notify("Abriendo cliente POS…")}>Abrir cliente POS</button>
          <button className="btn" onClick={() => notify("Terminal actualizado")}>⟳ Actualizar</button>
        </div>
      </div>

      <div className="card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span className="chip">TERMINAL DE RED: TERMINAL_UNCONFIGURED</span>
        <span className="card-desc" style={{ margin: 0 }}>Vincule un dispositivo de confianza desde Enrutamiento POS para despachar.</span>
      </div>

      <div className="grid2">
        <Panel title="Registrar venta sin conexión" desc="Registro únicamente. Esto no cobra una tarjeta ni contacta con un terminal físico.">
          <Field label="Monto (USD)">
            <input className="input" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
          </Field>
          <Field label="Referencia bancaria / AuthCode (máx. 12)">
            <input className="input" placeholder="AUTO" value={bankRef} onChange={(e) => setBankRef(e.target.value.toUpperCase().slice(0, 12))} />
          </Field>
          <p className="card-desc" style={{ marginTop: 8 }}>Confirmo este monto de venta y el terminal físico seleccionado.</p>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={register}>Registrar venta sin conexión</button>
        </Panel>

        <Panel title="Saldos · estado del informe de terminal cargado" right={<Badge>USD</Badge>}>
          <div className="kv"><span className="k">USD · Pendiente</span><span className="v">0.00 · Disponible 0.00 · Retirable 0.00</span></div>
          <div className="kv"><span className="k">MXN · Pendiente</span><span className="v">0.00 · Disponible 0.00 · Retirable 0.00</span></div>
          <div className="kv"><span className="k">EUR · Pendiente</span><span className="v">0.00 · Disponible 0.00 · Retirable 0.00</span></div>
          <hr className="divider" />
          <div className="section-label">Historial del terminal sin conexión</div>
          {sales.length === 0 ? <div className="empty">Sin monto (USD) registrado.</div> : (
            <table className="table">
              <thead><tr><th>REF</th><th>ORIGEN</th><th style={{ textAlign: "right" }}>MONTO</th><th>HORA</th></tr></thead>
              <tbody>
                {[...sales].reverse().map((s) => (
                  <tr key={s.ref}><td className="mono">{s.ref}</td><td>{s.source}</td><td className="mono" style={{ textAlign: "right" }}>$ {fmt(s.amount)}</td><td className="mono">{s.time}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="grid2">
        <Panel title="Ámbito del terminal de administrador">
          <p className="card-desc">
            Un administrador puede cargar un informe CSV o JSON de hasta 500 filas, con BankReference o AuthCode, Amount y Date (AAAA-MM-DD). Un informe cargado no es una conciliación bancaria independiente; no se añade un monto y la moneda seleccionada no se confirma.
          </p>
          <label className="f-label">Informe de liquidación sin conexión</label>
          <input className="input" type="file" accept=".csv,.json" onChange={() => notify("Informe recibido · 0 conciliadas · 0 rechazadas")} />
          <button className="btn" style={{ marginTop: 10 }} onClick={() => notify("Informe cargado · confirmación del administrador registrada")}>Cargar informe</button>
        </Panel>

        <Panel title="Terminales de confianza" desc="Vinculación de confianza 9/30/2026, 10:11:20 AM · Los cambios requieren una actualización manual. La configuración no es prueba de conectividad ni de liquidación bancaria.">
          <div className="kv"><span className="k">android-acba2a93-d486-48b0-a226-fa6129a14817</span><span className="v ok-text">Merchant 1</span></div>
          <hr className="divider" />
          <div className="section-label">Operaciones recientes del terminal</div>
          <div className="empty">Sin ventas</div>
          <p className="card-desc">Contacte con el terminal, liquide fondos o haga que los fondos se puedan retirar.</p>
        </Panel>
      </div>
    </div>
  );
}
