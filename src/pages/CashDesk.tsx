import { useState } from "react";
import { Field, Panel } from "../components/Panel.tsx";
import { fmt } from "../lib/format.ts";

interface Shift { id: string; open: string; currency: string; amount: number }

export default function CashDesk({ notify }: { notify: (t: string) => void }) {
  const [amount, setAmount] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);

  const openShift = () => {
    const n = parseFloat(amount || "0");
    if (!Number.isFinite(n) || n < 0) { notify("Monto de apertura inválido"); return; }
    setShifts((s) => [...s, { id: `S${Date.now()}`, open: new Date().toLocaleString("es-MX", { hour12: false }), currency: "USD", amount: n }]);
    setAmount("");
    notify(`Turno de caja abierto · efectivo inicial $${fmt(n)}`);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Operaciones · registros manuales</div>
          <h1 className="h1">Caja</h1>
          <p className="sub">Las ventas del terminal manual se permiten aquí, pero Stripe, USDT o un formulario de entrada de tarjeta no. Los pagos con tarjeta de este tipo se presuponen de un terminal físico conectado.</p>
        </div>
        <button className="btn" onClick={() => notify("Estado de caja actualizado")}>⟳ Actualizar caja</button>
      </div>

      <div className="info-box">ⓘ
        <div><b>Registro únicamente.</b> Solo el efectivo y PILY cuentan aquí; el efectivo negativo no está permitido. Los pagos con tarjeta de este tipo se presuponen de un terminal físico conectado.</div>
      </div>

      <div className="grid2">
        <Panel title="Abrir un turno manual">
          <p className="card-desc">Sin turno abierto. Introduzca el efectivo físico inicial que contó.</p>
          <Field label="Moneda">
            <select className="select" defaultValue="USD"><option value="USD">USD</option><option value="MXN">MXN</option><option value="EUR">EUR</option></select>
          </Field>
          <Field label="Efectivo inicial">
            <input className="input" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
          </Field>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={openShift}>Abrir turno de caja</button>
        </Panel>

        <Panel title="Historial de turnos" desc="Turnos de { } para su cuenta de operador. Los registros no se pueden editar ni eliminar." right={<span className="badge">{shifts.length} turnos</span>}>
          {shifts.length === 0 ? (
            <div className="empty">Aún no hay registros de caja manual.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Turno</th><th>Apertura</th><th className="v" style={{ textAlign: "right" }}>Efectivo inicial</th></tr></thead>
              <tbody>
                {[...shifts].reverse().map((s) => (
                  <tr key={s.id}><td className="mono">{s.id}</td><td className="mono">{s.open}</td><td className="mono" style={{ textAlign: "right" }}>{s.currency} $ {fmt(s.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <hr className="divider" />
          <p className="card-desc">
            <b>Registrar venta sin conexión</b> — registre una venta sin conexión ya autorizada o una venta por voz. Solo registro: esto no cobra una tarjeta, contacta con el terminal, liquida fondos ni hace que los fondos se puedan retirar.
          </p>
        </Panel>
      </div>
    </div>
  );
}
