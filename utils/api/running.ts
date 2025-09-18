// utils/api/running.ts
import { client } from "./client";
import { RoutePoint } from "./types";

type RunningType = "SINGLE" | "VIRTUAL";

const isLocal = (sid?: string | null) =>
  typeof sid === "string" && sid.startsWith("local_");

// ✅ (DEV) 백엔드 미구현: 로컬 세션 생성
export async function apiStartSession(payload?: { runningType?: RunningType }) {
  return {
    sessionId: `local_${Date.now()}`,
    startedAt: new Date().toISOString(),
    runningType: payload?.runningType ?? "SINGLE",
    mocked: true,
  };
}

export async function apiUpdate(payload: {
  sessionId: string;
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSeconds: number | null;
  calories: number;
  currentPoint: RoutePoint & { sequence: number };
}) {
  if (isLocal(payload.sessionId)) {
    return { ack: true, mocked: true };
  }
  const body = {
    ...payload,
    averagePaceSeconds: payload.averagePaceSeconds ?? undefined, // null 회피
  };
  const { data } = await client.post("/v1/running/update", body);
  return data;
}

export async function apiPause(payload: { sessionId: string }) {
  if (isLocal(payload.sessionId))
    return { ack: true, status: "PAUSED", mocked: true };
  const { data } = await client.post("/v1/running/pause", payload);
  return data;
}

export async function apiResume(payload: { sessionId: string }) {
  if (isLocal(payload.sessionId))
    return { ack: true, status: "RUNNING", mocked: true };
  const { data } = await client.post("/v1/running/resume", payload);
  return data;
}

export async function apiComplete(payload: {
  sessionId: string;
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSeconds: number | null;
  calories: number;
  routePoints: Array<
    Pick<RoutePoint, "latitude" | "longitude" | "t"> & { sequence: number }
  >;
  endedAt?: string | number;
  title?: string;
}) {
  // ⛔ 운영 전 반드시 제거: 로컬 세션이면 더미 runId 반환(버튼 활성화용)
  if (isLocal(payload.sessionId)) {
    return { runId: 1, mocked: true } as { runId: number | null; mocked: true };
  }

  // endedAt ISO 통일
  const endedAtIso = (() => {
    if (!payload.endedAt) return new Date().toISOString();
    const n =
      typeof payload.endedAt === "number"
        ? payload.endedAt
        : Date.parse(String(payload.endedAt));
    return isFinite(n) ? new Date(n).toISOString() : new Date().toISOString();
  })();

  // routePoints 정리(시퀀스 1부터, t 보정)
  const routePoints = payload.routePoints.map((p, i) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    sequence: i + 1,
    t: p.t ?? Math.floor(Date.now() / 1000),
  }));

  const body = {
    sessionId: payload.sessionId,
    distanceMeters: payload.distanceMeters,
    durationSeconds: payload.durationSeconds,
    averagePaceSeconds: payload.averagePaceSeconds ?? undefined,
    calories: payload.calories,
    routePoints,
    endedAt: endedAtIso,
    ...(payload.title ? { title: payload.title } : {}),
  };

  const { data } = await client.post("/v1/running/complete", body);

  // 어떤 키가 와도 통일
  const runId = data?.runningRecordId ?? data?.recordId ?? data?.id ?? null;

  return { runId } as { runId: number | null };
}
