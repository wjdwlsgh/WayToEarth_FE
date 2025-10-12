// utils/api/journeyRoutes.ts
// 여정 러닝: 목데이터 제거. 서버 연동 준비용 최소 구현.
import { client } from "./client";

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

// 서버 스펙 확정 전까지: 실패 시 빈 배열/오류 전달
export async function listRoutes(): Promise<RouteSummary[]> {
  try {
    // TODO: 실제 엔드포인트 확정 시 수정 (예: /v1/journeys/routes)
    const { data } = await client.get("/v1/journeys");
    const list = (data?.content ?? data) as any[];
    if (!Array.isArray(list)) return [];
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
    return [];
  }
}

export async function getRouteDetail(id: RouteId): Promise<RouteDetail> {
  try {
    // TODO: 실제 엔드포인트 확정 시 수정 (예: /v1/journeys/{id})
    const { data } = await client.get(`/v1/journeys/${id}`);
    const r: any = data?.data ?? data ?? {};
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
      landmarks: Array.isArray(r.landmarks)
        ? r.landmarks.map((lm: any) => ({
            id: String(lm.id ?? ""),
            name: String(lm.name ?? ""),
            distance: lm.distance ?? lm.distanceText ?? undefined,
            completed: Boolean(lm.completed),
          }))
        : undefined,
    };
  } catch (e) {
    throw e;
  }
}
