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
