import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백오피스 라우트는 요청 시점에 data/trips/*.json 을 파일시스템에서 읽는다.
  // 동적 경로(process.cwd()+data/trips)라 자동 추적이 안 되므로 명시적으로 포함시킨다.
  outputFileTracingIncludes: {
    "/admin": ["./data/trips/**"],
    "/admin/[trip]": ["./data/trips/**"],
    "/api/admin/trips": ["./data/trips/**"],
    "/api/admin/trips/[trip]": ["./data/trips/**"],
  },
};

export default nextConfig;
