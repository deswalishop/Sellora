import { ReactNode } from "react";

/** Soft premium card (PRD section 5: white cards, subtle borders, soft shadows). */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
