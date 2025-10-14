import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export type RootParamList = Record<string, any>;

export const navigationRef = createNavigationContainerRef<RootParamList>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function navigateToLiveRun() {
  // Live run lives under MainTabs
  navigate('MainTabs', { screen: 'LiveRunningScreen' });
}

export function navigateToJourneyRun() {
  navigate('JourneyRunningScreen');
}

export function resetTo(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as never, params as never));
  }
}

