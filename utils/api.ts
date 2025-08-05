import axios from "axios";
import { UserInfo } from "../types/user";

// ✅ ngrok 주소 — 백엔드 API 호출용
const BASE_URL = "https://8e86abeae0d8.ngrok-free.app";

export const kakaoLogin = async (code: string) => {
  const res = await axios.post(`${BASE_URL}/v1/kakao`, { code });
  return res.data;
};

export const checkNickname = async (nickname: string) => {
  const res = await axios.get(`${BASE_URL}/v1/users/check-nickname`, {
    params: { nickname },
  });
  return res.data;
};

export const registerUser = async (userInfo: UserInfo) => {
  const res = await axios.post(`${BASE_URL}/v1/users/register`, userInfo);
  return res.data;
};
