// utils/backgroundLocation.ts
// Registers a background location task for Android/iOS using Expo TaskManager.
// The task runs even when the app is in background to keep the foreground service alive
// and to persist last known locations.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WAY_LOCATION_TASK = 'WAY_BACKGROUND_LOCATION';

// Define task at module scope
TaskManager.defineTask(WAY_LOCATION_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.warn('[BG-LOC] task error:', error);
      return;
    }
    // Expo SDK 53: data shape is { locations: LocationObject[] }
    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations || [];
    if (!locations?.length) return;
    const last = locations[locations.length - 1];
    // Persist a simple record for diagnostics or future sync
    const payload = {
      t: Date.now(),
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
      accuracy: last.coords.accuracy,
      speed: last.coords.speed,
    };
    await AsyncStorage.setItem('@last_bg_location', JSON.stringify(payload));
  } catch (e) {
    console.warn('[BG-LOC] persist error:', e);
  }
});
