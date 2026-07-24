"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import KakaoMap from "@/components/KakaoMap";
import GoogleMap from "@/components/GoogleMap";
import { getDistanceKm, estimateDriveMinutes } from "@/lib/geo";
import { dayColor } from "@/lib/colors";
import { placeKind } from "@/lib/place";
import type { Trip, Day, Place } from "@/lib/trips";

// "2026-07-10" -> "7/10"
function shortDate(date: string): string {
  const parts = date.split("-");
  if (parts.length < 3) return date;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

// 날짜별 제목: 데이터에 없으면 첫 장소명으로 대체
function dayTitle(day: Day): string {
  return day.title || day.places[0]?.name || `${day.day}일차`;
}

// 날짜별 한 줄 설명: 데이터에 없으면 장소명을 이어 만든다
function daySummary(day: Day): string {
  if (day.summary) return day.summary;
  const names = day.places.map((p) => p.name).filter(Boolean);
  return names.join(" · ");
}

export default function TripView({ trip }: { trip: Trip }) {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const dates = trip.days.map((d) => d.date).filter(Boolean).sort();
  const rangeLabel =
    dates.length > 0
      ? `${shortDate(dates[0])} — ${shortDate(dates[dates.length - 1])}`
      : "";
  const nights = Math.max(0, trip.days.length - 1);
  const durationLabel =
    trip.days.length > 0 ? `${nights}박 ${trip.days.length}일` : "";
  const subtitle =
    trip.subtitle || trip.days.map(dayTitle).join(" → ");

  function selectDay(d: number | "all") {
    setSelectedDay((prev) => (prev === d ? "all" : d));
    setSelectedPlaceId(null);
  }

  // 장소 선택(리스트 카드 클릭 또는 지도 마커 클릭 공통):
  // 해당 장소가 속한 날짜를 펼치고, 그 장소를 활성화한다.
  const handleSelectPlace = useCallback(
    (placeId: string) => {
      const day = trip.days.find((d) => d.places.some((p) => p.id === placeId));
      if (day) setSelectedDay(day.day);
      setSelectedPlaceId(placeId);
    },
    [trip.days]
  );

  return (
    <div className="trip-container">
      <aside className="trip-sidebar">
        <div style={{ padding: "22px 22px 44px" }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            ← 여행 목록
          </Link>

          {/* ── 헤더 ── */}
          <div
            style={{
              marginTop: 16,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--accent)",
              textTransform: "uppercase",
            }}
          >
            {[rangeLabel, durationLabel].filter(Boolean).join(" · ")}
          </div>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.2,
              color: "var(--ink)",
            }}
          >
            {trip.title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--ink-soft)",
              }}
            >
              {subtitle}
            </p>
          )}

          {trip.days.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 28 }}>
              아직 등록된 일정이 없습니다.
            </p>
          ) : (
            <>
              {/* ── 전체 / Day 칩 ── */}
              <div className="day-chips" style={{ margin: "22px 0 6px" }}>
                <Chip
                  active={selectedDay === "all"}
                  onClick={() => selectDay("all")}
                  title="전체"
                  sub="All"
                  color="var(--ink)"
                />
                {trip.days.map((d) => (
                  <Chip
                    key={d.day}
                    active={selectedDay === d.day}
                    onClick={() => selectDay(d.day)}
                    title={`Day ${d.day}`}
                    sub={`${shortDate(d.date)} ${d.label}`}
                    color={dayColor(d.day)}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                날짜를 선택하면 해당 구간만 지도에 표시됩니다
              </div>

              {/* ── 날짜 요약 리스트 ── */}
              <div style={{ marginTop: 6 }}>
                {trip.days.map((d) => (
                  <DayRow
                    key={d.day}
                    day={d}
                    selected={selectedDay === d.day}
                    selectedPlaceId={selectedPlaceId}
                    onSelectDay={() => selectDay(d.day)}
                    onSelectPlace={handleSelectPlace}
                  />
                ))}
              </div>

              {/* ── 푸터 ── */}
              <p
                style={{
                  marginTop: 28,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "var(--muted)",
                }}
              >
                각 여행 일정은{" "}
                <code
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10.5,
                    color: "var(--ink-soft)",
                  }}
                >
                  data/trips
                </code>{" "}
                의 JSON 파일로 관리되며, 편집하면 지도와 사이드바가 자동 갱신됩니다.
              </p>
            </>
          )}
        </div>
      </aside>

      <main className="trip-map">
        {trip.mapProvider === "google" ? (
          <GoogleMap
            days={trip.days}
            selectedDay={selectedDay}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
          />
        ) : (
          <KakaoMap
            days={trip.days}
            selectedDay={selectedDay}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
          />
        )}
      </main>
    </div>
  );
}

