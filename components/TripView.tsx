"use client";

import { useState } from "react";
import Link from "next/link";
import KakaoMap from "@/components/KakaoMap";
import { getDistanceKm, estimateDriveMinutes } from "@/lib/geo";
import type { Trip } from "@/lib/trips";

export default function TripView({ trip }: { trip: Trip }) {
  const [selectedDay, setSelectedDay] = useState(trip.days[0]?.day ?? 1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const day = trip.days.find((d) => d.day === selectedDay);

  const travelInfoByPlaceId: Record<string, { km: number; min: number }> = {};
  if (day) {
    let lastPlace: { lat: number; lng: number } | null = null;
    day.places.forEach((place) => {
      if (place.showOnMap && place.lat != null && place.lng != null) {
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

            {day?.places.map((place) => {
              const travel = travelInfoByPlaceId[place.id];
              return (
                <div key={place.id}>
                  {travel && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#4D96FF",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      🚗 약 {travel.min}분 이동 (직선거리 {travel.km.toFixed(1)}km, 근사치)
                    </div>
                  )}
                  <div
                    onClick={() => {
                      if (place.showOnMap && place.lat != null && place.lng != null) {
                        setSelectedPlaceId(place.id);
                      }
                    }}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #f0f0f0",
                      cursor:
                        place.showOnMap && place.lat != null && place.lng != null
                          ? "pointer"
                          : "default",
                      background: selectedPlaceId === place.id ? "#F0F6FF" : "transparent",
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {place.time} · {place.category}
                    </div>
                    <div style={{ fontWeight: 600, color: "#111" }}>{place.name}</div>
                    {place.memo && (
                      <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                        {place.memo}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
