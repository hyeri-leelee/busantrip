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
  selectedDay: number;
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

    const day = days.find((d) => d.day === selectedDay);
    if (!day) return;

    const places = day.places.filter((p) => p.showOnMap && p.lat != null && p.lng != null);
    const bounds = new window.google.maps.LatLngBounds();
    const linePath: any[] = [];

    places.forEach((place, index) => {
      const pos = { lat: place.lat as number, lng: place.lng as number };
      bounds.extend(pos);
      linePath.push(pos);
      const color = CATEGORY_COLOR[place.category] || "#4D96FF";

      const marker = new window.google.maps.Marker({
        map: mapInstance,
        position: pos,
        label: { text: String(index + 1), color: "#fff", fontSize: "12px", fontWeight: "700" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      const info = new window.google.maps.InfoWindow({ content: place.name });
      marker.addListener("click", () => info.open({ map: mapInstance, anchor: marker }));

      overlaysRef.current.push(marker);
      markerMapRef.current[place.id] = { marker, info };
    });

    if (linePath.length > 1) {
      const polyline = new window.google.maps.Polyline({
        map: mapInstance,
        path: linePath,
        strokeColor: "#4D96FF",
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });
      overlaysRef.current.push(polyline);
    }

    if (places.length > 0) {
      mapInstance.fitBounds(bounds);
      if (places.length === 1) mapInstance.setZoom(15);
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
