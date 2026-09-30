import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.tsx";
import Topbar from "./components/Topbar.tsx";
import Ticker from "./components/Ticker.tsx";
import { Toast } from "./components/Panel.tsx";
import EmvcoAttribution from "./components/EmvcoAttribution.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Transactions from "./pages/Transactions.tsx";
import CashDesk from "./pages/CashDesk.tsx";
import PhysicalTerminal from "./pages/PhysicalTerminal.tsx";
import PosRouting from "./pages/PosRouting.tsx";
import VirtualPos from "./pages/VirtualPos.tsx";
import Discrepancies from "./pages/Discrepancies.tsx";
import UsdtTron from "./pages/UsdtTron.tsx";
import EmvcoCert from "./pages/EmvcoCert.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import { handleEchoTest, processOfflineBatch, runEmvcoTestSuite, validateTransaction } from "./emvco/host.ts";

const TABS: [string, string][] = [
  ["dashboard", "Descripción general"],
  ["virtual-pos", "TPV Virtual"],
  ["transactions", "Transacciones"],
  ["nile-payouts", "Pagos de Nile"],
  ["ledger-device", "Dispositivo Ledger"],
  ["pos-routing", "Enrutamiento POS"],
];

const AUTH_KEY = "sl-cert-auth";

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [operator, setOperator] = useState(() => sessionStorage.getItem(AUTH_KEY + ":op") || "admin1");
  const [route, setRoute] = useState("virtual-pos");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Harness EMVCo expuesto en consola para pruebas manuales (sin UI).
  useEffect(() => {
    (window as unknown as { __emvco?: unknown }).__emvco = { handleEchoTest, validateTransaction, processOfflineBatch, runEmvcoTestSuite };
  }, []);

  const notify = (t: string) => setToast(t);

  const login = (op: string) => {
    setOperator(op);
    setAuthed(true);
    try {
      sessionStorage.setItem(AUTH_KEY, "1");
      sessionStorage.setItem(AUTH_KEY + ":op", op);
    } catch { /* sin storage */ }
    setToast("Acceso concedido · Welcome to Swift Ledger");
  };

  const logout = () => {
    setAuthed(false);
    try { sessionStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(AUTH_KEY + ":op"); } catch { /* noop */ }
  };

  if (!authed) return (<><Login onLogin={login} /><Toast text={toast} /></>);

  const page = (() => {
    switch (route) {
      case "emvco-cert": return <EmvcoCert operator={operator} notify={notify} />;
      case "dashboard": return <Dashboard notify={notify} />;
      case "transactions": return <Transactions notify={notify} />;
      case "cash-desk": return <CashDesk notify={notify} />;
      case "physical-terminal": return <PhysicalTerminal notify={notify} />;
      case "pos-routing": return <PosRouting notify={notify} />;
      case "virtual-pos": return <VirtualPos notify={notify} />;
      case "discrepancies": return <Discrepancies notify={notify} />;
      case "usdt-tron": return <UsdtTron notify={notify} />;
      default: return <Placeholder route={route} />;
    }
  })();

  return (
    <div className="app">
      <Sidebar route={route} onNavigate={setRoute} onLogout={logout} />
      <div className="main">
        <Topbar route={route} operator={operator} />
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={`tab ${route === id ? "active" : ""}`} onClick={() => setRoute(id)}>{label}</button>
          ))}
        </nav>
        <Ticker />
        <main className="content">
          {page}
          <EmvcoAttribution />
        </main>
      </div>
      <Toast text={toast} />
    </div>
  );
}
