/** Centered auth layout — brand header above the card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-emerald-950">Sellora</p>
          <p className="mt-1 text-sm text-muted">Sell Simply. Grow Everywhere.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
