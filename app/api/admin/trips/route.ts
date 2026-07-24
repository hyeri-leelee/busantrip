import { NextResponse } from "next/server";
import { canEdit, createTrip, type MapProvider } from "@/lib/trips";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!canEdit()) {
    return NextResponse.json(
      { error: "편집 저장소가 설정되지 않았습니다." },
      { status: 403 }
    );
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { slug?: string; title?: string; mapProvider?: MapProvider };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const title = (body.title ?? "").trim();
  const mapProvider: MapProvider = body.mapProvider === "google" ? "google" : "kakao";

  if (!slug || !title) {
    return NextResponse.json(
      { error: "slug와 제목을 입력하세요." },
      { status: 400 }
    );
  }

  try {
    await createTrip(slug, title, mapProvider);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "생성에 실패했습니다." },
      { status: 400 }
    );
  }
}
