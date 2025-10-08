// utils/api/journeyRoutes.ts
import { client } from './client';

export type RouteId = string | number;

// 백엔드 응답 타입
export type Journey = {
  id: number;
  title: string; // DB 필드명: title
  description: string;
  totalDistanceKm: number;
  category: 'DOMESTIC' | 'INTERNATIONAL';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedDays: number; // DB 필드명: estimated_days
  thumbnailUrl: string;
  landmarkCount?: number;
  completedUserCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type JourneyRoute = {
  id: number;
  latitude: number;
  longitude: number;
  sequence: number;
  altitude?: number;
  description?: string | null;
};

export type JourneyLandmark = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number; // km 단위 (백엔드 DB 기준)
  description?: string;
  imageUrl?: string;
};

// 프론트엔드 호환 타입 (기존 코드와 호환)
export type RouteSummary = {
  id: RouteId;
  title: string;
  description: string;
  distance: string;
  duration: string;
  difficulty: '쉬움' | '보통' | '어려움' | string;
  completed: number;
  total: number;
  image: string;
  tags: string[];
};

export type Landmark = {
  id: string;
  name: string;
  distance: string;
  completed?: boolean;
};

export type RouteDetail = RouteSummary & {
  landmarks: Landmark[];
};

// 난이도 매핑
const difficultyMap: Record<string, '쉬움' | '보통' | '어려움'> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
};

// 백엔드 Journey → 프론트 RouteSummary 변환
function mapJourneyToSummary(journey: Journey): RouteSummary {
  return {
    id: journey.id,
    title: journey.title,
    description: journey.description,
    distance: `${journey.totalDistanceKm}Km`,
    duration: `${journey.estimatedDays}일`,
    difficulty: difficultyMap[journey.difficulty] || '보통',
    completed: 0,
    total: journey.completedUserCount || 0,
    image: journey.thumbnailUrl || 'palace',
    tags: [],
  };
}

// API 함수들

/**
 * 여정 목록 조회
 */
export async function listRoutes(): Promise<RouteSummary[]> {
  const response = await client.get<Journey[]>('/v1/journeys');
  return response.data.map(mapJourneyToSummary);
}

/**
 * 여정 상세 조회
 */
export async function getRouteDetail(id: RouteId): Promise<RouteDetail> {
  const [journeyRes, landmarksRes] = await Promise.all([
    client.get<Journey>(`/v1/journeys/${id}`),
    client.get<JourneyLandmark[]>(`/v1/landmarks/journey/${id}`),
  ]);

  const journey = journeyRes.data;
  const summary = mapJourneyToSummary(journey);

  const landmarks: Landmark[] = landmarksRes.data.map((lm) => ({
    id: String(lm.id),
    name: lm.name,
    distance: `${(lm.distanceFromStart / 1000).toFixed(1)}km 지점`,
    completed: false,
  }));

  return {
    ...summary,
    landmarks,
  };
}

/**
 * 여정 경로 좌표 조회 (전체)
 */
export async function getJourneyRoutes(journeyId: RouteId): Promise<JourneyRoute[]> {
  const response = await client.get<JourneyRoute[]>(`/v1/journeys/${journeyId}/routes/all`);
  return response.data;
}

/**
 * 여정 랜드마크 조회
 */
export async function getJourneyLandmarks(journeyId: RouteId): Promise<JourneyLandmark[]> {
  const response = await client.get<JourneyLandmark[]>(`/v1/landmarks/journey/${journeyId}`);
  return response.data;
}

