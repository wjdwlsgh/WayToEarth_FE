import axios from "axios";
import { UserInfo } from "../types/user";

const BASE_URL = "http://192.168.200.177:5000"; // 너의 로컬 서버 주소

export const kakaoLogin = async (code: string, redirectUri: string) => {
  const res = await axios.post(`${BASE_URL}/v1/kakao`, {
    code,
    redirectUri,
  });
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
