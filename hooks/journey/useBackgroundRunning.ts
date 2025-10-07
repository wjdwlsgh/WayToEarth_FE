// hooks/journey/useBackgroundRunning.ts
// Notifee를 사용한 백그라운드 러닝 세션 관리 (여정 러닝 + 일반 러닝 공용)
import { useEffect, useRef } from 'react';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const RUNNING_SESSION_KEY = '@running_session';
const NOTIFICATION_CHANNEL_ID = 'running_session';

export type RunningSessionType = 'journey' | 'general';

export type RunningSessionState = {
  type: RunningSessionType; // 여정 러닝 or 일반 러닝 구분
  journeyId?: string; // 여정 러닝일 경우에만
  journeyTitle?: string; // 여정 러닝일 경우에만
  sessionId: string; // 세션 고유 ID
  startTime: number;
  distanceKm: number;
  durationSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  reachedLandmarks?: string[]; // 여정 러닝일 경우에만
};

export function useBackgroundRunning() {
  const appState = useRef(AppState.currentState);
  const notificationId = useRef<string | null>(null);

  // 알림 채널 생성 (Android 필수)
  const createNotificationChannel = async () => {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: '러닝 세션',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  };

  // Foreground Service 시작 (백그라운드에서도 앱 실행 유지)
  const startForegroundService = async (session: RunningSessionState) => {
    try {
      await createNotificationChannel();

      // 여정 러닝 vs 일반 러닝 구분
      const title = session.type === 'journey' && session.journeyTitle
        ? `🏃 ${session.journeyTitle} 러닝 중`
        : `🏃 일반 러닝 중`;

      const body = session.type === 'journey'
        ? `진행 거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(session.durationSeconds)}`
        : `거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(session.durationSeconds)}`;

      const notificationIdResult = await notifee.displayNotification({
        id: 'running_session',
        title,
        body,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.WORKOUT,
          ongoing: true, // 스와이프로 삭제 불가
          autoCancel: false,
          showTimestamp: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          asForegroundService: true, // Foreground Service로 실행 (핵심!)
          color: '#00FF00',
          smallIcon: 'ic_launcher', // 앱 아이콘
        },
      });

      notificationId.current = notificationIdResult;
      console.log('Foreground service started:', notificationIdResult);
    } catch (error) {
      console.error('Failed to start foreground service:', error);
    }
  };

  // 시간 포맷 헬퍼 함수
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Foreground Service 업데이트
  const updateForegroundService = async (
    journeyTitle: string,
    distanceKm: number,
    progressPercent: number,
    nextLandmark?: string
  ) => {
    try {
      const body = nextLandmark
        ? `진행: ${distanceKm.toFixed(2)}km (${progressPercent.toFixed(1)}%) | 다음: ${nextLandmark}`
        : `진행 거리: ${distanceKm.toFixed(2)}km | 진행률: ${progressPercent.toFixed(1)}%`;

      await notifee.displayNotification({
        id: 'running_session',
        title: `🏃 ${journeyTitle} 러닝 중`,
        body,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.WORKOUT,
          ongoing: true,
          autoCancel: false,
          showTimestamp: true,
          asForegroundService: true,
          color: '#00FF00',
          smallIcon: 'ic_launcher',
        },
      });
    } catch (error) {
      console.error('Failed to update foreground service:', error);
    }
  };

  // Foreground Service 중지
  const stopForegroundService = async () => {
    try {
      await notifee.cancelNotification('running_session');
      await notifee.stopForegroundService();
      notificationId.current = null;
      console.log('Foreground service stopped');
    } catch (error) {
      console.error('Failed to stop foreground service:', error);
    }
  };

  // 세션 상태 저장
  const saveSession = async (session: RunningSessionState) => {
    try {
      await AsyncStorage.setItem(RUNNING_SESSION_KEY, JSON.stringify(session));
      console.log('✅ Running session saved:', {
        journeyTitle: session.journeyTitle,
        progressM: session.progressM,
        isRunning: session.isRunning,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // 세션 상태 로드
  const loadSession = async (): Promise<RunningSessionState | null> => {
    try {
      const sessionData = await AsyncStorage.getItem(RUNNING_SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        console.log('✅ Running session loaded:', {
          journeyTitle: session.journeyTitle,
          progressM: session.progressM,
          isRunning: session.isRunning,
        });
        return session;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return null;
  };

  // 세션 삭제
  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(RUNNING_SESSION_KEY);
      console.log('✅ Running session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  // 랜드마크 도달 알림
  const showLandmarkNotification = async (landmarkName: string) => {
    try {
      await notifee.displayNotification({
        title: `🎉 ${landmarkName} 도착!`,
        body: '랜드마크에 방명록을 남겨보세요.',
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500, 300],
          color: '#FFD700',
          smallIcon: 'ic_launcher',
        },
      });
    } catch (error) {
      console.error('Failed to show landmark notification:', error);
    }
  };

  // AppState 변경 감지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        console.log('📱 App moved to background');
      }
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App moved to foreground');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 초기화 시 채널 생성
  useEffect(() => {
    createNotificationChannel();
  }, []);

  return {
    startForegroundService,
    updateForegroundService,
    stopForegroundService,
    saveSession,
    loadSession,
    clearSession,
    showLandmarkNotification,
  };
}
