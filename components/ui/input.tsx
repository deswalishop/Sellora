import { InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labeled input with inline error display. */
export function Input({ label, error, hint, id, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? (typeof rest.name === "string" ? rest.name : undefined) ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-ink placeholder:text-muted/60 transition focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-slate-200 focus:border-brand-light focus:ring-brand-light/30"
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
