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

// running/types.ts
export interface LatLng {
  latitude: number;
  longitude: number;
}

// types/emblem.ts
export interface Achievement {
  emblem_id: string;
  name: string;
  description: string;
  image_url: string;
  owned: boolean;
  earned_at?: string;
}

export interface Summary {
  owned: number;
  total: number;
  /** 0~1 값 (예: 0.42) */
  completion_rate: number;
}

export type EmblemFilter = "전체" | "획득" | "미획득";

// upstream 타입 확장도 포함
declare module "expo-auth-session" {
  export interface AuthSessionRedirectUriOptions {
    useProxy?: boolean;
    scheme?: string;
    path?: string;
  }
}
