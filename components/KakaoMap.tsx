"use client";

import { useEffect, useRef, useState } from "react";
import type { Day } from "@/lib/trips";

const CATEGORY_COLOR: Record<string, string> = {
  식사: "#FF6B6B",
  카페: "#C08552",
  명소: "#4D96FF",
  숙소: "#6C5CE7",
  이동: "#95A5A6",
};

declare global {
  interface Window {
    kakao: any;
  }
}

type MarkerEntry = { position: any; el: HTMLDivElement };

export default function KakaoMap({
  days,
  selectedDay,
  selectedPlaceId,
}: {
  days: Day[];
  selectedDay: number;
  selectedPlaceId: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const markerMapRef = useRef<Record<string, MarkerEntry>>({});

  useEffect(() => {
    if (window.kakao && window.kakao.maps) return;
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };
    document.head.appendChild(script);
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

    const day = days.find((d) => d.day === selectedDay);
    if (!day) return;

    const places = day.places.filter(
      (p: any) => p.showOnMap && p.lat && p.lng
    );

    const bounds = new window.kakao.maps.LatLngBounds();
    const linePath: any[] = [];

    places.forEach((place: any, index: number) => {
      const pos = new window.kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(pos);
      linePath.push(pos);

      const color = CATEGORY_COLOR[place.category] || "#4D96FF";
      const order = index + 1;

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.cursor = "pointer";

      const badge = document.createElement("div");
      badge.innerText = String(order);
      badge.style.width = "26px";
      badge.style.height = "26px";
      badge.style.borderRadius = "50%";
      badge.style.background = color;
      badge.style.color = "#fff";
      badge.style.fontSize = "13px";
      badge.style.fontWeight = "700";
      badge.style.display = "flex";
      badge.style.alignItems = "center";
      badge.style.justifyContent = "center";
      badge.style.border = "2px solid #fff";
      badge.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";

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
        strokeColor: "#4D96FF",
        strokeOpacity: 0.7,
        strokeStyle: "shortdash",
      });
      overlaysRef.current.push(polyline);
    }

    if (places.length > 0) {
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