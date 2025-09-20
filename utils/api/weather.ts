import { client, callOrMock, mockDelay } from "./client";

export async function getCurrentWeather(lat: number, lon: number) {
  return callOrMock(
    async () =>
      (await client.get("/v1/weather/current", { params: { lat, lon } })).data,
    async () => {
      await mockDelay();
      return {
        condition: "맑음",
        iconCode: "01d",
        emoji: "☀",
        fetchedAt: new Date().toISOString(),
        recommendation: "햇살 좋아요! 모자/선크림 챙기기 ☀",
      };
    }
  );
}
