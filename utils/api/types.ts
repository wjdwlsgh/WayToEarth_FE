export type LatLng = { latitude: number; longitude: number };

export type RoutePoint = LatLng & {
  sequence?: number;
  t?: number;
  acc?: number;
};

export type UserInfo = { nickname: string; gender?: string; birth?: string };

export type PresignRequest = {
  contentType: string; // e.g. "image/jpeg" | "image/png"
  size: number; // bytes
};

export type PresignResponse = {
  upload_url: string;
  public_url: string;
  expires_in: number; // seconds
};

export type UploadResult = {
  /** CDN 등 공개 접근 가능한 URL */
  publicUrl: string;
};

// utils/api/types.ts
export interface CreateFeedPayload {
  runId?: number | string | null;
  title?: string | null;
  content: string;
  photoUrl?: string | null; // file:// or https://
}

export interface FeedItem {
  id: number;
  content: string | null;
  imageUrl: string | null;
  likeCount: number;
  liked: boolean;
  nickname?: string;
  distance?: number;
  createdAt?: string;
}
