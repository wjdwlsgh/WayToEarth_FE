import * as AuthSession from "expo-auth-session";

// navigation/types.ts
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export interface UserInfo {
  nickname: string;
  location: string;
  age: string;
  runningDistance: string;
  gender: "male" | "female" | null;
}

declare module "expo-auth-session" {
  // 기존 타입 확장
  export interface AuthSessionRedirectUriOptions {
    /**
     * Whether to use the Expo proxy redirect.
     * This allows the redirect to go through `https://auth.expo.io`, which is useful for simulators.
     */
    useProxy?: boolean;
    scheme?: string;
    path?: string;
  }
}
