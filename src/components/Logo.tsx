export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#f43f5e" d="M12 1.2 14.7 9.3 22.8 12 14.7 14.7 12 22.8 9.3 14.7 1.2 12 9.3 9.3Z" />
        <path fill="#fb7185" d="M12 6.4 13.1 10.9 17.6 12 13.1 13.1 12 17.6 10.9 13.1 6.4 12 10.9 10.9Z" opacity="0.85" />
      </svg>
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontWeight: 800, fontSize: size * 0.52, letterSpacing: "-0.01em", color: "#f43f5e" }}>SWIFT</div>
        <div style={{ fontWeight: 800, fontSize: size * 0.52, letterSpacing: "-0.01em", color: "#f43f5e" }}>LEDGER</div>
      </div>
    </div>
  );
}
