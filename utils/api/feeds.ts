import { client } from "./client";
import * as FileSystem from "expo-file-system";

export type FeedItem = {
  id: number;
  content: string;
  imageUrl?: string | null;
  likeCount: number;
  liked: boolean;
  nickname?: string;
  distance?: number;
};

type CreateFeedPayload = {
  runningRecordId: number | string; // ✅ 서버가 만든 실제 id
  content?: string;
  photoUrl?: string | null; // file:///... 또는 https://...
};

const guessMime = (nameOrUri: string) => {
  const ext = (nameOrUri.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
};

// presign → S3 PUT → public URL
async function ensureRemoteUrl(
  localOrRemote?: string | null
): Promise<string | null> {
  if (!localOrRemote) return null;
  if (/^https?:\/\//i.test(localOrRemote)) return localOrRemote;

  const fileUri = localOrRemote;
  const fileName = fileUri.split("/").pop() || "feed.jpg";
  const contentType = guessMime(fileName);
  const info = await FileSystem.getInfoAsync(fileUri);
  const size = typeof info?.size === "number" ? info.size : 0;
  if (size <= 0) throw new Error("파일 크기를 확인할 수 없습니다.");

  // 1) presign
  const { data: sign } = await client.post("/v1/files/presign/feed", {
    fileName,
    contentType,
    size,
  });

  const signedUrl =
    sign?.upload_url ?? sign?.signed_url ?? sign?.uploadUrl ?? sign?.signedUrl;
  const publicUrl = sign?.public_url ?? sign?.publicUrl;
  if (!signedUrl || !publicUrl) throw new Error("업로드 URL 발급 실패");

  // 2) S3 업로드
  const resUpload = await FileSystem.uploadAsync(signedUrl, fileUri, {
    httpMethod: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
    },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (!(resUpload.status === 200 || resUpload.status === 204)) {
    throw new Error(`S3 업로드 실패: ${resUpload.status}`);
  }

  return publicUrl as string;
}

export async function createFeed(
  payload: CreateFeedPayload
): Promise<FeedItem> {
  // 서버가 만든 진짜 record id만 허용
  const n = Number(payload.runningRecordId);
  if (!Number.isFinite(n)) {
    throw new Error("유효하지 않은 runningRecordId 입니다.");
  }

  const imageUrl = await ensureRemoteUrl(payload.photoUrl);

  const body = {
    runningRecordId: n, // ⬅️ 백엔드 DTO가 기대하는 이름/타입
    content: payload.content ?? "",
    imageUrl: imageUrl ?? null,
  };

  const { data } = await client.post("/v1/feeds", body); // JWT는 client 인터셉터로 자동 첨부
  return data as FeedItem;
}

export async function listFeeds(offset = 0, limit = 4): Promise<FeedItem[]> {
  const { data } = await client.get("/v1/feeds", { params: { offset, limit } });
  return Array.isArray(data) ? (data as FeedItem[]) : [];
}

export async function toggleFeedLike(
  feedId: number
): Promise<{ likeCount: number; liked: boolean }> {
  const { data } = await client.post(`/v1/feeds/${feedId}/like`);
  return data as { likeCount: number; liked: boolean };
}
