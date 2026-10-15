import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

/** Shopify-style Button — solid black primary. */
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
    "inline-flex w-full items-center justify-center font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-700",
    secondary:
      "bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-500",
    ghost: "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
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
