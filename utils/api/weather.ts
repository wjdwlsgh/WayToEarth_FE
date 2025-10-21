import { client } from "./client";

export async function getCurrentWeather(lat: number, lon: number) {
  const { data } = await client.get("/v1/weather/current", {
    params: { lat, lon }
  });
  return data;
}
