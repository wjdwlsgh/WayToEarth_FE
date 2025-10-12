// utils/api/userJourneys.ts
// 서버 연동: Swagger 참고 (/v1/journeys/{journeyId}/start, /v1/journey-progress/user/{userId})
import type { JourneyId, UserJourneyState } from "../../types/journey";
import { client } from "./client";

export type ProgressResponse = {
  progressM: number;
  lastLandmarkOrder: number;
  nextLandmarkDistM: number;
  percent: number;
  todayRunM: number;
  message: string;
};

export async function start(
  _userId: string,
  _journeyId: JourneyId
): Promise<UserJourneyState> {
  await client.post(`/v1/journeys/${_journeyId}/start`);
  const now = new Date().toISOString();
  return {
    userId: _userId,
    journeyId: _journeyId,
    progressM: 0,
    lastLandmarkOrder: 0,
    runsCount: 0,
    startedAt: now,
    completedAt: null,
  };
}

export async function getState(
  _userId: string,
  _journeyId: JourneyId,
  _totalM: number,
  _nextLandmarkDistM: number
): Promise<ProgressResponse> {
  const res = await client.get(`/v1/journey-progress/user/${_userId}`, {
    params: { journeyId: _journeyId },
  });
  const d: any = res.data?.data ?? res.data ?? {};
  const progressM = Number(d.progressM ?? d.progressMeters ?? d.progress ?? 0);
  const lastOrder = Number(d.lastLandmarkOrder ?? d.last_order ?? 0);
  const today = Number(d.todayRunM ?? d.todayMeters ?? 0);
  const percent = Number(d.percent ?? d.progressPercent ?? ( _totalM > 0 ? (progressM / _totalM) * 100 : 0));
  return {
    progressM,
    lastLandmarkOrder: lastOrder,
    nextLandmarkDistM: _nextLandmarkDistM,
    percent,
    todayRunM: today,
    message: d.message ?? "",
  };
}

export async function progress(
  _userId: string,
  _journeyId: JourneyId,
  _totalM: number,
  _deltaM: number
): Promise<ProgressResponse> {
  // 서버 스펙상 progressId 기반 업데이트가 필요한 경우가 많음 (PUT /v1/journey-progress/{progressId})
  // 진행 ID가 없는 현재 구조에서는 안전하게 미구현 처리
  throw new Error("여정 진행 업데이트 API 연동 필요 (progressId 필요)");
}
