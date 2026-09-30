import { useState } from "react";
import { Badge, Panel } from "../components/Panel.tsx";

export default function PosRouting({ notify }: { notify: (t: string) => void }) {
  const [server, setServer] = useState<"checking" | "ok">("checking");
  const [ledger, setLedger] = useState<"pending" | "verified">("pending");

  const verifyLedger = () => {
    setLedger("pending");
    setTimeout(() => { setLedger("verified"); notify("Ledger verificado vía USB · solo lectura"); }, 1500);
  };
  const checkServer = () => {
    setServer("checking");
    setTimeout(() => { setServer("ok"); notify("Configuración del servidor verificada · nodo Nile accesible"); }, 1300);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Solo administrador · Operaciones · Enrutamiento POS</div>
          <h1 className="h1">Enrutamiento POS</h1>
          <p className="sub">Rutas de confianza separadas. Revise los enlaces exactos entre terminal y comerciante antes de usar la pantalla operativa adecuada. Esta página no realiza ninguna venta ni liquidación.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => notify("Abriendo cliente POS…")}>Abrir cliente POS</button>
          <button className="btn" onClick={() => notify("Dispositivos actualizados")}>⟳ Actualizar dispositivos</button>
        </div>
      </div>

      <div className="codebox">POST · /api/engine/sales/forced — FlatLedger recordings must not use TLS and secure storage is allowed in offline mode</div>

      <div className="card">
        <div className="eyebrow">01 / Grabación sin conexión</div>
        <h3 className="card-title" style={{ marginTop: 4 }}>Enlaces de terminal y comerciante</h3>
        <p className="card-desc">Los registros de FlatLedger de ventas forzadas son entradas sin conexión; no contactan con un procesador de tarjetas, no transfieren fondos ni liquidan un lote.</p>
        <hr className="divider" />
        <div className="kv"><span className="k">Terminal de confianza + comerciante</span><span className="v ok-text">android-acba2a93-d486-48b0-a226-fa6129a14817 · Merchant 1</span></div>
        <div className="kv"><span className="k">Ámbito</span><span className="v">ANDROID_OFFLINE · FLATLEDGER ONLY</span></div>
      </div>

      <Panel title="Registro de dispositivos" desc="Un ID de hardware identifica su dispositivo, pero no es autenticación. Almacene datos de tarjeta en el dispositivo o en este navegador.">
        <div className="row-between">
          <span className="card-desc">Dispositivos registrados: <b className="mono">1</b></span>
          <button className="btn btn-sm" onClick={() => notify("Dispositivo registrado · vinculación PosLink pendiente de autorizar")}>Registrar dispositivo</button>
        </div>
        <div className="kv" style={{ marginTop: 8 }}><span className="k">android-acba2a93-d486-48b0-a226-fa6129a14817</span><span className="v ok-text">vinculado · Merchant 1</span></div>
        <p className="card-desc" style={{ marginTop: 8 }}>
          Los identificadores de hardware de un dispositivo son de confianza, pero sus términos y terminales. El uso previsto es la provisión de una clave API y un token. Nunca almacene datos de tarjeta en el dispositivo ni en este navegador.
        </p>
      </Panel>

      <div className="card">
        <div className="eyebrow">03 / Límite de conexión</div>
        <h3 className="card-title" style={{ margin: "4px 0 10px" }}>Conexión del libro mayor</h3>
        <p className="card-desc">La conexión del monedero de hardware es independiente de los registros sin conexión de FlatLedger y de los terminales del procesador bancario.</p>

        <div className="section-label">Estado de la conexión del libro mayor</div>
        <div className="kv"><span className="k">La grabación forzada de ventas no requiere libro mayor ni TRON.</span><span className="v">Verifique el libro mayor físico por separado, sin firmar ni enviar.</span></div>

        <div className="section-label" style={{ marginTop: 16 }}>Verificar Ledger a través de USB</div>
        <div className="warn-box">⚠
          <div><b>Solo lectura</b> — confirma una dirección pública en el dispositivo. Nunca firma, fondea, reserva ni envía una transacción. No se necesita activación de tesorería ni saldo.</div>
        </div>
        <p className="card-desc" style={{ marginTop: 10 }}>
          Conéctese por USB, cierre Ledger Live, desbloquee el dispositivo y abra la app TRON. Use Chrome o Edge de escritorio a través de HTTPS. Android Chrome no admite este flujo USB WebHID. Nunca introduzca su PIN ni su frase de recuperación aquí.
        </p>
        <p className="card-desc">Se espera Ledger Nano X como política de dispositivo. Esta comprobación de dirección confirma la usabilidad de la app TRON, no el modelo físico del Ledger.</p>
        <div className="grid2" style={{ marginTop: 8 }}>
          <div className="kv"><span className="k">Dirección pública esperada</span><span className="v">TAD1jHKPAh5wbGYcXiSevt9DCD9ouy4u ⧉</span></div>
          <div className="kv"><span className="k">Ruta de derivación</span><span className="v">44' / 195' / 0' / 0 / 0 ⧉</span></div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btn-sm" onClick={verifyLedger}>Verificar Ledger a través de USB</button>
          {ledger === "verified"
            ? <Badge tone="ok">✓ Ledger verificado · solo lectura</Badge>
            : <Badge tone="warn">◌ Conexión pendiente · Ledger físico no verificado en esta sesión del navegador</Badge>}
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">03 / Límite de conexión</div>
        <h3 className="card-title" style={{ margin: "4px 0 10px" }}>Configuración del servidor y nodo Nile · no es estado USB</h3>
        <p className="card-desc">Estas comprobaciones de solo lectura no pueden detectar el hardware conectado a su ordenador. Una lectura pública correcta no es prueba de una conexión a un nodo propio.</p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btn-sm" onClick={checkServer} disabled={server === "checking"}>
            {server === "checking" ? "◌ Comprobando la configuración del servidor…" : "⟳ Recomprobar servidor"}
          </button>
          {server === "ok" && <Badge tone="ok">✓ Configuración verificada · nodo Nile accesible</Badge>}
        </div>
      </div>
    </div>
  );
}
