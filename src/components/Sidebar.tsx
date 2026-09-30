import Logo from "./Logo.tsx";

export interface NavItem { id: string; label: string; sub?: string; admin?: boolean }
export interface NavSection { title?: string; items: NavItem[] }

export const NAV: NavSection[] = [
  { items: [{ id: "emvco-cert", label: "EMVCo L3 · Certificación", sub: "entorno + auditoría" }] },
  { title: "Operaciones", items: [
    { id: "dashboard", label: "Panel" },
    { id: "transactions", label: "Transacciones" },
    { id: "cash-desk", label: "Caja" },
    { id: "physical-terminal", label: "Terminal físico" },
    { id: "pos-routing", label: "Enrutamiento POS", admin: true },
    { id: "virtual-pos", label: "TPV Virtual", sub: "órdenes USDT", admin: true },
    { id: "inteligencia", label: "Inteligencia de decisiones" },
  ] },
  { title: "Pagos y registros", items: [
    { id: "charge-history", label: "Historial de cargos" },
    { id: "pending-auth", label: "Autorizaciones pendientes" },
    { id: "new-charge", label: "Nueva carga" },
    { id: "discrepancies", label: "Discrepancias en los pagos" },
  ] },
  { title: "Cripto y tesorería", items: [
    { id: "crypto-exchange", label: "Intercambio de cripto" },
    { id: "usdt-tron", label: "USDT TRON", admin: true },
    { id: "ledger-device", label: "Dispositivo Ledger" },
    { id: "lightning", label: "Lightning: no operativo" },
    { id: "deposits", label: "Mis depósitos" },
    { id: "usdt-treasury", label: "Tesoro de USDT" },
    { id: "nile-payouts", label: "Pagos USDT de Nile" },
    { id: "usdt-move", label: "Depósitos y retiros USDT" },
  ] },
  { title: "Seguridad y cumplimiento", items: [
    { id: "encrypted-keys", label: "Claves cifradas" },
    { id: "banking-compliance", label: "Cumplimiento bancario" },
    { id: "documents", label: "Documentos" },
  ] },
  { items: [{ id: "utilities", label: "Utilidades" }] },
];

const BOTTOM: NavItem[] = [
  { id: "help", label: "Centro de ayuda" },
  { id: "security-settings", label: "Configuración de seguridad" },
];

interface Props {
  route: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ route, onNavigate, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-logo"><Logo size={26} /></div>
      <nav className="side-nav">
        {NAV.map((section, i) => (
          <div className="side-section" key={i}>
            {section.title && <div className="side-section-title">{section.title}</div>}
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`side-item ${route === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span>
                  {item.label}
                  {item.sub && <span className="sub">{item.sub}</span>}
                </span>
                {item.admin && <span className="admin-chip">ADMIN</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-bottom">
        {BOTTOM.map((item) => (
          <button key={item.id} className={`side-item ${route === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
            {item.label}
          </button>
        ))}
        <button className="side-item" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
