import Link from "next/link";
import { notFound } from "next/navigation";
import { canEdit, getTrip } from "@/lib/trips";
import TripEditor from "@/components/admin/TripEditor";

export default async function AdminTripPage({
  params,
}: {
  params: Promise<{ trip: string }>;
}) {
  const { trip: slug } = await params;

  if (!canEdit()) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ color: "#888" }}>편집은 로컬 개발 환경에서만 가능합니다.</p>
        <Link href="/admin" style={{ color: "#4D96FF" }}>
          ← 백오피스
        </Link>
      </main>
    );
  }

  const trip = getTrip(slug);
  if (!trip) notFound();

  return <TripEditor slug={slug} initialTrip={trip} />;
}
