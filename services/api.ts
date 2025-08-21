import axios from "axios";

export const sendKakaoTokenToServer = async (code: string) => {
  const response = await axios.post("http://localhost:3001/api/auth/kakao", {
    code,
  });
  return response.data;
};
