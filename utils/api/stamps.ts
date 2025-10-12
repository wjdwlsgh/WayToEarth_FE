// utils/api/stamps.ts
// 목데이터 제거. 서버 연동 전까지는 명시적으로 미구현 에러를 던집니다.
import type { JourneyId } from "../../types/journey";

export type ClaimBody = {
  journeyId: JourneyId;
  landmarkId: string;
  userLat: number;
  userLng: number;
  photo?: string;
  mood?: string;
  rating?: number;
  text?: string;
};

export async function claimStamp(_body: ClaimBody) {
  throw new Error("스탬프 수집 API 연동 필요");
}

export async function getGuestbook(
  _journeyId: JourneyId,
  _landmarkId?: string
) {
  throw new Error("방명록 조회 API 연동 필요");
}

export async function postGuestbook(
  _journeyId: JourneyId,
  _data: { landmarkId?: string; text: string; rating?: number }
) {
  throw new Error("방명록 작성 API 연동 필요");
}

export async function likeGuestbook(_id: string) {
  throw new Error("방명록 좋아요 API 연동 필요");
}

export async function reportGuestbook(_id: string) {
  throw new Error("방명록 신고 API 연동 필요");
}
