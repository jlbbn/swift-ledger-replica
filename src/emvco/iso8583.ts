// ─── ISO 8583:1993 · capa de mensajería del entorno de certificación ─────────
// Subconjunto de Data Elements usados por el harness L3. Wire: MTI (4 ASCII)
// + bitmap primario (16 dígitos hex, bits 2..64) + campos ASCII, con LLVAR /
// LLLVAR para longitud variable y valores hex para campos binarios.
// Empaquetado y parseo deterministas — misma entrada, mismos bytes.

export type DEId =
  | "DE2" | "DE3" | "DE4" | "DE7" | "DE11" | "DE12" | "DE13" | "DE14"
  | "DE22" | "DE24" | "DE25" | "DE32" | "DE35" | "DE37" | "DE38" | "DE39"
  | "DE41" | "DE42" | "DE49" | "DE52" | "DE53" | "DE55" | "DE60" | "DE64";

export type Alpha = "n" | "an" | "ans" | "z" | "b";
export type FieldMap = Partial<Record<DEId, string>>;

export type FSpec = { bit: number } & (
  | { kind: "fixed"; len: number; alpha: Alpha }
  | { kind: "llvar"; max: number; alpha: Alpha }
  | { kind: "lllvar"; max: number; alpha: Alpha }
);

export const ISO_FIELDS: Record<DEId, FSpec> = {
  DE2:  { bit: 2,  kind: "llvar",  max: 19,  alpha: "n"   },
  DE3:  { bit: 3,  kind: "fixed",  len: 6,   alpha: "n"   },
  DE4:  { bit: 4,  kind: "fixed",  len: 12,  alpha: "n"   },
  DE7:  { bit: 7,  kind: "fixed",  len: 10,  alpha: "n"   },
  DE11: { bit: 11, kind: "fixed",  len: 6,   alpha: "n"   },
  DE12: { bit: 12, kind: "fixed",  len: 6,   alpha: "n"   },
  DE13: { bit: 13, kind: "fixed",  len: 4,   alpha: "n"   },
  DE14: { bit: 14, kind: "fixed",  len: 4,   alpha: "n"   },
  DE22: { bit: 22, kind: "fixed",  len: 3,   alpha: "n"   },
  DE24: { bit: 24, kind: "fixed",  len: 3,   alpha: "n"   },
  DE25: { bit: 25, kind: "fixed",  len: 2,   alpha: "n"   },
  DE32: { bit: 32, kind: "llvar",  max: 11,  alpha: "n"   },
  DE35: { bit: 35, kind: "llvar",  max: 37,  alpha: "z"   },
  DE37: { bit: 37, kind: "fixed",  len: 12,  alpha: "an"  },
  DE38: { bit: 38, kind: "fixed",  len: 6,   alpha: "an"  },
  DE39: { bit: 39, kind: "fixed",  len: 2,   alpha: "an"  },
  DE41: { bit: 41, kind: "fixed",  len: 8,   alpha: "ans" },
  DE42: { bit: 42, kind: "fixed",  len: 15,  alpha: "ans" },
  DE49: { bit: 49, kind: "fixed",  len: 3,   alpha: "n"   },
  DE52: { bit: 52, kind: "fixed",  len: 16,  alpha: "b"   }, // PIN block (8 bytes)
  DE53: { bit: 53, kind: "fixed",  len: 16,  alpha: "n"   },
  DE55: { bit: 55, kind: "lllvar", max: 255, alpha: "b"   }, // ICC data (TLV)
  DE60: { bit: 60, kind: "lllvar", max: 255, alpha: "ans" },
  DE64: { bit: 64, kind: "fixed",  len: 16,  alpha: "b"   }, // MAC (8 bytes)
};

export const DE_BY_BIT: Record<number, DEId> = Object.fromEntries(
  Object.entries(ISO_FIELDS).map(([de, spec]) => [spec.bit, de as DEId]),
);

const strip = (v: string, re: RegExp) => v.replace(re, "");
const pad = (s: string, len: number, left: boolean, ch: string) => (left ? s.padStart(len, ch) : s.padEnd(len, ch));

function normalize(de: DEId, raw: string): string {
  const spec = ISO_FIELDS[de];
  const v = String(raw);
  switch (spec.alpha) {
    case "n": return strip(v, /\D/g);
    case "b": return strip(v.toUpperCase(), /[^0-9A-F]/g);
    default: return v;
  }
}

