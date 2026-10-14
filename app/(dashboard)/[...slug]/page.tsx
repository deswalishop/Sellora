import Link from "next/link";
import { Card } from "@/components/ui/card";

/** Placeholder for dashboard sections that land in later milestones. */
export default async function ComingSoon({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const label = slug[0]?.charAt(0).toUpperCase() + slug[0]?.slice(1) || "Section";
  return (
    <Card className="text-center">
      <h1 className="text-xl font-bold text-ink">{label}</h1>
      <p className="mt-2 text-sm text-muted">
        This section is coming in the next milestone. Products are ready now:
      </p>
      <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline">
        Go to Products →
      </Link>
    </Card>
  );
}
