// GitHub Contents API를 통한 파일 저장 (프로덕션 편집용).
// Vercel 서버리스는 파일시스템이 읽기 전용이므로, 저장은 GitHub에 커밋하는 방식으로 처리한다.
// 커밋이 push를 일으키고 → Vercel이 자동 재배포하여 반영된다(약 1~2분 지연).
// 서버 전용 모듈 (토큰 사용). 클라이언트에서 import 금지.

const API = "https://api.github.com";

function config() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/name"
  const branch = process.env.GITHUB_BRANCH || "main";
  return { token, repo, branch };
}

export function isGithubConfigured(): boolean {
  const { token, repo } = config();
  return Boolean(token && repo);
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

// 현재 파일의 sha를 조회한다(없으면 null). 업데이트/삭제 시 필요.
async function getSha(path: string): Promise<string | null> {
  const { token, repo, branch } = config();
  const res = await fetch(`${API}/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: ghHeaders(token!),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub 파일 조회 실패 (${res.status})`);
  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

export async function githubPutFile(
  path: string,
  content: string,
  message: string
): Promise<void> {
  const { token, repo, branch } = config();
  if (!token || !repo) throw new Error("GitHub 저장소 설정이 없습니다.");
  const sha = await getSha(path);
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha; // 있으면 업데이트, 없으면 새 파일 생성
  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub 저장 실패 (${res.status}) ${detail.slice(0, 200)}`);
  }
}

export async function githubDeleteFile(path: string, message: string): Promise<void> {
  const { token, repo, branch } = config();
  if (!token || !repo) throw new Error("GitHub 저장소 설정이 없습니다.");
  const sha = await getSha(path);
  if (!sha) return; // 이미 없음
  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: "DELETE",
    headers: ghHeaders(token),
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub 삭제 실패 (${res.status}) ${detail.slice(0, 200)}`);
  }
}
