// utils/api/auth.ts
import { client } from "./client";

type KakaoMe = {
  id: number;
  kakao_account?: { email?: string };
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
};

export type LoginResponse = {
  // 서버 실제 페이로드(언래핑 가정). 프로젝트 상황에 맞춰 유연하게 사용.
  userId?: number;
  jwtToken?: string; // 서버가 jwtToken 키로 반환
  accessToken?: string; // 혹은 accessToken 키로 반환하는 서버도 대비
  refreshToken?: string;
  tokenType?: string; // "Bearer"
  isNewUser?: boolean;
  isOnboardingCompleted?: boolean;
};

export const kakaoLogin = async (code: string, redirectUri: string) => {
  const res = await client.post<LoginResponse>("/v1/auth/kakao", {
    code,
    redirectUri,
    isMobile: true,
  });
  return res.data; // client가 래퍼 언래핑
};

export const kakaoLoginWithSDK = async (accessToken: string) => {
  // 1) 카카오 user/me로 kakaoId 확보
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!meRes.ok) {
    const text = await meRes.text().catch(() => "");
    throw new Error(
      `Kakao user/me 요청 실패: ${meRes.status} ${meRes.statusText} ${text}`
    );
  }
  const me: KakaoMe = await meRes.json();
  const kakaoId = me?.id != null ? String(me.id) : "";
  if (!kakaoId) throw new Error("카카오 사용자 ID를 가져오지 못했습니다.");

  // 2) 서버 로그인 요청 (POST /v1/auth/kakao)
  // Swagger: KakaoLoginRequest requires { accessToken, kakaoId }
  const payload = {
    kakaoId,
    accessToken,
    isMobile: true,
  } as const;

  const res = await client.post<LoginResponse>("/v1/auth/kakao", payload);

  // 3) JWT 픽업(언래핑 유/무 모두 커버)
  const body: any = res.data; // 언래핑되면 페이로드, 아니면 {success,data,...}
  const jwt =
    body?.jwtToken ??
    body?.accessToken ??
    body?.token ??
    body?.data?.jwtToken ??
    body?.data?.accessToken ??
    body?.data?.token;

  if (!jwt) {
    throw new Error(
      `서버에서 JWT 토큰을 받지 못했습니다. resp=${JSON.stringify(body)}`
    );
  }

  // 필요한 플래그도 래퍼 유무에 상관없이 동일 인터페이스로
  const data = body?.data ?? body;
  return {
    jwtToken: jwt,
    isOnboardingCompleted: data?.isOnboardingCompleted ?? false,
    userId: data?.userId,
    isNewUser: data?.isNewUser,
  } as LoginResponse;
};
