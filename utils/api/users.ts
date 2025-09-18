// utils/api/onboarding.ts
import { client } from "./client";
import type { UserInfo } from "../../types/types";

/** 닉네임 중복확인: 서버 응답 포맷 차이를 흡수해 표준화 */
export async function checkNickname(rawNickname: string) {
  const nickname = (rawNickname ?? "").trim();

  if (!nickname) {
    return {
      available: false,
      isDuplicate: true,
      message: "닉네임을 입력하세요.",
    };
  }

  try {
    const { data } = await client.get("/v1/users/check-nickname", {
      params: { nickname },
    });

    // 서버가 available(Boolean) 또는 isDuplicate(Boolean)을 주는 경우를 모두 대응
    const available =
      typeof data?.available === "boolean"
        ? data.available
        : !Boolean(data?.isDuplicate);

    return {
      available,
      isDuplicate: !available,
      message:
        data?.message ??
        (available ? "사용 가능" : "이미 사용 중인 닉네임입니다."),
    };
  } catch (e: any) {
    // 장애 시엔 보수적으로 '중복으로 간주'하거나, 정책에 따라 사용 가능 처리 가능
    return {
      available: false,
      isDuplicate: true,
      message:
        e?.response?.data?.message ??
        "닉네임 확인에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }
}

/** 온보딩 입력 형태(화면에서 받는 값) */
export type OnboardingInput = {
  nickname: string;
  location: string; // 화면 key
  ageRange: string; // 화면 key (예: "20대 초반")
  goal: string; // 화면 key (예: "주 20km" / "20")
  gender: string | null; // "남성" | "여성" | "male" | "female" | null
};

/** 성별 표준화: 서버 정책에 맞춰 "남성"/"여성"으로 통일 */
function normalizeGender(g: string | null | undefined) {
  const v = (g ?? "").toString().trim().toLowerCase();
  if (v === "male" || v === "남성" || v === "m") return "남성";
  if (v === "female" || v === "여성" || v === "f") return "여성";
  return ""; // 빈 문자열이면 서버에서 선택 안 한 것으로 처리
}

/** 숫자 문자열 추출: "주 10km" → 10 */
function extractNumberOrRaw(input: string) {
  const s = String(input ?? "").trim();
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : s;
}

/** 서버 스펙에 맞게 온보딩 데이터 전송 */
export async function submitOnboarding(input: OnboardingInput) {
  const payload = {
    nickname: (input.nickname ?? "").trim(),
    residence: (input.location ?? "").trim(),
    age_group: (input.ageRange ?? "").trim(),
    weekly_goal_distance: extractNumberOrRaw(input.goal),
    gender: normalizeGender(input.gender),
  };

  const { data } = await client.post("/v1/auth/onboarding", payload);
  return data;
}

/** 화면의 UserInfo → submitOnboarding 매핑 호출 */
export async function registerUser(userInfo: UserInfo) {
  // UserInfo 구조: { nickname, location, age, runningDistance, gender }
  return submitOnboarding({
    nickname: userInfo.nickname,
    location: userInfo.location,
    ageRange: userInfo.age,
    goal: userInfo.runningDistance,
    gender: (userInfo as any)?.gender ?? null,
  });
}
