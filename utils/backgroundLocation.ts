// utils/backgroundLocation.ts
// Registers a background location task for Android/iOS using Expo TaskManager.
// The task runs even when the app is in background to keep the foreground service alive
// and to persist last known locations.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { distanceKm } from './geo';

export const WAY_LOCATION_TASK = 'WAY_BACKGROUND_LOCATION';

// Define task at module scope
TaskManager.defineTask(WAY_LOCATION_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.warn('[BG-LOC] task error:', error);
      return;
    }
    const locations = (data as Location.LocationUpdateEvent).locations;
    if (!locations?.length) return;
    const last = locations[locations.length - 1];
    const now = Date.now();

    // Persist a simple record for diagnostics
    const diag = {
      t: now,
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
      accuracy: last.coords.accuracy,
      speed: last.coords.speed,
    };
    await AsyncStorage.setItem('@last_bg_location', JSON.stringify(diag));

    // --- Background vibration/notification every X km ---
    // Settings
    const raw = (await AsyncStorage.getItem('@run_vibration_settings')) || '';
    let enabled = true;
    let intervalM = 1000; // default 1km
    try {
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s?.enabled === 'boolean') enabled = s.enabled;
        if (typeof s?.intervalM === 'number' && s.intervalM > 0) intervalM = s.intervalM;
      }
    } catch {}
    if (!enabled) return;

    // State
    const stateRaw = (await AsyncStorage.getItem('@run_vibration_state')) || '';
    let state: { lastLat?: number; lastLng?: number; accumM?: number; notifiedM?: number } = {};
    try { state = stateRaw ? JSON.parse(stateRaw) : {}; } catch {}

    const prevLat = state.lastLat;
    const prevLng = state.lastLng;
    const curLat = last.coords.latitude;
    const curLng = last.coords.longitude;
    const acc = last.coords.accuracy ?? 999;

    // Skip very poor accuracy to reduce false triggers
    if (acc > 65) return;

    let accum = state.accumM ?? 0;
    if (typeof prevLat === 'number' && typeof prevLng === 'number') {
      const dk = distanceKm({ latitude: prevLat, longitude: prevLng }, { latitude: curLat, longitude: curLng });
      const dm = dk * 1000;
      // Minimal movement threshold to avoid jitter (0.5m)
      if (dm >= 0.5) accum += dm;
    }

    // Notify in multiples of intervalM
    const notifiedM = state.notifiedM ?? 0;
    const nextTarget = Math.floor(notifiedM / intervalM + 1) * intervalM;
    if (accum + notifiedM >= nextTarget) {
      // Fire a local notification with vibration
      try {
        await notifee.createChannel({ id: 'running_session_popup', name: '러닝 진동 알림', importance: AndroidImportance.HIGH, vibration: true, vibrationPattern: [0, 400, 200, 400] });
      } catch {}
      const totalKm = ((notifiedM + accum) / 1000).toFixed(2);
      await notifee.displayNotification({
        title: `${(nextTarget / 1000).toFixed(1)}km 달성!`,
        body: `누적 거리 ${totalKm} km`,
        android: { channelId: 'running_session_popup', smallIcon: 'ic_launcher', vibrationPattern: [0, 300] },
        ios: { sound: 'default' },
      });
      // Move notified up to nextTarget, keep remainder in accum
      const overshoot = notifiedM + accum - nextTarget;
      state.notifiedM = nextTarget;
      accum = Math.max(0, overshoot);
    }

    // Save state
    state.lastLat = curLat;
    state.lastLng = curLng;
    state.accumM = accum;
    await AsyncStorage.setItem('@run_vibration_state', JSON.stringify(state));
  } catch (e) {
    console.warn('[BG-LOC] persist error:', e);
  }
});
