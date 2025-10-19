import { client } from "./client";
import * as FileSystem from "expo-file-system";

type PresignResponse = {
  upload_url: string;
  download_url: string;
  key: string;
  expires_in?: number;
};

export async function presignLandmarkImage(params: {
  journeyId: number | string;
  landmarkId: number | string;
  contentType: string;
  size: number;
}): Promise<PresignResponse> {
  const { journeyId, landmarkId, contentType, size } = params;
  const { data } = await client.post(
    `/v1/admin/landmarks/${journeyId}/${landmarkId}/image/presign`,
    { contentType, size }
  );
  return (data?.data ?? data) as PresignResponse;
}

export async function presignStoryImage(params: {
  journeyId: number | string;
  landmarkId: number | string;
  storyId: number | string;
  contentType: string;
  size: number;
}): Promise<PresignResponse> {
  const { journeyId, landmarkId, storyId, contentType, size } = params;
  const { data } = await client.post(
    `/v1/admin/story-cards/${journeyId}/${landmarkId}/${storyId}/image/presign`,
    { contentType, size }
  );
  return (data?.data ?? data) as PresignResponse;
}

export async function updateLandmarkImage(landmarkId: number | string, imageUrl: string) {
  // Some backends may expect PUT/PATCH with body { imageUrl }
  await client.put(`/v1/admin/landmarks/${landmarkId}`, { imageUrl });
}

export async function updateStoryImage(storyId: number | string, imageUrl: string) {
  await client.put(`/v1/admin/story-cards/${storyId}`, { imageUrl });
}

export async function uploadToS3(uploadUrl: string, fileUri: string, contentType: string) {
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || info.isDirectory) {
    throw new Error("로컬 파일을 찾을 수 없습니다.");
  }
  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: "PUT",
    headers: {
      "Content-Type": contentType,
      ...(typeof info.size === "number" ? { "Content-Length": String(info.size) } : {}),
    },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (!(res.status === 200 || res.status === 204)) {
    throw new Error(`S3 업로드 실패: ${res.status}`);
  }
}

export function guessImageMime(uriOrName: string): string {
  const name = (uriOrName.split("/").pop() || uriOrName).toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

