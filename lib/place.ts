import type { Place } from "@/lib/trips";

// 장소의 표시 구분
//  - confirmed : 확정 일정 (순번·경로에 포함)
//  - optional  : [선택사항] 갈 수도 안 갈 수도 있는 단독 장소
//  - candidate : 후보지 (candidateGroup 값이 있으면. 같은 값끼리 한 그룹, 택1)
//  - team      : 팀 분기 (team 값이 있으면. 팀이 나뉘어 각자 동시에 진행하는 일정)
// 이 모듈은 fs/path에 의존하지 않으므로 클라이언트 컴포넌트에서도 import 가능하다.
export type PlaceKind = "confirmed" | "optional" | "candidate" | "team";

export function placeKind(p: Place): PlaceKind {
  if (p.candidateGroup && p.candidateGroup.trim() !== "") return "candidate";
  if (p.team && p.team.trim() !== "") return "team";
  if (p.status === "optional") return "optional";
  return "confirmed";
}
