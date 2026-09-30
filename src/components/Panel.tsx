import type { ReactNode } from "react";

export function Panel({ title, desc, right, children, style }: {
  title: string; desc?: string; right?: ReactNode; children: ReactNode; style?: React.CSSProperties;
}) {
  return (
    <section className="card" style={style}>
      <div className="row-between">
        <div>
          <h3 className="card-title">{title}</h3>
          {desc && <p className="card-desc">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="f-label">{label}</label>
      {children}
    </div>
  );
}

export function Badge({ tone = "mut", children }: { tone?: "ok" | "warn" | "err" | "mut"; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="toast">
      <span className="ok-text">✓</span>
      <span>{text}</span>
    </div>
  );
}
