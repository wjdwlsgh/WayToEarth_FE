import { client, callOrMock, mockDelay } from "./client";
import { RoutePoint } from "./types";

export function apiStartSession(payload?: {
  runningType?: "SINGLE" | "VIRTUAL";
}) {
  return callOrMock(
    async () => (await client.post("/v1/running/start", payload ?? {})).data,
    async () => {
      await mockDelay();
      return {
        sessionId: `local_${Date.now()}`,
        startedAt: new Date().toISOString(),
      };
    }
  );
}

export function apiUpdate(payload: {
  sessionId: string;
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSeconds: number | null;
  calories: number;
  currentPoint: RoutePoint & { sequence: number };
}) {
  return callOrMock(
    async () => (await client.post("/v1/running/update", payload)).data,
    async () => {
      await mockDelay();
      return { ack: true };
    }
  );
}

export function apiPause(payload: { sessionId: string }) {
  return callOrMock(
    async () => (await client.post("/v1/running/pause", payload)).data,
    async () => {
      await mockDelay();
      return { ack: true, status: "PAUSED" as const };
    }
  );
}

export function apiResume(payload: { sessionId: string }) {
  return callOrMock(
    async () => (await client.post("/v1/running/resume", payload)).data,
    async () => {
      await mockDelay();
      return { ack: true, status: "RUNNING" as const };
    }
  );
}

export function apiComplete(payload: {
  sessionId: string;
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSeconds: number | null;
  calories: number;
  routePoints: Array<
    Pick<RoutePoint, "latitude" | "longitude" | "t"> & { sequence: number }
  >;
  endedAt?: string;
  title?: string;
}) {
  return callOrMock(
    async () => (await client.post("/v1/running/complete", payload)).data,
    async () => {
      await mockDelay();
      return { runId: `local_${Date.now()}` };
    }
  );
}
