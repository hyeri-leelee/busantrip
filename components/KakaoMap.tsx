"use client";

import { useEffect, useRef, useState } from "react";
import type { Day } from "@/lib/trips";
import { dayColor } from "@/lib/colors";
import { placeKind } from "@/lib/place";

declare global {
  interface Window {
    kakao: any;
  }
}

type MarkerEntry = { position: any; el: HTMLDivElement };

// 후보지 마커 안에 넣을 카테고리 아이콘
function categoryEmoji(category?: string): string {
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

export default function KakaoMap({
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

  useEffect(() => {
    // SDK가 이미 로드돼 있으면(다른 라우트에서 넘어온 경우) 바로 지도 생성
    const loadMap = () => window.kakao.maps.load(() => initMap());

    if (window.kakao && window.kakao.maps) {
      loadMap();
      return;
    }

    // 스크립트는 페이지당 한 번만 추가 (중복 방지)
    let script = document.getElementById(
      "kakao-map-sdk"
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "kakao-map-sdk";
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
      document.head.appendChild(script);
    }
    script.addEventListener("load", loadMap);
    return () => script?.removeEventListener("load", loadMap);
  }, []);

  function initMap() {
    if (!mapRef.current) return;
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(35.16, 129.14),
      level: 9,
    });
    setMapInstance(map);
  }

  useEffect(() => {
    if (!mapInstance || !window.kakao) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    markerMapRef.current = {};

    // 전체 보기면 모든 날짜, 특정 날짜면 그 날짜만 렌더한다.
    const shownDays =
      selectedDay === "all" ? days : days.filter((d) => d.day === selectedDay);
    if (shownDays.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    let totalPlaces = 0;

    shownDays.forEach((day) => {
      const color = dayColor(day.day);
      const places = day.places.filter(
        (p: any) => p.showOnMap && p.lat && p.lng
      );
      const linePath: any[] = [];
      let order = 0; // 확정 장소만 순번을 매긴다

      places.forEach((place: any) => {
        const pos = new window.kakao.maps.LatLng(place.lat, place.lng);
        bounds.extend(pos);
        totalPlaces++;

        const kind = placeKind(place);

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";
        wrapper.style.cursor = "pointer";

        // 구분별 마커: 확정=번호 원 / 선택사항=점선 빈 원 / 후보지=아이콘 사각
        const badge = document.createElement("div");
        badge.style.display = "flex";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        badge.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
        if (kind === "confirmed") {
          order++;
          linePath.push(pos);
          badge.innerText = String(order);
          badge.style.width = "26px";
          badge.style.height = "26px";
          badge.style.borderRadius = "50%";
          badge.style.background = color;
          badge.style.color = "#fff";
          badge.style.fontSize = "13px";
          badge.style.fontWeight = "700";
          badge.style.border = "2px solid #fff";
        } else if (kind === "optional") {
          badge.innerText = "선택";
          badge.style.padding = "0 7px";
          badge.style.height = "22px";
          badge.style.borderRadius = "11px";
          badge.style.background = "#fff";
          badge.style.color = color;
          badge.style.fontSize = "10.5px";
          badge.style.fontWeight = "700";
          badge.style.border = `2px dashed ${color}`;
        } else if (kind === "team") {
          // 팀 분기: 팀명 라벨
          badge.innerText = place.team || "팀";
          badge.style.padding = "0 8px";
          badge.style.height = "22px";
          badge.style.borderRadius = "6px";
          badge.style.background = "#fff";
          badge.style.color = color;
          badge.style.fontSize = "10.5px";
          badge.style.fontWeight = "700";
          badge.style.border = `2px solid ${color}`;
        } else {
          // 후보지
          badge.innerText = categoryEmoji(place.category);
          badge.style.width = "24px";
          badge.style.height = "24px";
          badge.style.borderRadius = "7px";
          badge.style.background = color;
          badge.style.color = "#fff";
          badge.style.fontSize = "13px";
          badge.style.border = "2px solid #fff";
        }

        const tooltip = document.createElement("div");
        tooltip.innerText = place.name;
        tooltip.style.position = "absolute";
        tooltip.style.bottom = "32px";
        tooltip.style.padding = "4px 8px";
        tooltip.style.background = "#fff";
        tooltip.style.color = "#111";
        tooltip.style.fontSize = "12px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.display = "none";

        wrapper.appendChild(tooltip);
        wrapper.appendChild(badge);

        wrapper.addEventListener("mouseenter", () => {
          tooltip.style.display = "block";
        });
        wrapper.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });

        const customOverlay = new window.kakao.maps.CustomOverlay({
          map: mapInstance,
          position: pos,
          content: wrapper,
          yAnchor: 0.5,
        });
        overlaysRef.current.push(customOverlay);

        markerMapRef.current[place.id] = { position: pos, el: wrapper };
      });

      if (linePath.length > 1) {
        const polyline = new window.kakao.maps.Polyline({
          map: mapInstance,
          path: linePath,
          strokeWeight: 3,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeStyle: "shortdash",
        });
        overlaysRef.current.push(polyline);
      }

      // 경로 라인(도보길 등) 그리기
      (day.routes ?? []).forEach((route) => {
        const pts = (route.path ?? [])
          .filter((p) => p.lat != null && p.lng != null)
          .map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));
        if (pts.length < 2) return;
        pts.forEach((pt) => bounds.extend(pt));
        totalPlaces++; // 라인만 있는 날도 지도 범위가 잡히도록

        const routeLine = new window.kakao.maps.Polyline({
          map: mapInstance,
          path: pts,
          strokeWeight: 6,
          strokeColor: route.color || color,
          strokeOpacity: 0.9,
          strokeStyle: "solid",
        });
        overlaysRef.current.push(routeLine);

        if (route.name) {
          const mid = pts[Math.floor(pts.length / 2)];
          const label = document.createElement("div");
          label.innerText = route.name;
          label.style.transform = "translateY(-14px)";
          label.style.padding = "3px 8px";
          label.style.background = route.color || color;
          label.style.color = "#fff";
          label.style.fontSize = "11px";
          label.style.fontWeight = "700";
          label.style.borderRadius = "6px";
          label.style.whiteSpace = "nowrap";
          label.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
          const labelOverlay = new window.kakao.maps.CustomOverlay({
            map: mapInstance,
            position: mid,
            content: label,
            yAnchor: 1,
          });
          overlaysRef.current.push(labelOverlay);
        }
      });
    });

    if (totalPlaces > 0) {
      mapInstance.setBounds(bounds);
    }
  }, [mapInstance, selectedDay, days]);

  useEffect(() => {
    if (!mapInstance || !selectedPlaceId) return;

    const entry = markerMapRef.current[selectedPlaceId];
    if (!entry) return;

    mapInstance.setLevel(4);
    mapInstance.panTo(entry.position);

    const tooltip = entry.el.querySelector("div") as HTMLDivElement | null;
    if (tooltip) tooltip.style.display = "block";

    const timer = setTimeout(() => {
      if (tooltip) tooltip.style.display = "none";
    }, 3000);
    return () => clearTimeout(timer);
  }, [selectedPlaceId, mapInstance]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}