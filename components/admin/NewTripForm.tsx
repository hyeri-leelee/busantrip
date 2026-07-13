"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MapProvider } from "@/lib/trips";

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
  color: "#111",
};

export default function NewTripForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [mapProvider, setMapProvider] = useState<MapProvider>("kakao");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, mapProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      router.push(`/admin/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        padding: 14,
        border: "1px solid #eee",
        borderRadius: 10,
      }}
    >
      <input
        style={{ ...inputStyle, width: 180 }}
        placeholder="slug (예: japan-okinawa)"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase())}
      />
      <input
        style={{ ...inputStyle, width: 180 }}
        placeholder="제목 (예: 오키나와 여행)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        style={inputStyle}
        value={mapProvider}
        onChange={(e) => setMapProvider(e.target.value as MapProvider)}
      >
        <option value="kakao">카카오맵 (국내)</option>
        <option value="google">구글맵 (해외)</option>
      </select>
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: busy ? "#9bbcf0" : "#4D96FF",
          color: "#fff",
          fontWeight: 700,
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? "생성 중…" : "추가"}
      </button>
      {error && (
        <div style={{ width: "100%", color: "#e03131", fontSize: 13 }}>{error}</div>
      )}
    </form>
  );
}
