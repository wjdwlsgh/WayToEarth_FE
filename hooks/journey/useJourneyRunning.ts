// hooks/journey/useJourneyRunning.ts
// 여정 러닝 추적 훅 (싱글 러닝 + 여정 진행률 연동)

import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveRunTracker } from "../useLiveRunTracker";
import type { LatLng } from "../../types/types";
import type { JourneyId, Landmark } from "../../types/journey";
import * as userJourneysApi from "../../utils/api/userJourneys";

type JourneyLandmark = {
  id: string;
  name: string;
  position: LatLng;
  distance: string;
  distanceM: number;
  reached: boolean;
};

type UseJourneyRunningProps = {
  journeyId: JourneyId;
  userId: string;
  totalDistanceM: number;
  landmarks: JourneyLandmark[];
  journeyRoute: LatLng[];
};

export function useJourneyRunning({
  journeyId,
  userId,
  totalDistanceM,
  landmarks,
  journeyRoute,
}: UseJourneyRunningProps) {
  const runTracker = useLiveRunTracker();

  const [progressM, setProgressM] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [nextLandmark, setNextLandmark] = useState<JourneyLandmark | null>(null);
  const [reachedLandmarks, setReachedLandmarks] = useState<Set<string>>(new Set());

  const initialProgressM = useRef(0);
  const hasStarted = useRef(false);

  // 초기 진행률 로드
  useEffect(() => {
    const loadInitialProgress = async () => {
      try {
        // 랜드마크 기준으로 다음 랜드마크까지 거리 계산 (간소화)
        const nextLm = landmarks.find((lm) => !lm.reached);
        const nextLandmarkDistM = nextLm?.distanceM ?? 0;

        const progress = await userJourneysApi.getState(
          userId,
          journeyId,
          totalDistanceM,
          nextLandmarkDistM
        );

        initialProgressM.current = progress.progressM;
        setProgressM(progress.progressM);
        setProgressPercent(progress.percent);

        // 이미 도달한 랜드마크 표시
        const reached = new Set<string>();
        landmarks.forEach((lm) => {
          if (progress.progressM >= lm.distanceM) {
            reached.add(lm.id);
          }
        });
        setReachedLandmarks(reached);

        // 다음 랜드마크 설정
        const next = landmarks.find((lm) => progress.progressM < lm.distanceM);
        setNextLandmark(next || null);
      } catch (error) {
        console.error("진행률 로드 실패:", error);
      }
    };

    loadInitialProgress();
  }, [journeyId, userId, totalDistanceM, landmarks]);

  // 러닝 거리 변경 시 진행률 업데이트
  useEffect(() => {
    if (!runTracker.isRunning) return;

    const currentTotalM = initialProgressM.current + runTracker.distance * 1000;
    setProgressM(currentTotalM);
    setProgressPercent(
      totalDistanceM > 0 ? Math.min(100, (currentTotalM / totalDistanceM) * 100) : 0
    );

    // 랜드마크 도달 체크
    landmarks.forEach((lm) => {
      if (currentTotalM >= lm.distanceM && !reachedLandmarks.has(lm.id)) {
        setReachedLandmarks((prev) => new Set(prev).add(lm.id));
        // TODO: 랜드마크 도달 알림/축하 모달 표시
      }
    });

    // 다음 랜드마크 업데이트
    const next = landmarks.find((lm) => currentTotalM < lm.distanceM);
    setNextLandmark(next || null);
  }, [
    runTracker.isRunning,
    runTracker.distance,
    landmarks,
    totalDistanceM,
    reachedLandmarks,
  ]);

  // 러닝 시작
  const startJourneyRun = useCallback(async () => {
    if (hasStarted.current) return;

    try {
      // 여정 시작 (처음이면 API 호출)
      if (initialProgressM.current === 0) {
        await userJourneysApi.start(userId, journeyId);
      }

      hasStarted.current = true;
      runTracker.start();
    } catch (error) {
      console.error("여정 러닝 시작 실패:", error);
      throw error;
    }
  }, [userId, journeyId, runTracker]);

  // 러닝 완료 시 진행률 서버 업데이트
  const completeJourneyRun = useCallback(async () => {
    if (!runTracker.isRunning && !runTracker.isPaused) return;

    try {
      const deltaM = runTracker.distance * 1000;

      // 서버에 진행률 업데이트
      const nextLm = landmarks.find((lm) => progressM < lm.distanceM);
      const nextLandmarkDistM = nextLm?.distanceM ?? 0;

      await userJourneysApi.progress(
        userId,
        journeyId,
        totalDistanceM,
        deltaM
      );

      runTracker.stop();
      hasStarted.current = false;
    } catch (error) {
      console.error("여정 진행률 업데이트 실패:", error);
      throw error;
    }
  }, [
    userId,
    journeyId,
    totalDistanceM,
    progressM,
    landmarks,
    runTracker,
  ]);

  // 랜드마크에 reached 속성 추가
  const landmarksWithReached = landmarks.map((lm) => ({
    ...lm,
    reached: reachedLandmarks.has(lm.id),
  }));

  return {
    // 기본 러닝 추적 데이터
    ...runTracker,

    // 여정 관련 데이터
    progressM,
    progressPercent,
    nextLandmark,
    landmarksWithReached,

    // 여정 러닝 제어
    startJourneyRun,
    completeJourneyRun,
  };
}