/* ── 전체/Day 칩 ── */
function Chip({
  active,
  onClick,
  title,
  sub,
  color,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        minWidth: 58,
        padding: "8px 12px",
        borderRadius: 12,
        border: `1px solid ${active ? color : "var(--chip-border)"}`,
        background: active ? color : "transparent",
        color: active ? "#fff" : "var(--ink)",
        cursor: "pointer",
        lineHeight: 1.15,
        transition: "background .15s, border-color .15s",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      <span
        style={{
          fontSize: 10.5,
          color: active ? "rgba(255,255,255,0.8)" : "var(--muted)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

/* ── 날짜 요약 행 (+ 선택 시 장소 카드 펼침) ── */
function DayRow({
  day,
  selected,
  selectedPlaceId,
  onSelectDay,
  onSelectPlace,
}: {
  day: Day;
  selected: boolean;
  selectedPlaceId: string | null;
  onSelectDay: () => void;
  onSelectPlace: (id: string) => void;
}) {
  const color = dayColor(day.day);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        background: selected ? "rgba(176,86,60,0.06)" : "transparent",
        borderLeft: `3px solid ${selected ? color : "transparent"}`,
        marginLeft: -22,
        marginRight: -22,
        paddingLeft: 19,
        paddingRight: 22,
      }}
    >
      <div
        className="day-row"
        onClick={onSelectDay}
        style={{
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          padding: "15px 0",
        }}
      >
        {/* 좌: DAY N + 날짜 */}
        <div style={{ flexShrink: 0, width: 48 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              color,
            }}
          >
            DAY {day.day}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {shortDate(day.date)} {day.label}
          </div>
        </div>

        {/* 중: 제목 + 설명 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.3,
            }}
          >
            {dayTitle(day)}
          </div>
          {daySummary(day) && (
            <div
              className="clamp-2"
              style={{
                fontSize: 12.5,
                color: "var(--ink-soft)",
                lineHeight: 1.45,
                marginTop: 3,
              }}
            >
              {daySummary(day)}
            </div>
          )}
        </div>

        {/* 우: 장소 개수 */}
        <div
          style={{
            flexShrink: 0,
            fontSize: 13,
            color: "var(--muted)",
            paddingTop: 1,
          }}
        >
          {day.places.length}
        </div>
      </div>

      {selected && (
        <PlaceCards
          day={day}
          color={color}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={onSelectPlace}
        />
      )}
    </div>
  );
}

/* ── 선택된 날짜의 장소 카드 목록 ──
   확정: 순번 카드 / 선택사항: 점선 카드 / 후보지: 그룹 박스 로 구분해 렌더한다. */
function PlaceCards({
  day,
  color,
  selectedPlaceId,
  onSelectPlace,
}: {
  day: Day;
  color: string;
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
}) {
  // 순번·이동 거리/시간은 "확정" 장소만 대상으로 계산한다(선택사항·후보지는 제외).
  const orderByPlaceId: Record<string, number> = {};
  const travelByPlaceId: Record<string, { km: number; min: number }> = {};
  let order = 0;
  let last: { lat: number; lng: number } | null = null;
  day.places.forEach((place) => {
    if (placeKind(place) !== "confirmed") return;
    if (place.showOnMap && place.lat != null && place.lng != null) {
      orderByPlaceId[place.id] = ++order;
      if (last) {
        const km = getDistanceKm(last.lat, last.lng, place.lat, place.lng);
        travelByPlaceId[place.id] = { km, min: estimateDriveMinutes(km) };
      }
      last = { lat: place.lat, lng: place.lng };
    }
  });

  // 후보지는 같은 그룹(연속)끼리, 팀 분기는 연속된 team 항목끼리 하나의 박스로 묶는다.
  type Item =
    | { type: "place"; place: Place }
    | { type: "group"; group: string; places: Place[] }
    | { type: "teamBranch"; places: Place[] };
  const items: Item[] = [];
  for (let i = 0; i < day.places.length; i++) {
    const place = day.places[i];
    if (placeKind(place) === "candidate") {
      const group = place.candidateGroup!.trim();
      const groupPlaces: Place[] = [];
      while (
        i < day.places.length &&
        placeKind(day.places[i]) === "candidate" &&
        day.places[i].candidateGroup!.trim() === group
      ) {
        groupPlaces.push(day.places[i]);
        i++;
      }
      i--; // for 루프가 다시 ++하므로 보정
      items.push({ type: "group", group, places: groupPlaces });
    } else if (placeKind(place) === "team") {
      const teamPlaces: Place[] = [];
      while (i < day.places.length && placeKind(day.places[i]) === "team") {
        teamPlaces.push(day.places[i]);
        i++;
      }
      i--; // for 루프가 다시 ++하므로 보정
      items.push({ type: "teamBranch", places: teamPlaces });
    } else {
      items.push({ type: "place", place });
    }
  }

  return (
    <div style={{ padding: "2px 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, idx) => {
        if (item.type === "group") {
          return (
            <CandidateGroupCard
              key={`g-${idx}`}
              label={item.group}
              places={item.places}
              color={color}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          );
        }
        if (item.type === "teamBranch") {
          return (
            <TeamBranchCard
              key={`t-${idx}`}
              places={item.places}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          );
        }
        const place = item.place;
        if (placeKind(place) === "optional") {
          return (
            <OptionalCard
              key={place.id}
              place={place}
              color={color}
              active={selectedPlaceId === place.id}
              onSelectPlace={onSelectPlace}
            />
          );
        }
        return (
          <ConfirmedCard
            key={place.id}
            place={place}
            color={color}
            num={orderByPlaceId[place.id]}
            travel={travelByPlaceId[place.id]}
            active={selectedPlaceId === place.id}
            onSelectPlace={onSelectPlace}
          />
        );
      })}
    </div>
  );
}

