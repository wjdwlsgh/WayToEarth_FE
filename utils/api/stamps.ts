// utils/api/stamps.ts
// 스탬프/방명록 API (실서버 연동)
import { client } from "./client";
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

export async function collectStamp(
  userId: number,
  landmarkId: number
): Promise<{ success: boolean; stampId?: number }> {
  const { data } = await client.post<{ success: boolean; stampId?: number }>(
    `/v1/stamps/collect`,
    { landmarkId },
    { params: { userId } }
  );
  return data;
}

export async function claimStamp(body: ClaimBody) {
  const userId = 0; // TODO: 현재 사용자 ID 연동
  const res = await collectStamp(userId, Number(body.landmarkId));
  return { granted: Boolean(res.success), stampId: `st_${res.stampId ?? ''}`, newTotalStamps: 0 } as any;
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
