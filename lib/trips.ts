import fs from "fs";
import path from "path";
import { isGithubConfigured, githubPutFile, githubDeleteFile } from "./github";

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
  // 확정/선택 구분. 없거나 "confirmed"이면 확정 일정으로 취급한다.
  status?: "confirmed" | "optional";
  // 값이 있으면 "후보지"로 취급하고, 같은 문자열끼리 한 그룹으로 묶는다(그룹 라벨 겸용).
  candidateGroup?: string;
  // 값이 있으면 "팀 분기"로 취급한다. 팀이 나뉘어 동시에 각자 진행하는 일정(팀명 겸용).
  team?: string;
};

// 지도에 그릴 경로 라인(도보길 등). path는 위경도 좌표를 순서대로 잇는다.
export type RouteLine = {
  name?: string;
  color?: string;
  path: { lat: number; lng: number }[];
};

export type Day = {
  day: number;
  date: string;
  label: string;
  // 요약 리스트에 표시할 그날의 제목/한줄 설명(선택). 없으면 장소명으로 자동 생성한다.
  title?: string;
  summary?: string;
  places: Place[];
  // 지도에 그릴 경로 라인(선택). 예: 광안역→광안해수욕장 도보길
  routes?: RouteLine[];
};

export type MapProvider = "kakao" | "google";

export type Trip = {
  title: string;
  // 제목 아래 한 줄 경로/설명(선택). 없으면 날짜별 제목을 이어 자동 생성한다.
  subtitle?: string;
  mapProvider: MapProvider;
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
  const t = (
    JSON.parse(raw) as {
      trip: Omit<Trip, "mapProvider"> & { mapProvider?: MapProvider };
    }
  ).trip;
  // 기존 데이터 호환: mapProvider 없으면 kakao 기본값
  return {
    title: t.title,
    subtitle: t.subtitle,
    days: t.days,
    mapProvider: t.mapProvider ?? "kakao",
  };
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

// ---- 쓰기(write) — 백오피스 전용 ----
// 로컬 개발: 파일시스템에 직접 저장.
// 프로덕션(Vercel): 파일시스템이 읽기 전용이므로 GitHub API로 커밋(→ 자동 재배포).
function isLocalWritable(): boolean {
  return process.env.NODE_ENV !== "production";
}

// 편집(저장)이 가능한 환경인지: 로컬이거나, 프로덕션이면 GitHub 저장소가 설정된 경우.
export function canEdit(): boolean {
  return isLocalWritable() || isGithubConfigured();
}

function tripFilePath(slug: string): string {
  return path.join(TRIPS_DIR, `${slug}.json`);
}

function githubPath(slug: string): string {
  return `data/trips/${slug}.json`;
}

function serializeTrip(trip: Trip): string {
  return JSON.stringify({ trip }, null, 2) + "\n";
}

export async function saveTrip(slug: string, trip: Trip): Promise<void> {
  if (!canEdit()) throw new Error("편집 저장소가 설정되지 않았습니다.");
  if (!isValidSlug(slug)) throw new Error("잘못된 slug 형식입니다.");
  const content = serializeTrip(trip);
  if (isLocalWritable()) {
    if (!fs.existsSync(TRIPS_DIR)) fs.mkdirSync(TRIPS_DIR, { recursive: true });
    fs.writeFileSync(tripFilePath(slug), content, "utf-8");
    return;
  }
  await githubPutFile(githubPath(slug), content, `chore(admin): ${slug} 일정 수정`);
}

export async function createTrip(
  slug: string,
  title: string,
  mapProvider: MapProvider
): Promise<Trip> {
  if (!canEdit()) throw new Error("편집 저장소가 설정되지 않았습니다.");
  if (!isValidSlug(slug)) {
    throw new Error("slug는 영소문자·숫자·하이픈만 사용할 수 있습니다.");
  }
  // 중복 체크(배포 스냅샷 기준). 프로덕션에서 방금 만든 여행은 재배포 전까지 스냅샷에 없다.
  if (fs.existsSync(tripFilePath(slug))) {
    throw new Error("이미 존재하는 slug입니다.");
  }
  const trip: Trip = { title, mapProvider, days: [] };
  await saveTrip(slug, trip);
  return trip;
}

export async function deleteTrip(slug: string): Promise<void> {
  if (!canEdit()) throw new Error("편집 저장소가 설정되지 않았습니다.");
  if (!isValidSlug(slug)) throw new Error("잘못된 slug 형식입니다.");
  if (isLocalWritable()) {
    const file = tripFilePath(slug);
    if (fs.existsSync(file)) fs.rmSync(file);
    return;
  }
  await githubDeleteFile(githubPath(slug), `chore(admin): ${slug} 삭제`);
}
