import Link from "next/link";
import { canEdit, getAllTripSummaries } from "@/lib/trips";
import { isAuthenticated } from "@/lib/auth";
import NewTripForm from "@/components/admin/NewTripForm";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata = { title: "백오피스" };

export default async function AdminHome() {
  if (!canEdit()) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px", color: "#111" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>백오피스</h1>
        <p style={{ color: "#888", marginTop: 12, lineHeight: 1.6 }}>
          편집 저장소가 설정되지 않았습니다.
          <br />
          프로덕션에서 편집하려면 Vercel 환경변수에{" "}
          <code>ADMIN_PASSWORD</code>, <code>GITHUB_TOKEN</code>,{" "}
          <code>GITHUB_REPO</code> 를 설정하세요. 로컬에서는{" "}
          <code>npm run dev</code> 로 바로 편집할 수 있습니다.
        </p>
        <Link href="/" style={{ color: "#4D96FF" }}>
          ← 여행 목록으로
        </Link>
      </main>
    );
  }

  if (!(await isAuthenticated())) {
    return <AdminLogin />;
  }

  const trips = getAllTripSummaries();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", color: "#111" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>백오피스</h1>
        <Link href="/" style={{ color: "#4D96FF", fontSize: 14 }}>
          사이트 보기 →
        </Link>
      </div>
      <p style={{ color: "#888", marginTop: 6, marginBottom: 24, fontSize: 14 }}>
        저장하면 GitHub에 자동 커밋되고, 약 1~2분 뒤 배포에 반영됩니다.
        (로컬에서 편집한 경우엔 직접 git push)
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>새 여행 추가</h2>
        <NewTripForm />
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>여행 목록</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {trips.map((t) => (
            <Link
              key={t.slug}
              href={`/admin/${t.slug}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                border: "1px solid #eee",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  /{t.slug} · {t.dayCount}일
                </div>
              </div>
              <span style={{ color: "#4D96FF" }}>편집 →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
