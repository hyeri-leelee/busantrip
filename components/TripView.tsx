"use client";

import { useState } from "react";
import Link from "next/link";
import KakaoMap from "@/components/KakaoMap";
import GoogleMap from "@/components/GoogleMap";
import { getDistanceKm, estimateDriveMinutes } from "@/lib/geo";
import { dayColor } from "@/lib/colors";
import type { Trip, Day } from "@/lib/trips";

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
                    onSelectPlace={setSelectedPlaceId}
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
          />
        ) : (
          <KakaoMap
            days={trip.days}
            selectedDay={selectedDay}
            selectedPlaceId={selectedPlaceId}
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

/* ── 선택된 날짜의 장소 카드 목록 ── */
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
  // 지도 마커와 동일한 순서 번호 + 이동 거리/시간 계산
  const orderByPlaceId: Record<string, number> = {};
  const travelByPlaceId: Record<string, { km: number; min: number }> = {};
  let order = 0;
  let last: { lat: number; lng: number } | null = null;
  day.places.forEach((place) => {
    if (place.showOnMap && place.lat != null && place.lng != null) {
      orderByPlaceId[place.id] = ++order;
      if (last) {
        const km = getDistanceKm(last.lat, last.lng, place.lat, place.lng);
        travelByPlaceId[place.id] = { km, min: estimateDriveMinutes(km) };
      }
      last = { lat: place.lat, lng: place.lng };
    }
  });

  return (
    <div style={{ padding: "2px 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {day.places.map((place) => {
        const travel = travelByPlaceId[place.id];
        const num = orderByPlaceId[place.id];
        const clickable =
          place.showOnMap && place.lat != null && place.lng != null;
        const active = selectedPlaceId === place.id;
        return (
          <div key={place.id}>
            {travel && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--muted)",
                  margin: "0 0 8px 8px",
                }}
              >
                🚗 약 {travel.min}분 이동 (직선 {travel.km.toFixed(1)}km · 근사치)
              </div>
            )}
            <div
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
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
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {place.time}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--ink)",
                    fontSize: 14.5,
                    lineHeight: 1.3,
                  }}
                >
                  {place.name}
                </div>
                {place.memo && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-soft)",
                      marginTop: 4,
                      lineHeight: 1.45,
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
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