function emit(de: DEId, raw: string): string {
  const spec = ISO_FIELDS[de];
  const v = normalize(de, raw);
  if (spec.alpha === "b" && v.length % 2 !== 0) throw new Error(`${de}: valor binario con longitud impar`);
  if (spec.kind === "fixed") {
    if (spec.alpha === "n" || spec.alpha === "b") {
      if (v.length > spec.len) throw new Error(`${de}: longitud ${v.length} > fija ${spec.len}`);
      return pad(v, spec.len, true, "0");
    }
    // an/ans/z: los terminales truncan los datos alfanuméricos al ancho fijo del DE
    return pad(v.slice(0, spec.len), spec.len, false, " ");
  }
  const digits = spec.kind === "llvar" ? 2 : 3;
  const byteCount = spec.alpha === "b" ? v.length / 2 : v.length;
  if (byteCount > spec.max) throw new Error(`${de}: longitud ${byteCount} > máx ${spec.max}`);
  return String(byteCount).padStart(digits, "0") + v;
}

export interface PackedMessage {
  ascii: string;
  wireHex: string;
  bitmapHex: string;
  table: { de: DEId; bit: number; value: string }[];
}

export function toWireHex(ascii: string): string {
  return Array.from(ascii, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}
export function fromWireHex(hex: string): string {
  if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) throw new Error("wire hex inválido");
  let out = "";
  for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return out;
}

export function packISO(mti: string, fields: FieldMap): PackedMessage {
  const entries = (Object.keys(fields) as DEId[])
    .filter((de) => fields[de] !== undefined && fields[de] !== "")
    .sort((a, b) => ISO_FIELDS[a].bit - ISO_FIELDS[b].bit);
  const bits = new Set(entries.map((de) => ISO_FIELDS[de].bit));
  let bin = "";
  for (let b = 1; b <= 64; b++) bin += bits.has(b) ? "1" : "0";
  let bitmapHex = "";
  for (let i = 0; i < 64; i += 4) bitmapHex += parseInt(bin.slice(i, i + 4), 2).toString(16).toUpperCase();
  const body = entries.map((de) => emit(de, fields[de]!)).join("");
  const ascii = mti + bitmapHex + body;
  return {
    ascii,
    wireHex: toWireHex(ascii),
    bitmapHex,
    table: entries.map((de) => ({ de, bit: ISO_FIELDS[de].bit, value: normalize(de, fields[de]!).trimEnd() })),
  };
}

export interface UnpackedMessage {
  mti: string;
  bitmapHex: string;
  fields: FieldMap;
  table: { de: DEId; bit: number; value: string }[];
}

export function unpackISO(ascii: string): UnpackedMessage {
  if (ascii.length < 20) throw new Error("mensaje demasiado corto para MTI + bitmap");
  const mti = ascii.slice(0, 4);
  if (!/^\d{4}$/.test(mti)) throw new Error(`MTI inválido: ${mti}`);
  const bitmapHex = ascii.slice(4, 20).toUpperCase();
  let bin = "";
  for (const c of bitmapHex) bin += parseInt(c, 16).toString(2).padStart(4, "0");
  let pos = 20;
  const fields: FieldMap = {};
  const table: UnpackedMessage["table"] = [];
  for (let b = 2; b <= 64; b++) {
    if (bin[b - 1] !== "1") continue;
    const de = DE_BY_BIT[b];
    const spec = ISO_FIELDS[de];
    if (!spec) throw new Error(`DE${b} fuera del subset del harness`);
    let value: string;
    if (spec.kind === "fixed") {
      value = ascii.slice(pos, pos + spec.len);
      pos += spec.len;
    } else {
      const digits = spec.kind === "llvar" ? 2 : 3;
      const declared = parseInt(ascii.slice(pos, pos + digits), 10);
      pos += digits;
      const chars = spec.alpha === "b" ? declared * 2 : declared;
      value = ascii.slice(pos, pos + chars);
      pos += chars;
    }
    const cleaned = spec.alpha === "an" || spec.alpha === "ans" || spec.alpha === "z" ? value.trimEnd() : value;
    fields[de] = cleaned;
    table.push({ de, bit: b, value: cleaned });
  }
  return { mti, bitmapHex, fields, table };
}

// ─── BER-TLV (DE55 · datos EMV del chip) ─────────────────────────────────────
export interface TlvNode { tag: string; length: number; value: string }

export function buildTLV(tag: string, valueHex: string): string {
  const t = tag.toUpperCase();
  const v = strip(valueHex.toUpperCase(), /[^0-9A-F]/g);
  if (v.length % 2 !== 0) throw new Error(`TLV ${t}: valor impar`);
  let len = (v.length / 2).toString(16).toUpperCase().padStart(2, "0");
  if (v.length / 2 > 0x7F) {
    const n = (v.length / 2).toString(16).toUpperCase();
    len = (0x80 | (n.length / 2 + (n.length % 2))).toString(16).toUpperCase().padStart(2, "0")
      + n.padStart(Math.ceil(n.length / 2) * 2, "0");
  }
  return t + len + v;
}

