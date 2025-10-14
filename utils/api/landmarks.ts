// utils/api/landmarks.ts
// 랜드마크 스토리 API 유틸리티

import { client } from './client';
import type { LandmarkDetail, StoryCard, LandmarkSummary, StoryType } from '../../types/landmark';

/**
 * 랜드마크 상세 조회 (스토리 포함)
 * @param landmarkId 랜드마크 ID
 * @param userId 사용자 ID (스탬프 수집 여부 확인용, 선택)
 */
export async function getLandmarkDetail(
  landmarkId: number,
  userId?: number // string → number로 변경
): Promise<LandmarkDetail> {
  const params = userId ? { userId } : {};
  const response = await client.get<LandmarkDetail>(
    `/v1/landmarks/${landmarkId}`,
    { params }
  );
  return response.data;
}

/**
 * 랜드마크의 스토리 카드 목록 조회
 * @param landmarkId 랜드마크 ID
 * @param type 스토리 타입 필터 (선택)
 */
export async function getLandmarkStories(
  landmarkId: number,
  type?: StoryType
): Promise<StoryCard[]> {
  const params = type ? { type } : {};
  const response = await client.get<StoryCard[]>(
    `/v1/landmarks/${landmarkId}/stories`,
    { params }
  );
  return response.data;
}

/**
 * 개별 스토리 카드 조회
 * @param storyCardId 스토리 카드 ID
 */
export async function getStoryCard(storyCardId: number): Promise<StoryCard> {
  const response = await client.get<StoryCard>(`/v1/story-cards/${storyCardId}`);
  return response.data;
}

/**
 * 여정의 랜드마크 목록 조회
 * @param journeyId 여정 ID
 */
export async function getJourneyLandmarks(journeyId: number): Promise<LandmarkSummary[]> {
  const response = await client.get<LandmarkSummary[]>(`/v1/landmarks/journey/${journeyId}`);
  return response.data;
}
