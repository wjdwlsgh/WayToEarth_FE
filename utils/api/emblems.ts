// utils/api/emblems.ts
import { client } from "./client";
import type { Achievement, Summary } from "../../types/types";

export async function getEmblemSummary(): Promise<Summary> {
  const { data } = await client.get("/v1/emblems/me/summary");
  return data as Summary;
}

export async function getEmblemCatalog(params?: {
  filter?: "ALL" | "OWNED" | "UNOWNED";
  size?: number;
}) {
  const { data } = await client.get("/v1/emblems/catalog", {
    params: { filter: "ALL", size: 50, ...(params ?? {}) },
  });
  return data as Achievement[];
}
