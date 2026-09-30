import { useState } from "react";
import { Field, Panel } from "../Panel.tsx";
import {
  batch0420Fields, echo0800Fields, fromWireHex, packISO, sale0200Fields, unpackISO,
} from "../../emvco/iso8583.ts";
import type { PackedMessage, UnpackedMessage } from "../../emvco/iso8583.ts";
import { iccDataTLV, TEST_CARDS } from "../../emvco/cards.ts";
import { loadProfile } from "../../emvco/profile.ts";
import { randNum } from "../../lib/format.ts";

type Template = "0800" | "0200" | "0420";

export default function IsoLab() {
  const [template, setTemplate] = useState<Template>("0200");
  const [amount, setAmount] = useState("250.50");
  const [entryMode, setEntryMode] = useState("CHIP");
  const [cardId, setCardId] = useState(TEST_CARDS[0].id);
  const [useIcc, setUseIcc] = useState(true);
  const [packed, setPacked] = useState<PackedMessage | null>(null);
  const [parseInput, setParseInput] = useState("");
  const [parsed, setParsed] = useState<UnpackedMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const build = () => {
    setError(null);
    try {
      const profile = loadProfile();
      const stanStr = randNum(6);
      const card = TEST_CARDS.find((c) => c.id === cardId) ?? TEST_CARDS[0];
      const fields = template === "0800"
        ? echo0800Fields(profile, stanStr)
        : template === "0420"
          ? batch0420Fields({ ref: `LAB${randNum(6)}`, total: parseFloat(amount) || 0, entryMode, stan: stanStr }, profile)
          : sale0200Fields({
              amount: parseFloat(amount) || 0, entryMode, stanStr, profile,
              pan: card.pan, exp: card.exp,
              icc: useIcc ? iccDataTLV(card, Math.round((parseFloat(amount) || 0) * 100)) : undefined,
            });
      setPacked(packISO(template, fields));
      setParsed(null);
    } catch (e) {
      setPacked(null);
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  const parse = () => {
    setError(null);
    try {
      const ascii = /^[0-9a-fA-F\s]+$/.test(parseInput.trim()) && parseInput.trim().length % 2 === 0
        ? fromWireHex(parseInput.trim())
        : parseInput;
      setParsed(unpackISO(ascii));
      setPacked(null);
    } catch (e) {
      setParsed(null);
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <div className="stack">
      <div className="grid2">
        <Panel title="Constructor ISO 8583" desc="Plantillas del harness con tarjetas de prueba EMV.">
          <div className="grid2">
            <Field label="Plantilla (MTI)">
              <select className="select" value={template} onChange={(e) => setTemplate(e.target.value as Template)}>
                <option value="0800">0800 · Network Mgmt</option>
                <option value="0200">0200 · Autorización financiera</option>
                <option value="0420">0420 · Batch upload</option>
              </select>
            </Field>
            <Field label="Tarjeta de prueba">
              <select className="select" value={cardId} onChange={(e) => setCardId(e.target.value)}>
                {TEST_CARDS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          {template !== "0800" && (
            <div className="grid2">
              <Field label="Monto (DE4)">
                <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              </Field>
              <Field label="Entry mode (DE22)">
                <select className="select" value={entryMode} onChange={(e) => setEntryMode(e.target.value)}>
                  <option value="CHIP">CHIP (05)</option>
                  <option value="CTLS">CTLS (07)</option>
                  <option value="BANDA">BANDA (02)</option>
                </select>
              </Field>
            </div>
          )}
          {template === "0200" && (
            <div className="row-between" style={{ marginTop: 10 }}>
              <span className="card-desc">Incluir DE55 (ICC / ARQC TLV)</span>
              <button className={`toggle ${useIcc ? "on" : ""}`} onClick={() => setUseIcc(!useIcc)} aria-label="DE55" />
            </div>
          )}
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={build}>Empaquetar →</button>
          {error && <p className="err-text" style={{ fontSize: 11, marginTop: 8 }}>{error}</p>}
        </Panel>

        <Panel title="Mensaje empaquetado" desc="MTI + bitmap + campos, en ASCII y wire hex.">
          {!packed ? <div className="empty">Sin mensaje — usa el constructor.</div> : (
            <>
              <div className="section-label">ASCII</div>
              <div className="codebox">{packed.ascii}</div>
              <div className="section-label">Wire hex</div>
              <div className="codebox">{packed.wireHex}</div>
              <div className="kv"><span className="k">Bitmap</span><span className="v">{packed.bitmapHex}</span></div>
              <table className="table" style={{ marginTop: 8 }}>
                <thead><tr><th>DE</th><th>BIT</th><th>VALOR</th></tr></thead>
                <tbody>
                  {packed.table.map((r) => (
                    <tr key={r.de}><td className="mono">{r.de}</td><td className="mono">{r.bit}</td><td className="mono" style={{ wordBreak: "break-all" }}>{r.value}</td></tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => { setParseInput(packed.wireHex); setParsed(null); }}>Mover al parser ↓</button>
            </>
          )}
        </Panel>
      </div>

      <Panel title="Parser ISO 8583" desc="Pega un wire hex (o el ASCII) y desglosa bitmap + campos.">
        <textarea
          className="input mono"
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
          placeholder="Ej. 30323030F23… (wire hex) o mensaje ASCII"
          value={parseInput}
          onChange={(e) => setParseInput(e.target.value)}
        />
        <button className="btn" style={{ marginTop: 8 }} onClick={parse}>Parsear ←</button>
        {parsed && (
          <>
            <div className="kv" style={{ marginTop: 8 }}><span className="k">MTI</span><span className="v">{parsed.mti}</span></div>
            <div className="kv"><span className="k">Bitmap</span><span className="v">{parsed.bitmapHex}</span></div>
            <table className="table" style={{ marginTop: 8 }}>
              <thead><tr><th>DE</th><th>BIT</th><th>VALOR</th></tr></thead>
              <tbody>
                {parsed.table.map((r) => (
                  <tr key={r.de}><td className="mono">{r.de}</td><td className="mono">{r.bit}</td><td className="mono" style={{ wordBreak: "break-all" }}>{r.value}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="faint" style={{ fontSize: 10, marginTop: 6 }}>Tip: el constructor de arriba genera wires válidos para practicar el parseo.</p>
      </Panel>
    </div>
  );
}
