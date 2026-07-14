// 날짜(Day)별 마커·라벨 색상. 크림/베이지 배경과 어울리는 차분한 색으로 구성.
// 레퍼런스 디자인처럼 "구간(날짜)별로 색을 구분"하는 데 사용한다.
export const DAY_COLORS = [
  "#B0563C", // 테라코타
  "#C79A3A", // 골드/오커
  "#6E8B5A", // 세이지 그린
  "#3F8E8C", // 틸
  "#6B4E8E", // 플럼
  "#B5763A", // 앰버 브라운
  "#8E5A6E", // 모브
  "#4E7A9E", // 더스티 블루
  "#7A8B3A", // 올리브
  "#A0503C", // 브릭
];

// day 번호(1부터)를 색으로. 색 개수를 넘어가면 순환한다.
export function dayColor(day: number): string {
  const idx = (Math.max(1, day) - 1) % DAY_COLORS.length;
  return DAY_COLORS[idx];
}
