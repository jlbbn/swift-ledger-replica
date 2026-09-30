export const ROUTE_LABELS: Record<string, string> = {
  "emvco-cert": "EMVCo L3",
  dashboard: "Panel",
  transactions: "Transacciones",
  "cash-desk": "Caja",
  "physical-terminal": "Terminal físico",
  "pos-routing": "Enrutamiento POS",
  "virtual-pos": "TPV Virtual",
  inteligencia: "Inteligencia de decisiones",
  "charge-history": "Historial de cargos",
  "pending-auth": "Autorizaciones pendientes",
  "new-charge": "Nueva carga",
  discrepancies: "Discrepancias en los pagos",
  "crypto-exchange": "Intercambio de cripto",
  "usdt-tron": "USDT TRON",
  "ledger-device": "Dispositivo Ledger",
  lightning: "Lightning",
  deposits: "Mis depósitos",
  "usdt-treasury": "Tesoro de USDT",
  "nile-payouts": "Pagos USDT de Nile",
  "usdt-move": "Depósitos y retiros USDT",
  "encrypted-keys": "Claves cifradas",
  "banking-compliance": "Cumplimiento bancario",
  documents: "Documentos",
  utilities: "Utilidades",
  help: "Centro de ayuda",
  "security-settings": "Configuración de seguridad",
};

export default function Topbar({ route, operator }: { route: string; operator: string }) {
  return (
    <header className="topbar">
      <div className="crumb">Operaciones&nbsp;&nbsp;/&nbsp;&nbsp;<b>{ROUTE_LABELS[route] ?? route}</b></div>
      <div className="topbar-right">
        <span><span className="dot ok" />Sesión activa</span>
        <span aria-hidden="true" style={{ cursor: "pointer" }}>♨</span>
        <span className="avatar">{operator.slice(0, 1).toUpperCase()}</span>
      </div>
    </header>
  );
}
