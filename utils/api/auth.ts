// utils/api/auth.ts
import { client } from "./client";

// (구) OAuth 코드 방식: 필요하면 유지
export const kakaoLogin = (code: string, redirectUri: string) =>
  client
    .post("/v1/auth/kakao", { code, redirectUri, isMobile: true })
    .then((r) => r.data);

// (신) SDK 방식: accessToken 전달
export const kakaoLoginWithSDK = (accessToken: string) =>
  client
    // 백엔드에서 받는 엔드포인트에 맞춰 경로를 선택하세요.
    // 1) /v1/auth/kakao 가 accessToken도 받도록 구현되어 있다면 그걸 그대로 사용
    // 2) 아니라면 /v1/auth/kakao/sdk 같은 전용 엔드포인트를 백엔드에 추가
    .post("/v1/auth/kakao", { accessToken, isMobile: true })
    // 예: .post("/v1/auth/kakao/sdk", { accessToken, isMobile: true })
    .then((r) => r.data);
