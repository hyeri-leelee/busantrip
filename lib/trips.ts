import fs from "fs";
import path from "path";

// 여행지별 일정 데이터는 data/trips/<slug>.json 에 저장한다.
// 새 여행지를 추가하려면 이 폴더에 JSON 파일만 넣으면 자동으로 라우트가 생성된다.
const TRIPS_DIR = path.join(process.cwd(), "data", "trips");

export type Place = {
  id: string;
  time: string;
  name: string;
  category: string;
  lat: number | null;
  lng: number | null;
  memo: string;
  showOnMap: boolean;
  image?: string | null;
};

export type Day = {
  day: number;
  date: string;
  label: string;
  places: Place[];
};

export type Trip = {
  title: string;
  days: Day[];
};

export type TripSummary = {
  slug: string;
  title: string;
  dayCount: number;
  startDate: string | null;
  endDate: string | null;
};

// URL로 들어오는 slug 검증 (경로 조작 방지)
const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function getTripSlugs(): string[] {
  if (!fs.existsSync(TRIPS_DIR)) return [];
  return fs
    .readdirSync(TRIPS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .filter(isValidSlug)
    .sort();
}

export function getTrip(slug: string): Trip | null {
  if (!isValidSlug(slug)) return null;
  const file = path.join(TRIPS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  return (JSON.parse(raw) as { trip: Trip }).trip;
}

export function getAllTripSummaries(): TripSummary[] {
  return getTripSlugs().map((slug) => {
    const trip = getTrip(slug)!;
    const dates = trip.days.map((d) => d.date).filter(Boolean).sort();
    return {
      slug,
      title: trip.title,
      dayCount: trip.days.length,
      startDate: dates[0] ?? null,
      endDate: dates[dates.length - 1] ?? null,
    };
  });
}
