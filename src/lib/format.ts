// Formato y tiempo compartidos de la consola.
export function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function nowMx(): string {
  return new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City", hour12: false });
}

export function randNum(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10).toString()).join("");
}
