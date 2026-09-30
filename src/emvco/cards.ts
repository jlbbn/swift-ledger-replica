// ─── Tarjetas de prueba EMV (perfiles del laboratorio L3) ────────────────────
// Perfiles de "test cards" de laboratorio: PAN de prueba, AID, CVM y datos
// criptográficos de prueba (ARQC/TVR). El ARQC se valida contra el monto en el
// caso L3-02/L3-11; las tarjetas "fallback" simulan lectura de banda.

import { buildTLV } from "./iso8583.ts";

export interface EmvTestCard {
  id: string;
  label: string;
  brand: "VISA" | "MASTERCARD";
  pan: string;
  exp: string;      // YYMM
  aid: string;
  name: string;
  cvm: string;
  arqc: string;     // 8 bytes hex
  tvr: string;      // 5 bytes hex
  iad: string;
  fallbackBehavior?: "CHIP_FIRST" | "MAG_ONLY";
}

export const TEST_CARDS: EmvTestCard[] = [
  {
    id: "VISA-GOOD",
    label: "VISA · Aprobada (chip + PIN offline OK)",
    brand: "VISA",
    pan: "4761739001010010",
    exp: "2712",
    aid: "A0000000031010",
    name: "CERT HOLDER/GOOD",
    cvm: "4403021E03", // offline plaintext PIN
    arqc: "A1B2C3D4E5F60718",
    tvr: "0000008000", // ICC y PIN verificados
    iad: "06011203A0B800",
  },
  {
    id: "MC-FALLBACK",
    label: "Mastercard · Intenta fallback a banda",
    brand: "MASTERCARD",
    pan: "5413330089010010",
    exp: "2801",
    aid: "A0000000041010",
    name: "CERT HOLDER/FALLBK",
    cvm: "1E03000000000000",
    arqc: "0011223344556677",
    tvr: "0000008000",
    iad: "06010A03A00000",
    fallbackBehavior: "CHIP_FIRST",
  },
  {
    id: "VISA-PINFAIL",
    label: "VISA · PIN offline falla (declina CVM)",
    brand: "VISA",
    pan: "4761739001010093",
    exp: "2605",
    aid: "A0000000031010",
    name: "CERT HOLDER/PINFL",
    cvm: "4403021E03",
    arqc: "FFEE0DDBCA981122",
    tvr: "0000408000", // CVM fallido
    iad: "06011203A0B800",
  },
];

export function iccDataTLV(card: EmvTestCard, amountCents: number): string {
  return [
    buildTLV("9F02", String(amountCents).padStart(12, "0")),
    buildTLV("9F03", "000000000000"),
    buildTLV("9F26", card.arqc),
    buildTLV("9F27", "80"),
    buildTLV("9F36", "01FC"),
    buildTLV("95", card.tvr),
    buildTLV("9A", "260930"),
    buildTLV("9C", "00"),
    buildTLV("5F2A", "0484"),
    buildTLV("82", "3800"),
    buildTLV("9F10", card.iad),
    buildTLV("9F1A", "0484"),
    buildTLV("4F", card.aid),
    buildTLV("5A", card.pan),
  ].join("");
}
