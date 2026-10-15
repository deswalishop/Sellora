import { ReactNode } from "react";

/** Shopify-style card: white, subtle border. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
