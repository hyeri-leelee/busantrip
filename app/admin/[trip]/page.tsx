import Link from "next/link";
import { notFound } from "next/navigation";
import { canEdit, getTrip } from "@/lib/trips";
import { isAuthenticated } from "@/lib/auth";
import TripEditor from "@/components/admin/TripEditor";
import AdminLogin from "@/components/admin/AdminLogin";

export default async function AdminTripPage({
  params,
}: {
  params: Promise<{ trip: string }>;
}) {
  const { trip: slug } = await params;

  if (!canEdit()) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ color: "#888" }}>편집 저장소가 설정되지 않았습니다.</p>
        <Link href="/admin" style={{ color: "#4D96FF" }}>
          ← 백오피스
        </Link>
      </main>
    );
  }

  if (!(await isAuthenticated())) {
    return <AdminLogin />;
  }

  const trip = getTrip(slug);
  if (!trip) notFound();

  return <TripEditor slug={slug} initialTrip={trip} />;
}
