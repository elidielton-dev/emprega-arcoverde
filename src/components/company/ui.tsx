import type { ReactNode } from "react";

/** Tokens do painel empresa — marca Emprega Arcoverde; cantos ~6px (mockup). */
export const EA = {
  ink: "#1C1410",
  inkSoft: "#2E221F",
  orange: "#E65100",
  orangeHover: "#D84315",
  orangeSoft: "#FFF4EA",
  surface: "#F4F5F7",
  card: "#FFFFFF",
  border: "#E6E8EB",
  muted: "#78716c",
  textBody: "#57433C",
  radius: "rounded-md", // ~6px
} as const;

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-[26px] font-black leading-tight tracking-tight text-[#1C1410]">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-[#78716c]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function FunnelCard({
  label,
  count,
  hint,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number | string;
  hint?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = `min-h-[88px] w-full rounded-md border px-4 py-3.5 text-left transition ${
    active
      ? "border-[#E65100] bg-[#FFF4EA] shadow-[0_1px_2px_rgba(230,81,0,0.1)]"
      : "border-[#E6E8EB] bg-white hover:border-[#E65100]/30"
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-[#78716c]">{label}</p>
        {icon ? <span className="text-[#E65100]">{icon}</span> : null}
      </div>
      <p className="mt-2 text-[28px] font-black leading-none tracking-tight text-[#1C1410]">{count}</p>
      {hint ? <p className="mt-1.5 text-[11px] text-[#78716c]">{hint}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-[#E6E8EB] bg-white shadow-[0_1px_2px_rgba(28,20,16,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warn" | "info" | "danger" | "orange";
}) {
  const map = {
    neutral: "bg-[#F4F5F7] text-[#57433C]",
    success: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    info: "bg-blue-50 text-blue-800",
    danger: "bg-red-50 text-red-700",
    orange: "bg-[#FFF4EA] text-[#BF360C]",
  } as const;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${map[tone]}`}>{label}</span>
  );
}

export function PrimaryButton({
  children,
  href,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315] ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-md border border-[#E6E8EB] bg-white px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7] ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return <span className={cls}>{children}</span>;
}
