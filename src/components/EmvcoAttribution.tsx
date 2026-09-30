// Pie de atribución de marcas — glifos SVG de referencia + leyenda legal EMVCo.
function EmvWordmark() {
  return (
    <span className="mark-chip" title="EMV®">
      <span style={{ background: "#003087", borderRadius: 3, padding: "2px 6px", display: "inline-flex" }}>
        <span style={{ color: "#fff", fontWeight: 900, fontStyle: "italic", fontSize: 10, lineHeight: 1 }}>EMV</span>
      </span>
    </span>
  );
}
function EmvCoWordmark() {
  return (
    <span style={{ fontWeight: 800, fontSize: 14, color: "#003087", letterSpacing: "-0.02em" }} title="EMVCo, LLC">
      EMV<span style={{ color: "#0072ce" }}>Co</span>
    </span>
  );
}
function ContactlessGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }} aria-hidden="true">
      <path d="M5.5 9.2a6.3 6.3 0 0 1 0 5.6" />
      <path d="M8.8 7a9.9 9.9 0 0 1 0 10" />
      <path d="M12.1 4.8a13.4 13.4 0 0 1 0 14.4" />
      <path d="M15.4 2.6a17 17 0 0 1 0 18.8" />
    </svg>
  );
}
function QrGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="#a1a1aa" style={{ width: 16, height: 16 }} aria-hidden="true">
      <path d="M2 2h7v7H2V2Zm1.6 1.6v3.8h3.8V3.6H3.6ZM15 2h7v7h-7V2Zm1.6 1.6v3.8h3.8V3.6h-3.8ZM2 15h7v7H2v-7Zm1.6 1.6v3.8h3.8v-3.8H3.6Z" />
      <rect x="11" y="3" width="2" height="2" /><rect x="11" y="6.5" width="2" height="2" />
      <rect x="3" y="11" width="2" height="2" /><rect x="6.5" y="11" width="2" height="2" />
      <rect x="11" y="11" width="3" height="3" /><rect x="15.5" y="15.5" width="2" height="2" />
      <rect x="19" y="11" width="2" height="2" /><rect x="11" y="16" width="2" height="2" />
      <rect x="16" y="19" width="3" height="3" /><rect x="20" y="20" width="2" height="2" />
      <rect x="19" y="15.5" width="2" height="2" />
    </svg>
  );
}
function SrcGlyph() {
  return (
    <span className="mark-chip" title="EMV Secure Remote Commerce">
      <span style={{ background: "#003087", borderRadius: 3, padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" style={{ width: 10, height: 10 }} aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 8, letterSpacing: "0.08em" }}>SRC</span>
      </span>
    </span>
  );
}
function CertGlyph() {
  return (
    <span className="mark-chip" title="Marcas de certificación EMVCo (referencial)">
      <span style={{ border: "1px solid rgba(0,114,206,0.5)", background: "rgba(0,114,206,0.12)", borderRadius: 999, padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#0072ce" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }} aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.7 2.7L16 9.5" />
        </svg>
        <span style={{ color: "#0072ce", fontWeight: 700, fontSize: 7, letterSpacing: "0.14em" }}>CERT</span>
      </span>
    </span>
  );
}

export default function EmvcoAttribution() {
  return (
    <footer className="att-footer">
      <div className="marks">
        <EmvWordmark />
        <EmvCoWordmark />
        <span className="mark-chip">{ContactlessGlyph()}<span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: "#71717a" }}>CONTACTLESS</span></span>
        <span className="mark-chip">{QrGlyph()}<span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: "#71717a" }}>QR</span></span>
        <SrcGlyph />
        <CertGlyph />
        <span className="mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "#52525b", marginLeft: "auto" }}>
          MARCAS COMERCIALES · ATRIBUCIÓN EMVCo, LLC
        </span>
      </div>
      <p className="legal">
        EMV®, el logotipo de EMVCo, el icono de pago EMV Secure Remote Commerce, las marcas EMV Contactless
        (símbolo e indicador), las marcas EMV QR y las marcas de certificación EMVCo son marcas comerciales o
        marcas registradas de <b style={{ color: "#a1a1aa" }}>EMVCo, LLC</b> en los Estados Unidos y en otros países,
        y se utilizan aquí con fines de referencia y con permiso. Todos los derechos reservados.
      </p>
      <p className="legal mono" style={{ fontSize: 9 }}>
        Swift Ledger · Entorno de certificación EMVCo L3 — emulador de desarrollo; no es un producto ni un
        terminal certificado por EMVCo. Réplica funcional con fines de laboratorio.
      </p>
    </footer>
  );
}
