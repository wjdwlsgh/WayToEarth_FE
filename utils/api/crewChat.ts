import { client } from "./client";

export type CrewChatMessage = {
  messageId: number;
  crewId: number;
  senderId: number;
  senderName: string;
  message: string;
  messageType: "TEXT" | "SYSTEM" | "ANNOUNCEMENT";
  sentAt: string;
  readCount?: number;
  read?: boolean;
};

export async function getRecentCrewMessages(crewId: string, limit = 20) {
  const { data } = await client.get(
    `/v1/crews/${crewId}/chat/messages/recent`,
    { params: { limit } }
  );
  // 서버 래퍼 언래핑은 client interceptor가 수행
  return (data ?? []) as CrewChatMessage[];
}

