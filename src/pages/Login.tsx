import { useState } from "react";
import Logo from "../components/Logo.tsx";

export default function Login({ onLogin }: { onLogin: (operator: string) => void }) {
  const [user, setUser] = useState("admin1");
  const [pwd, setPwd] = useState("");

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <Logo size={34} />
        <p className="mono" style={{ color: "#71717a", letterSpacing: "0.3em", fontSize: 10, marginTop: 26 }}>
          — SOLO PARA USO INTERNO
        </p>
        <h1>Acceso<br />restringido .</h1>
        <p>Este sistema está reservado para operadores autorizados de Swift Ledger.</p>
        <p className="mono" style={{ fontSize: 10, marginTop: 34 }}>
          <span className="dot err" />¿Necesitas ayuda para recuperar el acceso? Ponte en contacto con el administrador.
        </p>
      </div>
      <div className="login-panel">
        <span className="chip">ACCESO DEL OPERADOR</span>
        <h2>Iniciar sesión</h2>
        <p className="hint">Introduce tus credenciales para continuar.</p>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(user.trim() || "admin1"); }}>
          <label className="f-label">Nombre de usuario</label>
          <input className="input" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          <label className="f-label">Contraseña</label>
          <input className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
          <p style={{ fontSize: 10, color: "#52525b", margin: "6px 0 14px" }}>
            Las credenciales distinguen entre mayúsculas y minúsculas.
          </p>
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
            Iniciar sesión →
          </button>
        </form>
        <p style={{ fontSize: 11, color: "#71717a", marginTop: 14 }}>
          ¿Olvidaste tu contraseña? Recupera el acceso con un código de recuperación guardado o un correo electrónico verificado.
        </p>
        <div className="login-badges">
          <span>● EMV</span><span>● PCI DSS</span><span>● AES-256</span>
        </div>
        <p style={{ textAlign: "center", fontSize: 9, color: "#52525b", marginTop: 8 }}>
          Verificación pendiente; no se trata de una solicitud de certificación.
        </p>
        <div className="login-foot">Acceso restringido · Solo para uso interno</div>
      </div>
    </div>
  );
}
