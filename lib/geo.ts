// 두 좌표 간 직선거리(km) 계산 (Haversine 공식)
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름(km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 도심 주행 가정(평균 시속 25km, 신호/정체 감안) 기준 예상 소요시간(분)
export function estimateDriveMinutes(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}