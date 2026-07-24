"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Day, MapProvider, Place, Trip } from "@/lib/trips";
import { placeKind, type PlaceKind } from "@/lib/place";

const CATEGORIES = ["식사", "카페", "명소", "숙소", "이동"];

const input: React.CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #ddd",
  borderRadius: 7,
  fontSize: 13,
  color: "#111",
  width: "100%",
  boxSizing: "border-box",
};
const label: React.CSSProperties = { fontSize: 11, color: "#888", marginBottom: 3 };

function newId() {
  return `p${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export default function TripEditor({
  slug,
  initialTrip,
}: {
  slug: string;
  initialTrip: Trip;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [dayIdx, setDayIdx] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const day: Day | undefined = trip.days[dayIdx];

  function patchTrip(p: Partial<Trip>) {
    setTrip((t) => ({ ...t, ...p }));
  }

  function patchDay(idx: number, p: Partial<Day>) {
    setTrip((t) => ({
      ...t,
      days: t.days.map((d, i) => (i === idx ? { ...d, ...p } : d)),
    }));
  }

  function patchPlace(placeIdx: number, p: Partial<Place>) {
    setTrip((t) => ({
      ...t,
      days: t.days.map((d, i) =>
        i === dayIdx
          ? { ...d, places: d.places.map((pl, j) => (j === placeIdx ? { ...pl, ...p } : pl)) }
          : d
      ),
    }));
  }

  // 구분(확정/선택사항/후보지/팀 분기) 변경
  function setKind(placeIdx: number, kind: PlaceKind, current: Place) {
    if (kind === "optional") {
      patchPlace(placeIdx, {
        status: "optional",
        candidateGroup: undefined,
        team: undefined,
      });
    } else if (kind === "candidate") {
      patchPlace(placeIdx, {
        status: "confirmed",
        candidateGroup: current.candidateGroup || "후보",
        team: undefined,
      });
    } else if (kind === "team") {
      patchPlace(placeIdx, {
        status: "confirmed",
        candidateGroup: undefined,
        team: current.team || "팀",
      });
    } else {
      patchPlace(placeIdx, {
        status: "confirmed",
        candidateGroup: undefined,
        team: undefined,
      });
    }
  }

  function addDay() {
    const nextDayNum = trip.days.length
      ? Math.max(...trip.days.map((d) => d.day)) + 1
      : 1;
    const newDay: Day = { day: nextDayNum, date: "", label: "", places: [] };
    setTrip((t) => ({ ...t, days: [...t.days, newDay] }));
    setDayIdx(trip.days.length);
  }

  function deleteDay(idx: number) {
    if (!confirm("이 날의 일정을 삭제할까요?")) return;
    setTrip((t) => ({ ...t, days: t.days.filter((_, i) => i !== idx) }));
    setDayIdx((cur) => Math.max(0, cur >= idx ? cur - 1 : cur));
  }

  function addPlace() {
    const place: Place = {
      id: newId(),
      time: "",
      name: "",
      category: "명소",
      lat: null,
      lng: null,
      memo: "",
      showOnMap: true,
      image: null,
    };
    patchDay(dayIdx, { places: [...(day?.places ?? []), place] });
  }

  function deletePlace(placeIdx: number) {
    if (!day) return;
    patchDay(dayIdx, { places: day.places.filter((_, j) => j !== placeIdx) });
  }

  function movePlace(placeIdx: number, dir: -1 | 1) {
    if (!day) return;
    const target = placeIdx + dir;
    if (target < 0 || target >= day.places.length) return;
    const places = [...day.places];
    [places[placeIdx], places[target]] = [places[target], places[placeIdx]];
    patchDay(dayIdx, { places });
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/trips/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setStatus("저장되었습니다 ✓");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function removeTrip() {
    if (!confirm(`여행 "${trip.title}"(${slug})을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/trips/${slug}`, { method: "DELETE" });
    if (res.ok) router.push("/admin");
    else setStatus("삭제 실패");
  }

  const numField = (v: number | null) => (v == null ? "" : String(v));
  const parseNum = (s: string): number | null => {
    const t = s.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px 80px", color: "#111" }}>
      {/* 상단 바 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          padding: "10px 0",
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 8,
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <Link href="/admin" style={{ color: "#4D96FF", fontSize: 14 }}>
          ← 목록
        </Link>
        <span style={{ color: "#ccc" }}>/</span>
        <code style={{ fontSize: 13, color: "#888" }}>{slug}</code>
        <div style={{ flex: 1 }} />
        {status && (
          <span
            style={{
              fontSize: 13,
              color: status.includes("✓") ? "#2f9e44" : "#e03131",
            }}
          >
            {status}
          </span>
        )}
        <button
          onClick={removeTrip}
          style={{
            padding: "8px 12px",
            border: "1px solid #ffc9c9",
            background: "#fff",
            color: "#e03131",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          여행 삭제
        </button>
        <button
          onClick={save}
          disabled={busy}
          style={{
            padding: "8px 18px",
            border: "none",
            background: busy ? "#9bbcf0" : "#4D96FF",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>

      {/* 여행 기본 정보 */}
      <div style={{ display: "flex", gap: 12, margin: "20px 0", flexWrap: "wrap" }}>
        <div style={{ flex: "2 1 240px" }}>
          <div style={label}>제목</div>
          <input
            style={input}
            value={trip.title}
            onChange={(e) => patchTrip({ title: e.target.value })}
          />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <div style={label}>지도</div>
          <select
            style={input}
            value={trip.mapProvider}
            onChange={(e) => patchTrip({ mapProvider: e.target.value as MapProvider })}
          >
            <option value="kakao">카카오맵 (국내)</option>
            <option value="google">구글맵 (해외)</option>
          </select>
        </div>
      </div>

      {/* 날짜 탭 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {trip.days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDayIdx(i)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: i === dayIdx ? "#4D96FF" : "#fff",
              color: i === dayIdx ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Day {d.day}
            {d.date ? ` (${d.date.slice(5)})` : ""}
          </button>
        ))}
        <button
          onClick={addDay}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px dashed #4D96FF",
            background: "#fff",
            color: "#4D96FF",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          + 날짜 추가
        </button>
      </div>

      {!day ? (
        <p style={{ color: "#888" }}>날짜를 추가해 일정을 만들어 보세요.</p>
      ) : (
        <>
          {/* 날짜 정보 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: 90 }}>
              <div style={label}>Day</div>
              <input
                style={input}
                type="number"
                value={day.day}
                onChange={(e) => patchDay(dayIdx, { day: Number(e.target.value) || 1 })}
              />
            </div>
            <div style={{ width: 170 }}>
              <div style={label}>날짜 (YYYY-MM-DD)</div>
              <input
                style={input}
                placeholder="2026-08-01"
                value={day.date}
                onChange={(e) => patchDay(dayIdx, { date: e.target.value })}
              />
            </div>
            <div style={{ width: 80 }}>
              <div style={label}>요일</div>
              <input
                style={input}
                placeholder="토"
                value={day.label}
                onChange={(e) => patchDay(dayIdx, { label: e.target.value })}
              />
            </div>
            <button
              onClick={() => deleteDay(dayIdx)}
              style={{
                padding: "7px 12px",
                border: "1px solid #ffc9c9",
                background: "#fff",
                color: "#e03131",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              이 날 삭제
            </button>
          </div>

          {/* 장소 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {day.places.map((place, j) => (
              <div
                key={place.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#888", fontSize: 13 }}>
                    #{j + 1}
                  </span>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#555",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={place.showOnMap}
                      onChange={(e) => patchPlace(j, { showOnMap: e.target.checked })}
                    />
                    지도에 표시
                  </label>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => movePlace(j, -1)}
                    disabled={j === 0}
                    style={miniBtn(j === 0)}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => movePlace(j, 1)}
                    disabled={j === day.places.length - 1}
                    style={miniBtn(j === day.places.length - 1)}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deletePlace(j)}
                    style={{ ...miniBtn(false), color: "#e03131", borderColor: "#ffc9c9" }}
                  >
                    삭제
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: "2 1 200px" }}>
                    <div style={label}>이름</div>
                    <input
                      style={input}
                      value={place.name}
                      onChange={(e) => patchPlace(j, { name: e.target.value })}
                    />
                  </div>
                  <div style={{ width: 110 }}>
                    <div style={label}>분류</div>
                    <select
                      style={input}
                      value={place.category}
                      onChange={(e) => patchPlace(j, { category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 90 }}>
                    <div style={label}>시간</div>
                    <input
                      style={input}
                      placeholder="14:00"
                      value={place.time}
                      onChange={(e) => patchPlace(j, { time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <div style={{ width: 140 }}>
                    <div style={label}>위도 (lat)</div>
                    <input
                      style={input}
                      placeholder="35.1533"
                      value={numField(place.lat)}
                      onChange={(e) => patchPlace(j, { lat: parseNum(e.target.value) })}
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={label}>경도 (lng)</div>
                    <input
                      style={input}
                      placeholder="129.1186"
                      value={numField(place.lng)}
                      onChange={(e) => patchPlace(j, { lng: parseNum(e.target.value) })}
                    />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={label}>이미지 URL</div>
                    <input
                      style={input}
                      placeholder="https://…"
                      value={place.image ?? ""}
                      onChange={(e) =>
                        patchPlace(j, { image: e.target.value.trim() || null })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <div style={{ width: 140 }}>
                    <div style={label}>구분</div>
                    <select
                      style={input}
                      value={placeKind(place)}
                      onChange={(e) =>
                        setKind(j, e.target.value as PlaceKind, place)
                      }
                    >
                      <option value="confirmed">확정</option>
                      <option value="optional">선택사항</option>
                      <option value="candidate">후보지</option>
                      <option value="team">팀 분기</option>
                    </select>
                  </div>
                  {placeKind(place) === "candidate" && (
                    <div style={{ flex: "1 1 220px" }}>
                      <div style={label}>후보 그룹명 (같은 이름끼리 묶임)</div>
                      <input
                        style={input}
                        placeholder="예: 저녁 식사"
                        value={place.candidateGroup ?? ""}
                        onChange={(e) =>
                          patchPlace(j, { candidateGroup: e.target.value })
                        }
                      />
                    </div>
                  )}
                  {placeKind(place) === "team" && (
                    <div style={{ flex: "1 1 220px" }}>
                      <div style={label}>팀명 (연속 배치 시 나란히 묶임)</div>
                      <input
                        style={input}
                        placeholder="예: 혜리 / 상민·유안"
                        value={place.team ?? ""}
                        onChange={(e) => patchPlace(j, { team: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={label}>내용 / 메모</div>
                  <textarea
                    style={{ ...input, minHeight: 54, resize: "vertical" }}
                    value={place.memo}
                    onChange={(e) => patchPlace(j, { memo: e.target.value })}
                  />
                </div>

                {place.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={place.image}
                    alt={place.name}
                    style={{
                      marginTop: 8,
                      maxWidth: 120,
                      borderRadius: 8,
                      display: "block",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addPlace}
            style={{
              marginTop: 14,
              padding: "10px 16px",
              border: "1px dashed #4D96FF",
              background: "#fff",
              color: "#4D96FF",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
            }}
          >
            + 장소 추가
          </button>
        </>
      )}
    </main>
  );
}

function miniBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "4px 9px",
    border: "1px solid #ddd",
    background: "#fff",
    color: disabled ? "#ccc" : "#555",
    borderRadius: 6,
    cursor: disabled ? "default" : "pointer",
    fontSize: 12,
  };
}
