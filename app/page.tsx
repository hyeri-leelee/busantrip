import Link from "next/link";
import { getAllTripSummaries } from "@/lib/trips";

function formatRange(start: string | null, end: string | null): string {
  if (!start) return "일정 미정";
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${Number(m)}.${Number(day)}`;
  };
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export default function Home() {
  const trips = getAllTripSummaries();

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "48px 20px",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>여행 목록</h1>
      <p style={{ color: "#888", marginBottom: 28 }}>
        여행지를 선택하면 일정과 지도를 볼 수 있습니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {trips.map((trip) => (
          <Link
            key={trip.slug}
            href={`/${trip.slug}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px",
              border: "1px solid #eee",
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{trip.title}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                {trip.dayCount > 0
                  ? `${trip.dayCount}일 · ${formatRange(trip.startDate, trip.endDate)}`
                  : "준비 중"}
              </div>
            </div>
            <span style={{ color: "#4D96FF", fontSize: 20 }}>→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
