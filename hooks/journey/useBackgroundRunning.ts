// hooks/journey/useBackgroundRunning.ts
// Notifee를 사용한 백그라운드 러닝 세션 관리 (여정 러닝 + 일반 러닝 공용)
import { useEffect, useRef } from 'react';
import notifee, { AndroidImportance, AndroidCategory, AuthorizationStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

const RUNNING_SESSION_KEY = '@running_session';
const ONGOING_CHANNEL_ID = 'running_session_ongoing';
const POPUP_CHANNEL_ID = 'running_session_popup';

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
  const bgNotiShownRef = useRef<boolean>(false);
  // 1회성 표시만 유지. ticker는 사용하지 않음(레거시 정리만).
  const bgTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSessionRef = useRef<RunningSessionState | null>(null);

  // 알림 권한 요청 (Android 13+)
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 13+ (API 33+)에서는 POST_NOTIFICATIONS 권한 필요
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('알림 권한이 거부되었습니다.');
          return false;
        }
      }

      // Notifee 권한 확인
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  };

  // 알림 채널 생성 (Android 필수) - 백업 용도로 남겨둠
  const createNotificationChannels = async () => {
    try {
      await notifee.createChannel({
        id: ONGOING_CHANNEL_ID,
        name: '러닝 진행(무음)',
        importance: AndroidImportance.DEFAULT,
        vibration: false,
      });
      await notifee.createChannel({
        id: POPUP_CHANNEL_ID,
        name: '러닝 시작 알림',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      });
    } catch {}
  };

  // 내부: 현재 세션으로 알림 본문 구성 후 표시
  const renderOngoing = async (session: RunningSessionState, effectiveDurationSec?: number) => {
    try {
      // 여정 러닝 vs 일반 러닝 구분
      const title = session.type === 'journey' && session.journeyTitle
        ? `🏃 ${session.journeyTitle} 러닝 중`
        : `🏃 일반 러닝 중`;

      // 진행 시간은 startTime 기준(일시정지면 전달값/세션값 유지)
      let dur = session.durationSeconds;
      if (!session.isPaused) {
        dur = Math.max(0, Math.floor((Date.now() - session.startTime) / 1000));
      }
      if (typeof effectiveDurationSec === 'number') dur = effectiveDurationSec;
      const body = session.type === 'journey'
        ? `진행 거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(dur)}`
        : `거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(dur)}`;

      // Channels are pre-created at app start; do not await here to avoid delays
      createNotificationChannels();
      const notificationIdResult = await notifee.displayNotification({
        id: 'running_session',
        title,
        body,
        android: {
          channelId: ONGOING_CHANNEL_ID,
          importance: AndroidImportance.DEFAULT,
          category: AndroidCategory.WORKOUT,
          ongoing: true, // 스와이프로 삭제 불가
          autoCancel: false,
          onlyAlertOnce: true,
          showTimestamp: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          asForegroundService: true, // Foreground Service로 실행 (핵심!)
          color: session.isPaused ? '#FFA500' : '#00FF00',
          smallIcon: 'ic_launcher', // 앱 아이콘
        },
      });
      notificationId.current = notificationIdResult;
    } catch (error) {
      console.error('Failed to start foreground service:', error);
    }
  };

  // 내부: 백그라운드 지속 알림을 1회 표시하고, 시간만 초단위 갱신
  const showBackgroundOngoing = async (session: RunningSessionState) => {
    lastSessionRef.current = session;
    // 즉시 1회 표시
    renderOngoing(session).catch(() => {});
    // 동시에 헤드업 1회 알림(짧게 표시 후 자동 취소)
    try {
      const title = session.type === 'journey' && session.journeyTitle
        ? `🏃 ${session.journeyTitle} 러닝 시작`
        : `🏃 일반 러닝 시작`;
      const dur = session.isPaused
        ? session.durationSeconds
        : Math.max(0, Math.floor((Date.now() - session.startTime) / 1000));
      const body = session.type === 'journey'
        ? `진행 거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(dur)}`
        : `거리: ${session.distanceKm.toFixed(2)}km | 시간: ${formatDuration(dur)}`;

      await notifee.displayNotification({
        id: 'running_popup',
        title,
        body,
        android: {
          channelId: POPUP_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.WORKOUT,
          autoCancel: true,
          onlyAlertOnce: true,
          showTimestamp: true,
          lightUpScreen: true,
          // 짧게 표시 후 자동 종료(일부 기기에서만 동작). 보조로 setTimeout 취소 처리.
          timeoutAfter: 2500,
          smallIcon: 'ic_launcher',
        },
      });
      setTimeout(() => {
        notifee.cancelNotification('running_popup').catch(() => {});
      }, 3000);
    } catch {}
    bgNotiShownRef.current = true;
    // 조용한 진행 카드 시간/거리 갱신(무음 채널, 동일 ID 업데이트)
    if (bgTickerRef.current) clearInterval(bgTickerRef.current);
    bgTickerRef.current = setInterval(() => {
      const s = lastSessionRef.current;
      if (!s) return;
      // distanceKm은 updateForegroundService에서 최신 값으로 갱신됨
      // 시간은 startTime 기준으로 계산(일시정지 시 고정)
      const eff = s.isPaused
        ? s.durationSeconds
        : Math.max(0, Math.floor((Date.now() - s.startTime) / 1000));
      renderOngoing({ ...s }, eff).catch(() => {});
    }, 1000);
  };

  // Foreground Service 시작 (요청 시점에 앱이 백그라운드일 때만 1회 표시)
  const startForegroundService = async (session: RunningSessionState, isBackground: boolean = false) => {
    // 세션 저장은 비동기로 처리해 표시를 지연시키지 않음
    saveSession(session).catch(() => {});
    if (Platform.OS !== 'android') return;
    // 권한 확인은 러닝 시작 시점에서 수행됨. 여기서는 지연 없이 표시만 시도.
    // 앱이 백그라운드일 때만 표시, 이미 표시했다면 무시
    if (((isBackground || appState.current === 'background') && !bgNotiShownRef.current)) {
      showBackgroundOngoing(session);
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
  const updateForegroundService = async (session: RunningSessionState, nextLandmark?: string) => {
    // 세션만 갱신하고, 백그라운드 틱커가 제목/본문을 갱신
    await saveSession(session);
    lastSessionRef.current = session;
  };

  // Foreground Service 중지
  const stopForegroundService = async () => {
    try {
      await notifee.cancelNotification('running_session');
      await notifee.cancelNotification('running_popup');
      await notifee.stopForegroundService();
      notificationId.current = null;
      bgNotiShownRef.current = false;
      if (bgTickerRef.current) {
        clearInterval(bgTickerRef.current);
        bgTickerRef.current = null;
      }
    } catch (error) {
      console.error('Failed to stop foreground service:', error);
    }
  };

  // 세션 상태 저장
  const saveSession = async (session: RunningSessionState) => {
    try {
      await AsyncStorage.setItem(RUNNING_SESSION_KEY, JSON.stringify(session));
      // 과도한 로그 방지: 필요 시 디버깅에서만 활성화
      // console.log('✅ Running session saved:', { isRunning: session.isRunning });
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
          channelId: POPUP_CHANNEL_ID,
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
        // 앱이 백그라운드로 갈 때 최근 세션 정보를 읽어 1회성 알림 표시
        (async () => {
          try {
            const s = await loadSession();
            if (s?.isRunning) {
              await startForegroundService(s, true);
            }
          } catch {}
        })();
      }
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 포그라운드 복귀 시 알림/서비스 정리
        stopForegroundService();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 초기화 시 채널 생성
  useEffect(() => {
    createNotificationChannels();
  }, []);

  return {
    requestNotificationPermission,
    startForegroundService,
    updateForegroundService,
    stopForegroundService,
    saveSession,
    loadSession,
    clearSession,
    showLandmarkNotification,
  };
}
