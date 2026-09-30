import { useState } from "react";
import { Badge, Panel } from "../components/Panel.tsx";

type NetState = "idle" | "reading" | "done";

export default function VirtualPos({ notify }: { notify: (t: string) => void }) {
  const [net, setNet] = useState<NetState>("idle");
  const [stripe, setStripe] = useState<"idle" | "checking" | "ok">("idle");

  const readNetwork = () => {
    setNet("reading");
    setTimeout(() => { setNet("done"); notify("Red principal leída · Mainnet identity verified"); }, 1400);
  };
  const checkStripe = () => {
    setStripe("checking");
    setTimeout(() => { setStripe("ok"); notify("Disponibilidad de Stripe verificada (test mode)"); }, 1200);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Solo para administradores · Operaciones</div>
          <h1 className="h1">TPV Virtual · USDT</h1>
          <p className="sub">Cree borradores protegidos en el registro. Las acciones de red permanecen deshabilitadas hasta que se superen sus comprobaciones.</p>
        </div>
        <span className="chip warn"><span className="dot warn" />NO SE ASUME QUE LA RED ESTÉ LISTA</span>
      </div>

      <div className="warn-box">⚠
        <div><b>Flujo de tarjeta independiente.</b> Los campos seguros de Stripe y la venta diferida aparecen debajo del módulo USDT. Esta aplicación no recibe datos de tarjetas sin tokenizar.</div>
      </div>

      <div className="ok-box">✓
        <div style={{ flex: 1 }}>
          <b>Motor de órdenes USDT</b> — Los borradores no transfieren fondos. El firmante de Nile y el flujo manual de cada red permanecen bloqueados hasta que el backend confirme su disponibilidad; Mainnet nunca utiliza el firmante del servidor.
        </div>
        <button className="btn btn-sm">Abrir registro dedicado</button>
      </div>

      <div className="row-between">
        <div>
          <h3 className="card-title" style={{ fontSize: 15 }}>USDT · Motor de pago TRON</h3>
          <p className="card-desc" style={{ maxWidth: 560 }}>
            Las lecturas de Mainnet y las pruebas de Nile son independientes. La firma y el envío de datos en Mainnet siguen bloqueados. Se requiere el navegador Ledger para el flujo de hardware de Nile.
          </p>
        </div>
        <span className="chip err">ENVÍO DE RED PRINCIPAL BLOQUEADO · sin firma automática</span>
      </div>

      <Panel
        title="Mainnet · solo lectura"
        right={net === "done" ? <Badge tone="ok">● Conectado</Badge> : <Badge>● Sin leer</Badge>}
      >
        {net !== "done" ? (
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted mono" style={{ fontSize: 11 }}>
              {net === "reading" ? <span className="spin">◌</span> : null} {net === "reading" ? "Leyendo el estado de la red…" : "Estado de la red principal sin leer."}
            </span>
            <button className="btn btn-sm" onClick={readNetwork} disabled={net === "reading"}>Leer red</button>
          </div>
        ) : (
          <div className="grid3">
            <div>
              <div className="section-label">Nodo de la red principal</div>
              <div className="kv"><span className="k">Conectado</span><span className="v ok-text">Sí</span></div>
              <div className="kv"><span className="k">Identidad de Mainnet</span><span className="v ok-text">verificada</span></div>
              <div className="kv"><span className="k">Bloque</span><span className="v">86,704,026</span></div>
              <div className="kv"><span className="k">Retraso</span><span className="v">4.2 s</span></div>
              <div className="kv"><span className="k">Proveedor</span><span className="v">TronGrid (alternativa)</span></div>
              <div className="kv"><span className="k">Cadena</span><span className="v ok-text">Mainnet identity verified</span></div>
              <div className="kv"><span className="k">Última lectura</span><span className="v">hace 2 s · cada 10 s</span></div>
            </div>
            <div>
              <div className="section-label">Cartera de la plataforma Mainnet · Tesorería separada</div>
              <div className="kv"><span className="k">Dirección</span><span className="v">TAD1jHKPAh5wbGYcXiSevt9DC D9ouy4u</span></div>
              <div className="kv"><span className="k">TRX</span><span className="v">40.000001</span></div>
              <div className="kv"><span className="k">USDT-TRC20</span><span className="v">0.000000</span></div>
              <div className="kv"><span className="k">Energía disponible</span><span className="v">0</span></div>
              <div className="kv"><span className="k">Ancho de banda</span><span className="v">600</span></div>
              <div className="kv"><span className="k">Tronscan</span><span className="v" style={{ color: "#38bdf8" }}>Ver en Tronscan ↗</span></div>
            </div>
            <div>
              <div className="section-label">Firmante</div>
              <div className="kv"><span className="k">Libro mayor</span><span className="v">aprobación manual</span></div>
              <div className="kv"><span className="k">Dirección pública</span><span className="v">configurada · sin clave en el servidor</span></div>
              <div className="kv"><span className="k">Estado</span><span className="v err-text">Desconectado</span></div>
              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => notify("Ledger no detectado · conecta el dispositivo USB")}>Conectar el libro mayor</button>
              <p className="card-desc" style={{ marginTop: 8 }}>
                Use Chrome o Edge de escritorio mediante HTTPS (o localhost). Conecte por USB, cierre Ledger Live y abra la app TRON.
              </p>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid2">
        <Panel title="Guardar borrador sin transferir" desc="El borrador queda en el registro; no envía fondos ni firma.">
          <button className="btn" onClick={() => notify("Borrador guardado sin transferir")}>Guardar borrador sin transferir</button>
          <hr className="divider" />
          <div className="row-between">
            <span className="card-desc">Disponibilidad del servidor · comprobación</span>
            <button className="btn btn-sm" onClick={() => notify("Servidor disponible · 0 intenciones de venta pendientes")}>Leer estado del servidor</button>
          </div>
        </Panel>
        <Panel title="Registro de red" desc="Lecturas de Nile y del registro de intenciones de venta." right={<button className="btn btn-sm btn-ghost" onClick={() => notify("Registro actualizado")}>Actualizar registro</button>}>
          <div className="grid2">
            <div>
              <div className="section-label">Nile · cartera de pruebas</div>
              <div className="kv"><span className="k">Conectado</span><span className="v ok-text">sí · red de pruebas</span></div>
              <div className="kv"><span className="k">Nile-HKD test wallet</span><span className="v">TAD1jHKPAh5wbGYcXiSevt9DC D9ouy4u</span></div>
              <div className="kv"><span className="k">TRX de prueba</span><span className="v">saldo 1000 · garantía de gas suficiente</span></div>
              <div className="kv"><span className="k">Origen de lectura</span><span className="v">RPC de Nile · nile.trongrid.io · solo lectura (caché del servidor)</span></div>
              <div className="kv"><span className="k">Última lectura</span><span className="v">hace 4 s · cada 15 s</span></div>
            </div>
            <div>
              <div className="section-label">Estado de la cuenta</div>
              <div className="kv"><span className="k">Cuenta Stripe</span><span className="v ok-text">activada</span></div>
              <div className="kv"><span className="k">TRX de prueba</span><span className="v">saldo 1000 · on-chain 1000.000000</span></div>
              <div className="kv"><span className="k">Fondeado</span><span className="v">para borrador de pruebas · no envía gas</span></div>
              <div className="kv"><span className="k">USDT on-chain</span><span className="v">0.000000</span></div>
              <div className="kv"><span className="k">USDT interno total</span><span className="v warn-text">No disponible</span></div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Pagos con tarjeta Stripe"
        desc="Los pagos introducidos online con tarjeta se verifican directamente con Stripe; este servidor retiene solo un token. Esto no es un MOTO ni un terminal de entrada del operador."
        right={stripe === "ok" ? <Badge tone="ok">● Cuenta Stripe activada · Test mode</Badge> : stripe === "checking" ? <Badge tone="warn">● Comprobando…</Badge> : <Badge tone="warn">● Servidor offline / comprobando</Badge>}
      >
        <div className="row">
          <button className="btn btn-sm" onClick={checkStripe} disabled={stripe === "checking"}>Reconectar estado</button>
          <button className="btn btn-sm btn-ghost" onClick={() => notify("Lista de intenciones de venta actualizada")}>Actualizar lista</button>
        </div>
        <p className="card-desc" style={{ marginTop: 10 }}>
          Solo se guarda la intención de venta — nunca tarjetas ni tokens de pago. Reconectar solo comprueba estados; nunca carga automáticamente. Las ventas fallidas requieren gestión manual.
        </p>
        <div className="section-label">Última lectura: comprobaciones del servidor · sin respuesta del servidor</div>
        <div className="empty">Sin pagos de Stripe</div>
        <div className="section-label">Historial de transacciones de Stripe</div>
        <div className="empty">Sin pagos de Stripe</div>
      </Panel>
    </div>
  );
}
