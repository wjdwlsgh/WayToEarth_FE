// utils/api/journeyRoutes.ts
// 여정 러닝: 목데이터 제거. 서버 연동 준비용 최소 구현.
import { client, mockEnabled } from "./client";

export type RouteId = string;

export type RouteSummary = {
  id: RouteId;
  title: string;
  description: string;
  distance?: string;
  duration?: string;
  difficulty?: string;
  completed?: number;
  total?: number;
  image?: string;
  tags?: string[];
};

export type Landmark = { id: string; name: string; distance?: string; completed?: boolean };

export type RouteDetail = RouteSummary & { landmarks?: Landmark[] };

// mock fallback (off by default; enabled when mockEnabled=true)
const fallbackRoutes: RouteDetail[] = [
  {
    id: '1',
    title: '한국의 고궁탐방',
    description:
      '조선왕조의 아름다운 궁궐들을 달리며 만나보세요. 경복궁에서 시작하여 창덕궁, 창경궁, 덕수궁까지 이어지는 여정.',
    distance: '42.5Km',
    duration: '28일',
    difficulty: '보통',
    completed: 1,
    total: 234,
    image: 'palace',
    tags: ['경복궁', '창덕궁', '덕수궁'],
    landmarks: [
      { id: '1-1', name: '경복궁', distance: '8.5km 지점', completed: true },
      { id: '1-2', name: '창덕궁', distance: '15.2km 지점' },
      { id: '1-3', name: '창경궁', distance: '23.1km 지점' },
    ],
  },
];

// 서버 스펙 확정 전까지: 실패 시 빈 배열/오류 전달
export async function listRoutes(): Promise<RouteSummary[]> {
  try {
    // TODO: 실제 엔드포인트 확정 시 수정 (예: /v1/journeys/routes)
    const { data } = await client.get("/v1/journeys");
    const list = (data?.content ?? data) as any[];
    if (!Array.isArray(list)) return mockEnabled ? fallbackRoutes.map(({ landmarks, ...r }) => r) : [];
    return list.map((r: any) => ({
      id: String(r.id ?? r.routeId ?? ""),
      title: String(r.title ?? r.name ?? ""),
      description: String(r.description ?? r.summary ?? ""),
      distance: r.distance ?? r.distanceText ?? undefined,
      duration: r.duration ?? r.durationText ?? undefined,
      difficulty: r.difficulty ?? undefined,
      completed: r.completed ?? undefined,
      total: r.total ?? undefined,
      image: r.image ?? undefined,
      tags: Array.isArray(r.tags) ? r.tags : undefined,
    }));
  } catch {
    return mockEnabled ? fallbackRoutes.map(({ landmarks, ...r }) => r) : [];
  }
}

export async function getRouteDetail(id: RouteId): Promise<RouteDetail> {
  try {
    const [journeyRes, lmRes] = await Promise.all([
      client.get(`/v1/journeys/${id}`),
      client.get(`/v1/landmarks/journey/${id}`).catch(() => ({ data: [] })),
    ]);
    const r: any = (journeyRes.data?.data ?? journeyRes.data) ?? {};
    const lmList: any[] = Array.isArray(lmRes.data) ? lmRes.data : lmRes.data?.content ?? [];
    return {
      id: String(r.id ?? id),
      title: String(r.title ?? r.name ?? ""),
      description: String(r.description ?? r.summary ?? ""),
      distance: r.distance ?? r.distanceText ?? undefined,
      duration: r.duration ?? r.durationText ?? undefined,
      difficulty: r.difficulty ?? undefined,
      completed: r.completed ?? undefined,
      total: r.total ?? undefined,
      image: r.image ?? undefined,
      tags: Array.isArray(r.tags) ? r.tags : undefined,
      landmarks: lmList.map((lm: any) => ({
        id: String(lm.id ?? lm.landmarkId ?? ""),
        name: String(lm.name ?? lm.title ?? ""),
        distance: lm.distance ?? lm.distanceText ?? (typeof lm.order === 'number' ? `${lm.order}번` : undefined),
        completed: Boolean(lm.completed ?? lm.visited),
      })),
    };
  } catch (e) {
    if (mockEnabled) {
      const found = fallbackRoutes.find((r) => r.id === id) || fallbackRoutes[0];
      if (found) return found;
    }
    throw e;
  }
}
