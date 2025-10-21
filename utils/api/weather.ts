import { client } from "./client";

export async function getCurrentWeather(lat: number, lon: number) {
  const response = await client.get("/v1/weather/current", {
    params: { lat, lon }
  });
  // 백엔드 응답 구조: { success: true, message: "...", data: { ... } }
  return response.data.data;
}