// 활성화되면 해당 요소를 사이드바 안에서 보이도록 스크롤한다(지도 마커 클릭 시 유용).
function useActiveScroll(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active]);
  return ref;
}

// 카테고리별 아이콘(후보지 그룹 헤더 등)
function categoryIcon(category?: string): string {
  switch (category) {
    case "식사":
      return "🍽";
    case "카페":
      return "☕";
    case "숙소":
      return "🏨";
    case "이동":
      return "🚗";
    default:
      return "📍";
  }
}

/* ── 확정 장소 카드 (기존 스타일 + 이동시간) ── */
function ConfirmedCard({
  place,
  color,
  num,
  travel,
  active,
  onSelectPlace,
}: {
  place: Place;
  color: string;
  num?: number;
  travel?: { km: number; min: number };
  active: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const clickable = place.showOnMap && place.lat != null && place.lng != null;
  const ref = useActiveScroll(active);
  return (
    <div>
      {travel && (
        <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 8px 8px" }}>
          🚗 약 {travel.min}분 이동 (직선 {travel.km.toFixed(1)}km · 근사치)
        </div>
      )}
      <div
        ref={ref}
        onClick={() => clickable && onSelectPlace(place.id)}
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          background: "var(--card)",
          border: `1px solid ${active ? color : "var(--border)"}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 10,
          boxShadow: active ? `0 0 0 1px ${color}33` : "none",
          cursor: clickable ? "pointer" : "default",
          transition: "border-color .15s, box-shadow .15s",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {num != null && (
              <span
                style={{
                  flexShrink: 0,
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  background: color,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {num}
              </span>
            )}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.03em",
                color: "var(--muted)",
              }}
            >
              {place.category}
            </span>
            {place.time && (
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{place.time}</span>
            )}
          </div>
          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14.5, lineHeight: 1.3 }}>
            {place.name}
          </div>
          {place.memo && (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-soft)",
                marginTop: 4,
                lineHeight: 1.45,
                whiteSpace: "pre-line",
              }}
            >
              {place.memo}
            </div>
          )}
        </div>
        {place.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.image}
            alt={place.name}
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
          />
        )}
      </div>
    </div>
  );
}

/* ── 선택사항 카드 (점선·반투명, 순번 없음, "선택" 뱃지) ── */
function OptionalCard({
  place,
  color,
  active,
  onSelectPlace,
}: {
  place: Place;
  color: string;
  active: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const clickable = place.showOnMap && place.lat != null && place.lng != null;
  const ref = useActiveScroll(active);
  return (
    <div
      ref={ref}
      onClick={() => clickable && onSelectPlace(place.id)}
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        background: "transparent",
        border: `1px dashed ${active ? color : "var(--border)"}`,
        borderLeft: `3px dashed ${color}`,
        borderRadius: 10,
        opacity: 0.95,
        cursor: clickable ? "pointer" : "default",
        transition: "border-color .15s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span
            style={{
              flexShrink: 0,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color,
              border: `1px dashed ${color}`,
              borderRadius: 999,
              padding: "1px 7px",
              background: `${color}12`,
            }}
          >
            선택
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "var(--muted)",
            }}
          >
            {place.category}
          </span>
          {place.time && (
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{place.time}</span>
          )}
        </div>
        <div style={{ fontWeight: 700, color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.3 }}>
          {place.name}
        </div>
        {place.memo && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--muted)",
              marginTop: 4,
              lineHeight: 1.45,
              whiteSpace: "pre-line",
            }}
          >
            {place.memo}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 후보지 그룹 박스 (택1 후보들을 묶어 표시, 선택 인터랙션은 없음) ── */
function CandidateGroupCard({
  label,
  places,
  color,
  selectedPlaceId,
  onSelectPlace,
}: {
  label: string;
  places: Place[];
  color: string;
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
}) {
  const icon = categoryIcon(places[0]?.category);
  const time = places.find((p) => p.time)?.time;
  return (
    <div
      style={{
        border: `1px solid ${color}55`,
        background: `${color}0F`,
        borderRadius: 12,
        padding: "11px 12px 12px",
      }}
    >
      {/* 그룹 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
        {time && <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{time}</span>}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 700,
            color,
            border: `1px solid ${color}66`,
            borderRadius: 999,
            padding: "1px 8px",
            background: "var(--card)",
          }}
        >
          후보 {places.length}곳
        </span>
      </div>

      {/* 후보 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {places.map((place) => (
          <CandidateRow
            key={place.id}
            place={place}
            color={color}
            active={selectedPlaceId === place.id}
            onSelectPlace={onSelectPlace}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateRow({
  place,
  color,
  active,
  onSelectPlace,
}: {
  place: Place;
  color: string;
  active: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const clickable = place.showOnMap && place.lat != null && place.lng != null;
  const ref = useActiveScroll(active);
  return (
    <div
      ref={ref}
      onClick={() => clickable && onSelectPlace(place.id)}
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 10px",
        background: "var(--card)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        borderRadius: 8,
        boxShadow: active ? `0 0 0 1px ${color}33` : "none",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color .15s, box-shadow .15s",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 5,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13.5, lineHeight: 1.3 }}>
          {place.name}
        </div>
        {place.memo && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              marginTop: 2,
              lineHeight: 1.4,
              whiteSpace: "pre-line",
            }}
          >
            {place.memo}
          </div>
        )}
      </div>
    </div>
  );
}

// 팀 분기 트랙 색상 (day 색·후보지 톤과 구분되도록 별도 팔레트)
const TEAM_COLORS = ["#3F8E8C", "#8E5A6E", "#C79A3A", "#4E7A9E"];

/* ── 팀 분기 박스 (팀이 나뉘어 동시에 각자 진행 — 나란한 트랙으로 표시) ── */
function TeamBranchCard({
  places,
  selectedPlaceId,
  onSelectPlace,
}: {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
}) {
  // 팀별로 묶는다(등장 순서 유지)
  const order: string[] = [];
  const byTeam: Record<string, Place[]> = {};
  places.forEach((p) => {
    const t = (p.team ?? "").trim() || "팀";
    if (!byTeam[t]) {
      byTeam[t] = [];
      order.push(t);
    }
    byTeam[t].push(p);
  });

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "11px 12px 12px",
        background: "var(--card)",
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🔀</span>
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)" }}>
          팀별로 나뉘어 진행
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "1px 8px",
          }}
        >
          {order.length}팀 동시
        </span>
      </div>

      {/* 팀별 트랙 (나란히, 좁으면 세로로) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {order.map((teamName, i) => {
          const tColor = TEAM_COLORS[i % TEAM_COLORS.length];
          return (
            <div
              key={teamName}
              style={{
                flex: "1 1 130px",
                minWidth: 0,
                border: `1px solid ${tColor}55`,
                background: `${tColor}12`,
                borderRadius: 10,
                padding: 8,
              }}
            >
              {/* 팀 라벨 */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  background: tColor,
                  borderRadius: 999,
                  padding: "2px 9px",
                  marginBottom: 7,
                }}
              >
                👥 {teamName}
              </div>
              {/* 팀 일정 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {byTeam[teamName].map((place) => (
                  <TeamRow
                    key={place.id}
                    place={place}
                    color={tColor}
                    active={selectedPlaceId === place.id}
                    onSelectPlace={onSelectPlace}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamRow({
  place,
  color,
  active,
  onSelectPlace,
}: {
  place: Place;
  color: string;
  active: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const clickable = place.showOnMap && place.lat != null && place.lng != null;
  const ref = useActiveScroll(active);
  return (
    <div
      ref={ref}
      onClick={() => clickable && onSelectPlace(place.id)}
      style={{
        background: "var(--card)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        borderRadius: 7,
        padding: "6px 8px",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color .15s",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 12.5, lineHeight: 1.3 }}>
        {place.time ? `${place.time} · ` : ""}
        {place.name}
      </div>
      {place.memo && (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-soft)",
            marginTop: 2,
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {place.memo}
        </div>
      )}
    </div>
  );
}
