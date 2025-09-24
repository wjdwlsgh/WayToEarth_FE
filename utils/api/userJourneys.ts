// utils/api/userJourneys.ts
// 유저별 여정 진행 상태 목 API
import type { JourneyId, UserJourneyState } from "../../types/journey";

type ProgressResponse = {
  progressM: number;
  lastLandmarkOrder: number;
  nextLandmarkDistM: number;
  percent: number;
  todayRunM: number;
  message: string;
};

const stateByUserJourney = new Map<string, UserJourneyState>();
const todayByUserJourney = new Map<string, number>(); // 간단 today delta 저장

function key(userId: string, journeyId: JourneyId) {
  return `${userId}::${journeyId}`;
}

function wait(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function start(userId: string, journeyId: JourneyId): Promise<UserJourneyState> {
  await wait();
  const k = key(userId, journeyId);
  const now = new Date().toISOString();
  const existing = stateByUserJourney.get(k);
  if (existing) return existing;
  const s: UserJourneyState = {
    userId,
    journeyId,
    progressM: 0,
    lastLandmarkOrder: 0,
    runsCount: 0,
    startedAt: now,
    completedAt: null,
  };
  stateByUserJourney.set(k, s);
  todayByUserJourney.set(k, 0);
  return s;
}

export async function getState(
  userId: string,
  journeyId: JourneyId,
  totalM: number,
  nextLandmarkDistM: number
): Promise<ProgressResponse> {
  await wait();
  const k = key(userId, journeyId);
  const s = stateByUserJourney.get(k);
  const today = todayByUserJourney.get(k) ?? 0;
  const progressM = s?.progressM ?? 0;
  const percent = totalM > 0 ? Math.min(100, (progressM / totalM) * 100) : 0;
  return {
    progressM,
    lastLandmarkOrder: s?.lastLandmarkOrder ?? 0,
    nextLandmarkDistM,
    percent,
    todayRunM: today,
    message: `오늘 ${(today / 1000).toFixed(2)}km를 뛰어 총 ${(progressM / 1000).toFixed(2)}km 진행`,
  };
}

export async function progress(
  userId: string,
  journeyId: JourneyId,
  totalM: number,
  deltaM: number
): Promise<ProgressResponse> {
  await wait();
  const k = key(userId, journeyId);
  const s = stateByUserJourney.get(k);
  if (!s) throw new Error("journey not started");
  const newProgress = Math.min(totalM, Math.max(0, (s.progressM ?? 0) + Math.max(0, deltaM)));
  s.progressM = newProgress;
  s.runsCount += 1;
  stateByUserJourney.set(k, s);
  const today = (todayByUserJourney.get(k) ?? 0) + Math.max(0, deltaM);
  todayByUserJourney.set(k, today);
  const percent = totalM > 0 ? Math.min(100, (newProgress / totalM) * 100) : 0;
  const remaining = Math.max(0, totalM - newProgress);
  return {
    progressM: newProgress,
    lastLandmarkOrder: s.lastLandmarkOrder,
    nextLandmarkDistM: remaining, // 간소화(실제는 세그먼트별 계산)
    percent,
    todayRunM: today,
    message: `오늘 ${(today / 1000).toFixed(2)}km를 뛰어 총 ${(newProgress / 1000).toFixed(2)}km 진행`,
  };
}

