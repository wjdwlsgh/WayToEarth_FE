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
  onMessage?: (message: ChatMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useWebSocket = ({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnectingRef = useRef(false);

  const disconnect = useCallback(() => {
    console.log('WebSocket 연결 해제 시작');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    setConnectionError(null);
    console.log('WebSocket 연결 해제 완료');
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current || socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('이미 연결 중이거나 연결된 상태입니다');
      return;
    }

    if (!url || !token) {
      console.log('WebSocket 연결 대기 중:', { url: !!url, token: !!token });
      setConnectionError('URL 또는 토큰이 없습니다');
      return;
    }

    try {
      isConnectingRef.current = true;
      console.log('WebSocket 연결 시도:', url);
      console.log('토큰 길이:', token.length);
      console.log('토큰 앞부분:', token.substring(0, 20) + '...');

      // 🔒 보안 개선: Authorization 헤더 사용 (URL 쿼리 파라미터 대신)
      // React Native에서 헤더 지원이 제한적일 수 있으므로 두 가지 방법 모두 시도
      let socket;

      try {
        // 방법 1: Authorization 헤더 사용 (권장)
        socket = new WebSocket(url, [], {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('WebSocket 연결 - Authorization 헤더 사용');
      } catch (headerError) {
        console.log('Authorization 헤더 실패, Sec-WebSocket-Protocol 시도:', headerError);

        // 방법 2: Sec-WebSocket-Protocol 사용 (백업)
        const protocolToken = token.replace(/\./g, '_'); // 점(.)을 언더바로 치환
        socket = new WebSocket(url, [`Bearer.${protocolToken}`]);
        console.log('WebSocket 연결 - Sec-WebSocket-Protocol 사용');
      }

      socket.onopen = () => {
        console.log('WebSocket 연결 성공');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        onConnect?.();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('받은 메시지:', data);

          const message: ChatMessage = {
            id: data.messageId?.toString() || Date.now().toString(),
            message: data.message,
            messageType: data.messageType || 'TEXT',
            senderName: data.senderName || '알 수 없음',
            timestamp: data.timestamp || new Date().toISOString(),
            isOwn: data.senderId?.toString() === '1', // 현재 사용자 ID와 비교 (임시로 1 사용)
          };
          onMessage?.(message);
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket 연결 종료:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });

        setIsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;
        onDisconnect?.();

        // 인증 오류(1002, 1008)나 정상 종료(1000)가 아닌 경우만 재연결 시도
        if (event.code !== 1000 && event.code !== 1002 && event.code !== 1008 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`${timeout}ms 후 재연결 시도 (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, timeout);
        } else {
          if (event.code === 1002 || event.code === 1008) {
            setConnectionError('인증에 실패했습니다. 다시 로그인해주세요.');
          } else if (event.code === 1006) {
            setConnectionError('연결이 예기치 않게 끊어졌습니다.');
          } else {
            setConnectionError(`연결이 끊어졌습니다 (코드: ${event.code})`);
          }
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setConnectionError('연결 오류가 발생했습니다');
        isConnectingRef.current = false;
        onError?.(error);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setConnectionError('연결에 실패했습니다');
      isConnectingRef.current = false;
      onError?.(error);
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError]);

  const sendMessage = useCallback((message: string, messageType: 'TEXT' | 'ANNOUNCEMENT' = 'TEXT') => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setConnectionError('연결이 끊어졌습니다');
      return false;
    }

    try {
      const chatMessage = {
        message: message.trim(),
        messageType,
      };

      socketRef.current.send(JSON.stringify(chatMessage));
      return true;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setConnectionError('메시지 전송에 실패했습니다');
      return false;
    }
  }, []);

  useEffect(() => {
    if (url && token) {
      // 토큰 로드 후 약간의 지연을 두고 연결 시도
      const timer = setTimeout(() => {
        connect();
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
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [url, token]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
};