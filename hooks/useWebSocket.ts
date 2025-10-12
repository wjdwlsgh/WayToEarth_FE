import { useEffect, useRef, useState, useCallback } from 'react';
import 'react-native-url-polyfill/auto';

export interface ChatMessage {
  id?: string;
  message: string;
  messageType: 'TEXT' | 'ANNOUNCEMENT' | 'SYSTEM';
  senderName?: string;
  timestamp?: string;
  isOwn?: boolean;
  readByUsers?: number;
  isRead?: boolean;
}

interface UseWebSocketProps {
  url: string | null;
  token: string | null;
  currentUserId?: number | null;
  onMessage?: (message: ChatMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useWebSocket = ({ url, token, currentUserId, onMessage, onConnect, onDisconnect, onError }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnectingRef = useRef(false);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      try { socketRef.current.close(1000, 'User disconnected'); } catch {}
      socketRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    setConnectionError(null);
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current || socketRef.current?.readyState === WebSocket.OPEN) return;
    if (!url || !token) {
      setConnectionError('URL 또는 토큰이 없습니다');
      return;
    }
    try {
      isConnectingRef.current = true;
      let socket: WebSocket;
      try {
        // @ts-ignore: RN impl may support headers
        socket = new WebSocket(url, [], { headers: { Authorization: `Bearer ${token}` } });
      } catch (_) {
        const protocolToken = token.replace(/\./g, '_');
        socket = new WebSocket(url, [`Bearer.${protocolToken}`]);
      }

      socket.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        onConnect?.();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse((event as any).data);
          const ts = data.timestamp || data.sentAt || new Date().toISOString();
          const type = data.messageType || 'TEXT';
          const sender = data.senderName || '알 수 없음';
          const message: ChatMessage = {
            id: data.messageId?.toString() || `${type}:${sender}:${ts}`,
            message: data.message,
            messageType: type,
            senderName: sender,
            timestamp: ts,
            isOwn: currentUserId != null ? String(data.senderId) === String(currentUserId) : false,
            readByUsers: data.readCount,
            isRead: data.read,
          };
          onMessage?.(message);
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
          onError?.(error);
        }
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;
        onDisconnect?.();
        if (event.code !== 1000 && event.code !== 1002 && event.code !== 1008 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, timeout);
        } else {
          if (event.code === 1002 || event.code === 1008) setConnectionError('인증에 실패했습니다. 다시 로그인해주세요.');
          else if (event.code === 1006) setConnectionError('연결이 예기치 않게 끊어졌습니다.');
          else setConnectionError(`연결이 끊어졌습니다 (코드: ${event.code})`);
        }
      };

      socket.onerror = (error) => {
        setConnectionError('연결 오류가 발생했습니다');
        isConnectingRef.current = false;
        onError?.(error);
      };

      socketRef.current = socket;
    } catch (error) {
      setConnectionError('연결에 실패했습니다');
      isConnectingRef.current = false;
      onError?.(error);
    }
  }, [url, token, currentUserId, onMessage, onConnect, onDisconnect, onError]);

  const sendMessage = useCallback((message: string, messageType: 'TEXT' | 'ANNOUNCEMENT' = 'TEXT') => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setConnectionError('연결이 끊어졌습니다');
      return false;
    }
    try {
      const payload = { message: message.trim(), messageType };
      socketRef.current.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setConnectionError('메시지 전송에 실패했습니다');
      return false;
    }
  }, []);

  useEffect(() => {
    if (url && token) {
      const timer = setTimeout(() => connect(), 1000);
      return () => clearTimeout(timer);
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        try { socketRef.current.close(1000, 'Component unmounted'); } catch {}
        socketRef.current = null;
      }
    };
  }, [url, token, connect]);

  return { isConnected, connectionError, connect, disconnect, sendMessage, reconnectAttempts: reconnectAttemptsRef.current };
};
      }, 1000);

      return () => clearTimeout(timer);
    }

    return () => {
      console.log('WebSocket useEffect cleanup');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        try { socketRef.current.close(1000, 'Component unmounted'); } catch {}
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [url, token]);

  return { isConnected, connectionError, connect, disconnect, sendMessage, reconnectAttempts: reconnectAttemptsRef.current };
  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
};