export function parseTLV(hex: string): TlvNode[] {
  const h = strip(hex.toUpperCase(), /[^0-9A-F]/g);
  const out: TlvNode[] = [];
  let i = 0;
  while (i < h.length) {
    let tag = h.slice(i, i + 2); i += 2;
    if ((parseInt(tag, 16) & 0x1f) === 0x1f) { tag += h.slice(i, i + 2); i += 2; }
    let lb = parseInt(h.slice(i, i + 2), 16); i += 2;
    let len = lb;
    if (lb & 0x80) {
      const n = lb & 0x7f;
      len = parseInt(h.slice(i, i + n * 2), 16); i += n * 2;
    }
    const value = h.slice(i, i + len * 2); i += len * 2;
    out.push({ tag, length: len, value });
  }
  return out;
}

// ─── Plantillas del harness ──────────────────────────────────────────────────
const d = new Date();
const mm = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
const hh = String(d.getHours()).padStart(2, "0");
const mi = String(d.getMinutes()).padStart(2, "0");
const ss = String(d.getSeconds()).padStart(2, "0");
const yy = String(d.getFullYear()).slice(-2);

export const DE7_NOW = `${mm}${dd}${hh}${mi}${ss}`;
export const DE12_NOW = `${hh}${mi}${ss}`;
export const DE13_NOW = `${mm}${dd}`;
export const DE14_NOW = `${yy}${mm}`;

// DE41 (Terminal ID) es ans fijo de 8 — se normaliza el TID del perfil al wire
export function de41(tid: string): string {
  return tid.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8).padEnd(8, "0");
}

export function echo0800Fields(profile: { terminalId: string; serial?: string }, stanStr: string): FieldMap {
  return {
    DE7: DE7_NOW, DE11: stanStr, DE24: "001", DE41: de41(profile.terminalId),
    DE42: "SWIFTLEDGER CERT", DE53: "0001", DE60: `LOGON ${profile.serial ?? ""}`.trim(),
  };
}

export interface SaleFieldsInput {
  amount: number;           // unidades
  entryMode: string;        // CHIP | CTLS | BANDA | 02/05/07/91
  stanStr: string;
  profile: { terminalId: string; merchant: string; currency: string };
  pan?: string;
  exp?: string;             // YYMM
  icc?: string;             // TLV hex (DE55)
}

export function sale0200Fields(input: SaleFieldsInput): FieldMap {
  const em = { CHIP: "05", CTLS: "07", BANDA: "02" }[input.entryMode.toUpperCase()] ?? input.entryMode;
  const de22 = em.length === 2 ? `0${em}` : em; // DE22 wire = n3
  const amountCents = String(Math.round(input.amount * 100)).padStart(12, "0");
  const fields: FieldMap = {
    DE2: input.pan ?? "4040310011384895",
    DE3: "000000",
    DE4: amountCents,
    DE7: DE7_NOW, DE11: input.stanStr, DE12: DE12_NOW, DE13: DE13_NOW,
    DE22: de22, DE25: "00",
    DE37: `${input.stanStr}${DE13_NOW}`,
    DE41: de41(input.profile.terminalId),
    DE42: input.profile.merchant.slice(0, 15),
    DE49: input.profile.currency === "USD" ? "840" : "484",
    DE64: "DEADBEEF01234567",
  };
  if (input.exp) fields.DE14 = input.exp;
  if (input.pan && input.exp) fields.DE35 = `${input.pan}D${input.exp}00000000000`;
  if (input.icc) fields.DE55 = input.icc;
  return fields;
}

export function response0210Fields(advice: { stan: string; responseCode: string }, authCode?: string): FieldMap {
  return { DE7: DE7_NOW, DE11: advice.stan, DE12: DE12_NOW, DE13: DE13_NOW, DE37: `${advice.stan}${DE13_NOW}`, DE38: authCode ?? "", DE39: advice.responseCode };
}

export function reversal0400Fields(original: { stan: string }, reason = "TIMEOUT"): FieldMap {
  return { DE7: DE7_NOW, DE11: original.stan, DE12: DE12_NOW, DE25: "00", DE60: `REVERSAL ${reason}` };
}

export function batch0420Fields(item: { ref: string; total: number; entryMode: string; stan: string }, profile: { terminalId: string; currency: string }): FieldMap {
  return {
    DE3: "000000",
    DE4: String(Math.round(item.total * 100)).padStart(12, "0"),
    DE7: DE7_NOW, DE11: item.stan, DE12: DE12_NOW, DE13: DE13_NOW,
    DE22: ((): string => {
      const em = ({ CHIP: "05", CTLS: "07", BANDA: "02" } as Record<string, string>)[item.entryMode.toUpperCase()] ?? item.entryMode;
      return em.length === 2 ? `0${em}` : em;
    })(),
    DE25: "00",
    DE37: `${item.stan}${DE13_NOW}`,
    DE41: de41(profile.terminalId),
    DE49: profile.currency === "USD" ? "840" : "484",
    DE60: `BATCH ITEM ${item.ref}`,
  };
}
