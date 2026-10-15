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
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-neutral-700">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition focus:outline-none ${
          error ? "border-red-500" : "border-neutral-400 focus:border-neutral-900"
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}
