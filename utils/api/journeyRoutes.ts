// utils/api/journeyRoutes.ts
import { client } from "./client";

export type RouteId = string | number;

// 백엔드 Journey 타입(요약)
export type Journey = {
  id: number;
  title: string;
  description: string;
  totalDistanceKm: number;
  category: "DOMESTIC" | "INTERNATIONAL";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedDays: number;
  thumbnailUrl: string;
  completedUserCount?: number;
};

export type JourneyLandmark = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number; // meters
  description?: string;
  imageUrl?: string;
};

export type JourneyRoute = {
  id: number;
  latitude: number;
  longitude: number;
  sequence: number;
  altitude?: number;
  description?: string | null;
};

// 프론트 호환 타입
export type RouteSummary = {
  id: RouteId;
  title: string;
  description: string;
  distance: string;
  duration: string;
  difficulty: "쉬움" | "보통" | "어려움" | string;
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

export type RouteDetail = RouteSummary & { landmarks?: Landmark[] };

const difficultyMap: Record<string, "쉬움" | "보통" | "어려움"> = {
  EASY: "쉬움",
  MEDIUM: "보통",
  HARD: "어려움",
};

function mapJourneyToSummary(j: Journey): RouteSummary {
  return {
    id: j.id,
    title: j.title,
    description: j.description,
    distance: `${j.totalDistanceKm}Km`,
    duration: `${j.estimatedDays}일`,
    difficulty: difficultyMap[j.difficulty] || "보통",
    completed: 0,
    total: j.completedUserCount || 0,
    image: j.thumbnailUrl || "palace",
    tags: [],
  };
}

// 목록
export async function listRoutes(): Promise<RouteSummary[]> {
  const res = await client.get("/v1/journeys");
  const arr: any[] = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
  return arr.map((x: any) => mapJourneyToSummary({
    id: Number(x.id ?? x.journeyId ?? 0),
    title: String(x.title ?? x.name ?? ""),
    description: String(x.description ?? x.summary ?? ""),
    totalDistanceKm: Number(x.totalDistanceKm ?? x.distanceKm ?? x.total_distance_km ?? 0),
    category: (x.category as any) ?? "DOMESTIC",
    difficulty: (x.difficulty as any) ?? "MEDIUM",
    estimatedDays: Number(x.estimatedDays ?? x.days ?? 0),
    thumbnailUrl: String(x.thumbnailUrl ?? x.imageUrl ?? ""),
    completedUserCount: Number(x.completedUserCount ?? x.completed ?? 0),
  } as Journey));
}

// 상세 + 랜드마크
export async function getRouteDetail(id: RouteId): Promise<RouteDetail> {
  const [journeyRes, landmarksRes] = await Promise.all([
    client.get(`/v1/journeys/${id}`),
    client.get(`/v1/landmarks/journey/${id}`).catch(() => ({ data: [] })),
  ]);
  const j: any = journeyRes.data?.data ?? journeyRes.data ?? {};
  const summary = mapJourneyToSummary({
    id: Number(j.id ?? id),
    title: String(j.title ?? j.name ?? ""),
    description: String(j.description ?? j.summary ?? ""),
    totalDistanceKm: Number(j.totalDistanceKm ?? j.distanceKm ?? j.total_distance_km ?? 0),
    category: (j.category as any) ?? "DOMESTIC",
    difficulty: (j.difficulty as any) ?? "MEDIUM",
    estimatedDays: Number(j.estimatedDays ?? j.days ?? 0),
    thumbnailUrl: String(j.thumbnailUrl ?? j.imageUrl ?? ""),
    completedUserCount: Number(j.completedUserCount ?? j.completed ?? 0),
  } as Journey);

  const lms: any[] = Array.isArray(landmarksRes.data)
    ? landmarksRes.data
    : landmarksRes.data?.content ?? [];

  const landmarks: Landmark[] = lms.map((lm: any) => ({
    id: String(lm.id ?? lm.landmarkId ?? ""),
    name: String(lm.name ?? lm.title ?? ""),
    distance: `${(
      Number(lm.distanceFromStart ?? lm.distance_m ?? lm.distance ?? 0) / 1000
    ).toFixed(1)}km 지점`,
    completed: Boolean(lm.completed ?? lm.visited),
  }));

  return { ...summary, landmarks };
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
