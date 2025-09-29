import { useState, useCallback } from 'react';
import { chatAPI, ChatMessage as APIChatMessage } from '../utils/api/chat';
import { ChatMessage } from './useWebSocket';

interface UseChatHistoryProps {
  crewId: number;
  currentUserId?: number;
}

export const useChatHistory = ({ crewId, currentUserId }: UseChatHistoryProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // API 응답을 ChatMessage 형태로 변환
  const transformMessage = (apiMessage: APIChatMessage): ChatMessage => ({
    id: apiMessage.messageId.toString(),
    message: apiMessage.message,
    messageType: apiMessage.messageType,
    senderName: apiMessage.senderName,
    timestamp: apiMessage.sentAt, // API에서 sentAt으로 제공
    isOwn: currentUserId ? apiMessage.senderId === currentUserId : false,
    readByUsers: apiMessage.readByUsers,
    isRead: apiMessage.isRead,
  });

  // 초기 메시지 히스토리 로드
  const loadInitialHistory = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 최신 메시지들을 가져옴
      const historyData = await chatAPI.getRecentMessages({ crewId, limit: 30 });
      const transformedMessages = historyData
        .map(transformMessage)
        .reverse(); // 최신 메시지가 마지막에 오도록

      setMessages(transformedMessages);
      setHasMore(historyData.length === 30); // 30개 가져왔으면 더 있을 가능성

      // 읽지 않은 메시지 수도 함께 로드
      loadUnreadCount();
    } catch (err) {
      console.error('채팅 히스토리 로드 실패:', err);
      setError('메시지 히스토리를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [crewId, currentUserId, isLoading]);

  // 더 오래된 메시지 로드 (무한 스크롤용)
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore || messages.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // 현재 메시지 수를 기반으로 다음 페이지 계산
      const currentPage = Math.floor(messages.length / 50);

      const historyData = await chatAPI.getMessages({
        crewId,
        page: currentPage + 1,
        size: 50,
      });

      if (historyData.length === 0) {
        setHasMore(false);
        return;
      }

      const transformedMessages = historyData
        .map(transformMessage)
        .reverse(); // 시간순 정렬

      setMessages(prev => [...transformedMessages, ...prev]);
      setHasMore(historyData.length === 50);
    } catch (err) {
      console.error('이전 메시지 로드 실패:', err);
      setError('이전 메시지를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [crewId, messages, isLoading, hasMore]);

  // 읽지 않은 메시지 수 로드
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await chatAPI.getUnreadCount(crewId);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error('읽지 않은 메시지 수 로드 실패:', err);
    }
  }, [crewId]);

  // 단일 메시지 읽음 처리
  const markMessageAsRead = useCallback(async (messageId: number) => {
    try {
      await chatAPI.markMessageAsRead(crewId, messageId);

      // 로컬 상태 업데이트
      setMessages(prev => prev.map(msg =>
        msg.id === messageId.toString()
          ? { ...msg, isRead: true }
          : msg
      ));

      // 읽지 않은 메시지 수 업데이트
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('메시지 읽음 처리 실패:', err);
    }
  }, [crewId]);

  // 모든 메시지 읽음 처리
  const markAllMessagesAsRead = useCallback(async () => {
    if (messages.length === 0) return;

    try {
      const latestMessageId = parseInt(messages[messages.length - 1]?.id || '0');
      if (latestMessageId > 0) {
        await chatAPI.markAllMessagesAsReadAfter(crewId, latestMessageId);

        // 로컬 상태 업데이트
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('모든 메시지 읽음 처리 실패:', err);
    }
  }, [crewId, messages]);

  // 메시지 삭제
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await chatAPI.deleteMessage(crewId, messageId);

      // 로컬 상태에서 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== messageId.toString()));
    } catch (err) {
      console.error('메시지 삭제 실패:', err);
      throw err; // UI에서 에러 처리할 수 있도록
    }
  }, [crewId]);

  // 새 메시지 추가 (WebSocket에서 받은 메시지)
  const addNewMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);

    // 다른 사용자가 보낸 메시지면 읽지 않은 메시지 수 증가
    if (!message.isOwn) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setMessages([]);
    setHasMore(true);
    setError(null);
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isLoading,
    hasMore,
    error,
    unreadCount,
    loadInitialHistory,
    loadMoreMessages,
    loadUnreadCount,
    markMessageAsRead,
    markAllMessagesAsRead,
    deleteMessage,
    addNewMessage,
    clearMessages,
    setMessages,
  };
};