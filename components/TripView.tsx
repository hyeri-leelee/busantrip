"use client";

import { useState } from "react";
import Link from "next/link";
import KakaoMap from "@/components/KakaoMap";
import { getDistanceKm, estimateDriveMinutes } from "@/lib/geo";
import type { Trip } from "@/lib/trips";

const CATEGORY_COLOR: Record<string, string> = {
  식사: "#FF6B6B",
  카페: "#C08552",
  명소: "#4D96FF",
  숙소: "#6C5CE7",
  이동: "#95A5A6",
};

export default function TripView({ trip }: { trip: Trip }) {
  const [selectedDay, setSelectedDay] = useState(trip.days[0]?.day ?? 1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const day = trip.days.find((d) => d.day === selectedDay);

  // 지도 마커와 동일한 순서 번호 (showOnMap 인 장소만 1부터)
  const orderByPlaceId: Record<string, number> = {};
  const travelInfoByPlaceId: Record<string, { km: number; min: number }> = {};
  if (day) {
    let order = 0;
    let lastPlace: { lat: number; lng: number } | null = null;
    day.places.forEach((place) => {
      if (place.showOnMap && place.lat != null && place.lng != null) {
        orderByPlaceId[place.id] = ++order;
        if (lastPlace) {
          const km = getDistanceKm(lastPlace.lat, lastPlace.lng, place.lat, place.lng);
          travelInfoByPlaceId[place.id] = { km, min: estimateDriveMinutes(km) };
        }
        lastPlace = { lat: place.lat, lng: place.lng };
      }
    });
  }

  return (
    <div className="trip-container" style={{ display: "flex", height: "100vh" }}>
      <aside
        className="trip-sidebar"
        style={{
          width: 380,
          overflowY: "auto",
          padding: 16,
          borderRight: "1px solid #eee",
          background: "#fff",
          color: "#111",
        }}
      >
        <Link
          href="/"
          style={{ fontSize: 13, color: "#4D96FF", textDecoration: "none" }}
        >
          ← 여행 목록
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 12px" }}>
          {trip.title}
        </h1>

        {trip.days.length === 0 ? (
          <p style={{ fontSize: 14, color: "#888", marginTop: 24 }}>
            아직 등록된 일정이 없습니다.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {trip.days.map((d) => (
                <button
                  key={d.day}
                  onClick={() => {
                    setSelectedDay(d.day);
                    setSelectedPlaceId(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: selectedDay === d.day ? "#4D96FF" : "#fff",
                    color: selectedDay === d.day ? "#fff" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {Number(d.date.split("-")[1])}월 {Number(d.date.split("-")[2])}일({d.label})
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {day?.places.map((place) => {
                const travel = travelInfoByPlaceId[place.id];
                const order = orderByPlaceId[place.id];
                const color = CATEGORY_COLOR[place.category] || "#95A5A6";
                const clickable =
                  place.showOnMap && place.lat != null && place.lng != null;
                const selected = selectedPlaceId === place.id;
                return (
                  <div key={place.id}>
                    {travel && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#8a8f98",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          margin: "2px 0 8px 6px",
                        }}
                      >
                        🚗 약 {travel.min}분 이동 (직선거리 {travel.km.toFixed(1)}km, 근사치)
                      </div>
                    )}
                    <div
                      onClick={() => clickable && setSelectedPlaceId(place.id)}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: 12,
                        border: `1px solid ${selected ? color : "#ececec"}`,
                        borderLeft: `4px solid ${color}`,
                        borderRadius: 12,
                        background: selected ? "#F5F9FF" : "#fff",
                        boxShadow: selected
                          ? `0 0 0 1px ${color}22`
                          : "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: clickable ? "pointer" : "default",
                        transition: "border-color .15s, background .15s",
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
                          {order != null && (
                            <span
                              style={{
                                flexShrink: 0,
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: color,
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {order}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color,
                              background: `${color}18`,
                              padding: "1px 7px",
                              borderRadius: 999,
                            }}
                          >
                            {place.category}
                          </span>
                          {place.time && (
                            <span style={{ fontSize: 12, color: "#999" }}>
                              {place.time}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111",
                            fontSize: 15,
                            lineHeight: 1.3,
                          }}
                        >
                          {place.name}
                        </div>
                        {place.memo && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#666",
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
                            width: 72,
                            height: 72,
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
          </>
        )}
      </aside>

      <main className="trip-map" style={{ flex: 1 }}>
        <KakaoMap
          days={trip.days}
          selectedDay={selectedDay}
          selectedPlaceId={selectedPlaceId}
        />
      </main>
    </div>
  );
}
