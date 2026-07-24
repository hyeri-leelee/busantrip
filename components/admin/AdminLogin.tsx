"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "로그인 실패");
      router.refresh(); // 인증 통과 → 서버 컴포넌트 재렌더
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 380,
        margin: "0 auto",
        padding: "80px 20px",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>백오피스 로그인</h1>
      <p style={{ color: "#888", marginTop: 8, marginBottom: 20, fontSize: 13.5 }}>
        편집하려면 관리자 비밀번호를 입력하세요.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="password"
          autoFocus
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
            color: "#111",
          }}
        />
        <button
          type="submit"
          disabled={busy || !password}
          style={{
            padding: "10px 16px",
            border: "none",
            background: busy || !password ? "#9bbcf0" : "#4D96FF",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            cursor: busy || !password ? "default" : "pointer",
          }}
        >
          {busy ? "확인 중…" : "로그인"}
        </button>
        {error && <div style={{ color: "#e03131", fontSize: 13 }}>{error}</div>}
      </form>
      <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "#4D96FF", fontSize: 13 }}>
        ← 여행 목록으로
      </Link>
    </main>
  );
}
