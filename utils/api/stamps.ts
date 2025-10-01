// utils/api/stamps.ts
// 스탬프/방명록 목 API
import type { JourneyId } from "../../types/journey";

type ClaimBody = {
  journeyId: JourneyId;
  landmarkId: string;
  userLat: number;
  userLng: number;
  photo?: string;
  mood?: string;
  rating?: number;
  text?: string;
};

export async function claimStamp(body: ClaimBody) {
  await new Promise((r) => setTimeout(r, 120));
  // 목: 위치 반경은 클라 선검사에 맡기고 항상 성공 처리
  return {
    granted: true,
    stampId: `st_${Date.now()}`,
    newTotalStamps: Math.floor(Math.random() * 10) + 1,
  };
}

export async function getGuestbook(journeyId: JourneyId, landmarkId?: string) {
  await new Promise((r) => setTimeout(r, 120));
  return [
    {
      id: "gb_1",
      user: "지구러너",
      text: "경치가 최고!",
      rating: 5,
      likes: 3,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function postGuestbook(
  journeyId: JourneyId,
  data: { landmarkId?: string; text: string; rating?: number }
) {
  await new Promise((r) => setTimeout(r, 120));
  return { id: `gb_${Date.now()}`, ...data };
}

export async function likeGuestbook(id: string) {
  await new Promise((r) => setTimeout(r, 80));
  return { ok: true };
}

export async function reportGuestbook(id: string) {
  await new Promise((r) => setTimeout(r, 80));
  return { ok: true };
}

