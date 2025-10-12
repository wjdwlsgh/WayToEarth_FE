// utils/api/userJourneys.ts
// 목데이터 제거. 서버 연동 전까지는 명시적으로 미구현 에러를 던집니다.
import type { JourneyId, UserJourneyState } from "../../types/journey";

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
  throw new Error("여정 진행 시작 API 연동 필요");
}

export async function getState(
  _userId: string,
  _journeyId: JourneyId,
  _totalM: number,
  _nextLandmarkDistM: number
): Promise<ProgressResponse> {
  throw new Error("여정 진행 상태 조회 API 연동 필요");
}

export async function progress(
  _userId: string,
  _journeyId: JourneyId,
  _totalM: number,
  _deltaM: number
): Promise<ProgressResponse> {
  throw new Error("여정 진행 업데이트 API 연동 필요");
}
