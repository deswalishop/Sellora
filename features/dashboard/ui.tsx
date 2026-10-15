import type { ReactNode } from "react";

/** Shopify-admin-style page header: title + primary actions right. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White card with subtle border (Polaris style). */
export function Card({
  children,
  className = "",
  title,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
          {title && <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const BADGE_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  attention: "bg-yellow-100 text-yellow-800",
  warning: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-neutral-100 text-neutral-700",
};

/** Polaris-style status badge. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof BADGE_STYLES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Primary (black) and secondary buttons. */
export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-500 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** Simple data table (Polaris IndexTable feel). */
export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/60 text-left">
            {headers.map((h) => (
              <th key={h} className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[15px] font-medium text-neutral-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
    </div>
  );
}
