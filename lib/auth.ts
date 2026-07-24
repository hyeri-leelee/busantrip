// 백오피스 비밀번호 인증 (서버 전용).
// - ADMIN_PASSWORD: 로그인 비밀번호 (필수, 서버 전용 환경변수)
// - ADMIN_SESSION_SECRET: 세션 쿠키 서명용 비밀키 (선택, 없으면 비밀번호로 대체)
// 로컬 개발 환경에서는 편의상 인증 없이 편집을 허용한다.
import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "bt_admin";
const isProd = process.env.NODE_ENV === "production";

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;

export function hasAdminPassword(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "local-dev-secret"
  );
}

// 세션 토큰: 비밀번호를 쿠키에 직접 담지 않고, 비밀키로 서명한 값을 사용한다.
function sessionToken(): string {
  return crypto
    .createHmac("sha256", secret())
    .update("admin-authenticated")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return safeEqual(input, pw);
}

export function buildSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: sessionToken(),
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  };
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isProd) return true; // 로컬 개발: 인증 없이 편집 가능
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c) return false;
  return safeEqual(c.value, sessionToken());
}
