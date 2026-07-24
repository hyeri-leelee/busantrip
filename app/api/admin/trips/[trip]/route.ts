import { NextResponse } from "next/server";
import { canEdit, deleteTrip, saveTrip, type Trip } from "@/lib/trips";
import { isAuthenticated } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ trip: string }> }
) {
  if (!canEdit()) {
    return NextResponse.json(
      { error: "편집 저장소가 설정되지 않았습니다." },
      { status: 403 }
    );
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { trip: slug } = await params;

  let body: { trip?: Trip };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.trip || typeof body.trip.title !== "string") {
    return NextResponse.json({ error: "trip 데이터가 없습니다." }, { status: 400 });
  }

  try {
    await saveTrip(slug, body.trip);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장에 실패했습니다." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ trip: string }> }
) {
  if (!canEdit()) {
    return NextResponse.json(
      { error: "편집 저장소가 설정되지 않았습니다." },
      { status: 403 }
    );
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { trip: slug } = await params;
  try {
    await deleteTrip(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제에 실패했습니다." },
      { status: 400 }
    );
  }
}
