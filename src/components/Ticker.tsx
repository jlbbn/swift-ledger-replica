const PAIRS: [string, string, "up" | "down"][] = [
  ["BTC/USD · Bitstamp", "$84,304.19", "up"],
  ["BTC/USD · Kraken", "$84,307.60", "down"],
  ["ETH/USD · Bitstamp", "$2,686.55", "up"],
  ["ETH/USD · Kraken", "$2,686.88", "down"],
  ["ADA/USD · Bitstamp", "$0.24552", "up"],
  ["ADA/USD · Kraken", "$0.24866", "up"],
  ["SOL/USD · Bitstamp", "$119.63", "down"],
  ["SOL/USD · Kraken", "$119.60", "up"],
  ["TRX/USD · Bitstamp", "$0.28410", "up"],
  ["TRX/USD · Kraken", "$0.28392", "down"],
  ["USDT/USD · Bitstamp", "$1.0001", "up"],
  ["BTC/USDT · Binance", "$84,319.00", "up"],
];

export default function Ticker() {
  const row = (key: string) => (
    <span key={key} className="row" style={{ gap: 26 }}>
      {PAIRS.map(([pair, price, dir], i) => (
        <span key={`${key}-${i}`}>
          <span style={{ color: "#71717a" }}>{pair}</span>{" "}
          <span className={dir}>{price}</span>{" "}
          <span className={dir}>{dir === "up" ? "▲" : "▼"}</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="ticker" aria-label="Precios públicos spot USD">
      <div className="ticker-inner">
        <span className="row" style={{ gap: 26, paddingRight: 26 }}>
          <span style={{ color: "#52525b" }}>PUBLIC SPOT · USD</span>
        </span>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
