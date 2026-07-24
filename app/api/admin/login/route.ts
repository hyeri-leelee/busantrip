import { NextResponse } from "next/server";
import { verifyPassword, buildSessionCookie, ADMIN_SESSION_COOKIE } from "@/lib/auth";

// 비밀번호 로그인 → 세션 쿠키 발급
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const password = (body.password ?? "").toString();
  if (!verifyPassword(password)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const c = buildSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, {
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
    path: c.path,
    maxAge: c.maxAge,
  });
  return res;
}

// 로그아웃 → 세션 쿠키 삭제
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
