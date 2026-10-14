import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

/** Sellora Button — primary is deep emerald (PRD section 5). */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex w-full items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-light/50 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-emerald-950 text-white hover:bg-emerald-950/90 shadow-[0_4px_14px_rgba(6,95,70,0.25)]",
    secondary:
      "bg-white text-ink border border-slate-200 hover:border-emerald-950/30 hover:bg-canvas shadow-sm",
    ghost: "text-muted hover:text-ink hover:bg-slate-100",
  } as const;
  const sizes = { md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-[15px]" } as const;

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
