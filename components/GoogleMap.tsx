"use client";

import { useEffect, useRef, useState } from "react";
import type { Day } from "@/lib/trips";
import { dayColor } from "@/lib/colors";
import { placeKind } from "@/lib/place";

declare global {
  interface Window {
    google: any;
  }
}

type MarkerEntry = { marker: any; info: any };

export default function GoogleMap({
  days,
  selectedDay,
  selectedPlaceId,
}: {
  days: Day[];
  selectedDay: number | "all";
  selectedPlaceId: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const markerMapRef = useRef<Record<string, MarkerEntry>>({});
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) return;

    const initMap = () => {
      if (!mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 35.16, lng: 129.14 },
        zoom: 11,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
      });
      setMapInstance(map);
    };

    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    let script = document.getElementById(
      "google-maps-sdk"
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "google-maps-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initMap);
    return () => script?.removeEventListener("load", initMap);
  }, [apiKey]);

  useEffect(() => {
    if (!mapInstance || !window.google) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    markerMapRef.current = {};

    // 전체 보기면 모든 날짜, 특정 날짜면 그 날짜만 렌더한다.
    const shownDays =
      selectedDay === "all" ? days : days.filter((d) => d.day === selectedDay);
    if (shownDays.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let totalPlaces = 0;

    shownDays.forEach((day) => {
      const color = dayColor(day.day);
      const places = day.places.filter(
        (p) => p.showOnMap && p.lat != null && p.lng != null
      );
      const linePath: any[] = [];
      let order = 0; // 확정 장소만 순번을 매긴다

      // 후보지 마커용 다이아몬드 심볼
      const DIAMOND = "M 0,-1 1,0 0,1 -1,0 z";

      places.forEach((place) => {
        const pos = { lat: place.lat as number, lng: place.lng as number };
        bounds.extend(pos);
        totalPlaces++;

        const kind = placeKind(place);
        let markerOptions: any;
        if (kind === "confirmed") {
          order++;
          linePath.push(pos);
          markerOptions = {
            map: mapInstance,
            position: pos,
            label: {
              text: String(order),
              color: "#fff",
              fontSize: "12px",
              fontWeight: "700",
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 13,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          };
        } else if (kind === "optional") {
          // 선택사항: 점선 느낌의 속 빈 원(순번 없음)
          markerOptions = {
            map: mapInstance,
            position: pos,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: color,
              fillOpacity: 0.2,
              strokeColor: color,
              strokeWeight: 2,
            },
          };
        } else if (kind === "team") {
          // 팀 분기: 사각(순번 없음)
          markerOptions = {
            map: mapInstance,
            position: pos,
            icon: {
              path:
                "M -1,-1 1,-1 1,1 -1,1 z",
              scale: 9,
              fillColor: color,
              fillOpacity: 0.6,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          };
        } else {
          // 후보지: 다이아몬드(순번 없음)
          markerOptions = {
            map: mapInstance,
            position: pos,
            icon: {
              path: DIAMOND,
              scale: 11,
              fillColor: color,
              fillOpacity: 0.85,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          };
        }

        const marker = new window.google.maps.Marker(markerOptions);

        const info = new window.google.maps.InfoWindow({ content: place.name });
        marker.addListener("click", () =>
          info.open({ map: mapInstance, anchor: marker })
        );

        overlaysRef.current.push(marker);
        markerMapRef.current[place.id] = { marker, info };
      });

      if (linePath.length > 1) {
        const polyline = new window.google.maps.Polyline({
          map: mapInstance,
          path: linePath,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: 3,
        });
        overlaysRef.current.push(polyline);
      }

      // 경로 라인(도보길 등) 그리기
      (day.routes ?? []).forEach((route) => {
        const pts = (route.path ?? [])
          .filter((p) => p.lat != null && p.lng != null)
          .map((p) => ({ lat: p.lat, lng: p.lng }));
        if (pts.length < 2) return;
        pts.forEach((pt) => bounds.extend(pt));
        totalPlaces++;

        const routeLine = new window.google.maps.Polyline({
          map: mapInstance,
          path: pts,
          strokeColor: route.color || color,
          strokeOpacity: 0.9,
          strokeWeight: 6,
        });
        overlaysRef.current.push(routeLine);
      });
    });

    if (totalPlaces > 0) {
      mapInstance.fitBounds(bounds);
      if (totalPlaces === 1) mapInstance.setZoom(15);
    }
  }, [mapInstance, selectedDay, days]);

  useEffect(() => {
    if (!mapInstance || !selectedPlaceId) return;
    const entry = markerMapRef.current[selectedPlaceId];
    if (!entry) return;

    mapInstance.panTo(entry.marker.getPosition());
    mapInstance.setZoom(15);
    entry.info.open({ map: mapInstance, anchor: entry.marker });
    const timer = setTimeout(() => entry.info.close(), 3000);
    return () => clearTimeout(timer);
  }, [selectedPlaceId, mapInstance]);

  if (!apiKey) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          color: "#888",
          background: "#fafafa",
        }}
      >
        구글 지도 API 키(NEXT_PUBLIC_GOOGLE_MAPS_KEY)가 설정되지 않았습니다.
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
