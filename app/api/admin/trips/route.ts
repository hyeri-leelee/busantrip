import { NextResponse } from "next/server";
import { canEdit, createTrip, type MapProvider } from "@/lib/trips";

export async function POST(request: Request) {
  if (!canEdit()) {
    return NextResponse.json(
      { error: "편집은 로컬 개발 환경에서만 가능합니다." },
      { status: 403 }
    );
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
    createTrip(slug, title, mapProvider);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "생성에 실패했습니다." },
      { status: 400 }
    );
  }
}
