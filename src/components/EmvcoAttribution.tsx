// Pie de atribución de marcas — identidad EMVCo: navy #003359, verde hoja
// #78BE20, enlaces en azul #0000FF subrayado, tipografía Arial.
const NAVY = "#003359";
const GREEN = "#78BE20";

function EmvWordmark() {
  return (
    <span className="mark-chip" title="EMV®">
      <span style={{ background: NAVY, borderRadius: 3, padding: "2px 6px", display: "inline-flex" }}>
        <span style={{ color: "#fff", fontWeight: 900, fontStyle: "italic", fontSize: 10, lineHeight: 1, fontFamily: "Arial, Helvetica, sans-serif" }}>EMV</span>
      </span>
    </span>
  );
}
function EmvCoWordmark() {
  return (
    <span className="mark-chip" title="EMVCo, LLC">
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        <path fill={GREEN} d="M12 2c4.5 2.2 7 5.6 7 9.2 0 4.3-3.6 7.6-8 8.6 2-1.3 3.4-3.4 3.4-5.7 0-3.4-3-6.2-7.4-7C8.6 5 10 3.4 12 2Z" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 14, color: NAVY, letterSpacing: "-0.02em", fontFamily: "Arial, Helvetica, sans-serif" }}>EMVCo</span>
    </span>
  );
}
function ContactlessGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }} aria-hidden="true">
      <path d="M5.5 9.2a6.3 6.3 0 0 1 0 5.6" />
      <path d="M8.8 7a9.9 9.9 0 0 1 0 10" />
      <path d="M12.1 4.8a13.4 13.4 0 0 1 0 14.4" />
      <path d="M15.4 2.6a17 17 0 0 1 0 18.8" />
    </svg>
  );
}
function QrGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill={NAVY} style={{ width: 16, height: 16 }} aria-hidden="true">
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
      <span style={{ background: NAVY, borderRadius: 3, padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" style={{ width: 10, height: 10 }} aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 8, letterSpacing: "0.08em", fontFamily: "Arial, Helvetica, sans-serif" }}>SRC</span>
      </span>
    </span>
  );
}
function CertGlyph() {
  return (
    <span className="mark-chip" title="Marcas de certificación EMVCo (referencial)">
      <span style={{ border: `1px solid ${GREEN}`, background: "rgba(120,190,32,0.12)", borderRadius: 999, padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }} aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.7 2.7L16 9.5" />
        </svg>
        <span style={{ color: "#3f7a0d", fontWeight: 700, fontSize: 7, letterSpacing: "0.14em", fontFamily: "Arial, Helvetica, sans-serif" }}>CERT</span>
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
        <span className="mark-chip">{ContactlessGlyph()}<span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: NAVY, fontFamily: "Arial, Helvetica, sans-serif" }}>CONTACTLESS</span></span>
        <span className="mark-chip">{QrGlyph()}<span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: NAVY, fontFamily: "Arial, Helvetica, sans-serif" }}>QR</span></span>
        <SrcGlyph />
        <CertGlyph />
        <span className="mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "#8a94a6", marginLeft: "auto" }}>
          MARCAS COMERCIALES · ATRIBUCIÓN EMVCo, LLC
        </span>
      </div>
      <p className="legal" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        EMV®, el logotipo de EMVCo, el icono de pago EMV Secure Remote Commerce, las marcas EMV Contactless
        (símbolo e indicador), las marcas EMV QR y las marcas de certificación EMVCo son marcas comerciales o
        marcas registradas de <b style={{ color: "#333" }}>EMVCo, LLC</b> en los Estados Unidos y en otros países,
        y se utilizan aquí con fines de referencia y con permiso. Todos los derechos reservados.
        Contacto de aprobación: <a href="mailto:3ds_approval@emvco.com" style={{ color: "#0000ff", textDecoration: "underline" }}>3ds_approval@emvco.com</a>
      </p>
      <p className="legal mono" style={{ fontSize: 9 }}>
        Swift Ledger · Entorno de certificación EMVCo L3 — no es un producto ni un terminal certificado
        por EMVCo. Uso interno de laboratorio.
      </p>
    </footer>
  );
}
