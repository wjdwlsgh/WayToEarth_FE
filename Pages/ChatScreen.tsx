import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";
import { useWebSocket, ChatMessage } from "../hooks/useWebSocket";
import { useChatHistory } from "../hooks/useChatHistory";

// WebSocket polyfill 확인
console.log('WebSocket 확인:');
console.log('- global.WebSocket:', !!global.WebSocket);
console.log('- window.WebSocket:', !!(global as any).window?.WebSocket);
console.log('- WebSocket:', !!WebSocket);

const { width } = Dimensions.get("window");

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState("");
  const [crewId] = useState(1);
  const [currentUserId] = useState(1); // TODO: 실제 사용자 ID로 변경
  const scrollViewRef = useRef<ScrollView>(null);
  const { activeTab, onTabPress } = useBottomNav("crew");
  const [token, setToken] = useState<string | null>(null);

  // 채팅 히스토리 관리
  const {
    messages,
    isLoading: isHistoryLoading,
    hasMore,
    error: historyError,
    unreadCount,
    crewInfo,
    loadInitialHistory,
    loadMoreMessages,
    loadUnreadCount,
    loadCrewInfo,
    markMessageAsRead,
    markAllMessagesAsRead,
    deleteMessage,
    addNewMessage,
    clearMessages
  } = useChatHistory({ crewId, currentUserId });

  const websocketUrl = token ? `wss://api.waytoearth.cloud/ws/crew/${crewId}/chat` : null;

  // JWT 토큰 로드
  useEffect(() => {
    let isMounted = true;

    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("jwtToken");
        if (!isMounted) return;

        if (storedToken) {
          setToken(storedToken);
          console.log('ChatScreen - 토큰 로드 완료', storedToken.substring(0, 20) + '...');

          // 토큰 payload 확인
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            console.log('토큰 payload:', payload);
            console.log('토큰 만료 시간:', new Date(payload.exp * 1000));
            console.log('현재 시간:', new Date());
            console.log('토큰 유효:', new Date(payload.exp * 1000) > new Date());
          } catch (e) {
            console.error('토큰 파싱 실패:', e);
          }
        } else {
          console.warn('ChatScreen - JWT 토큰이 없습니다');
        }
      } catch (error) {
        console.error('ChatScreen - 토큰 로드 오류:', error);
      }
    };

    loadToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const { isConnected, connectionError, sendMessage: sendWsMessage, disconnect } = useWebSocket({
    url: websocketUrl,
    token,
    onMessage: (newMessage) => {
      console.log('[ChatScreen] 새 메시지 수신:', newMessage);
      addNewMessage(newMessage);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onConnect: () => {
      console.log("채팅 연결됨");
    },
    onDisconnect: () => {
      console.log("채팅 연결 끊어짐");
    },
    onError: (error) => {
      console.error("채팅 오류:", error);
    },
  });

  // 토큰 로드 후 초기 히스토리 로드
  useEffect(() => {
    if (token && !isHistoryLoading && messages.length === 0) {
      console.log('초기 채팅 히스토리 로드 시작');
      loadInitialHistory();
    }
  }, [token, isHistoryLoading, messages.length, loadInitialHistory]);

  // 디버깅용: 상태 모니터링
  useEffect(() => {
    console.log('[ChatScreen] 상태 업데이트:', {
      unreadCount,
      messagesCount: messages.length,
      isHistoryLoading,
      isConnected,
      crewInfo: crewInfo ? {
        name: crewInfo.name,
        memberCount: crewInfo.memberCount
      } : null
    });
  }, [unreadCount, messages.length, isHistoryLoading, isConnected, crewInfo]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('ChatScreen 언마운트 - WebSocket 정리');
      disconnect();
      clearMessages();
    };
  }, [disconnect, clearMessages]);

  const handleSend = () => {
    const messageText = message.trim();
    if (!messageText) return;

    if (!isConnected) {
      console.warn("채팅 서버에 연결되지 않았습니다");
      return;
    }

    const success = sendWsMessage(messageText, "TEXT");
    if (success) {
      setMessage("");
    } else {
      console.warn("메시지 전송에 실패했습니다");
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Status Bar iPhone */}
      <View style={styles.statusBarIPhone}>
        <View style={styles.frame}>
          <View style={styles.time}>
            <Text style={styles.timeText}>9:41</Text>
          </View>
          <View style={styles.dynamicIslandSpacer} />
          <View style={styles.levels}>
            <View style={styles.cellularConnection} />
            <View style={styles.wifi} />
            <View style={styles.battery} />
          </View>
        </View>
      </View>

      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <Text style={styles.chatTitle}>
            {crewInfo ? `${crewInfo.name} 채팅` : '크루 채팅'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatHeaderRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={markAllMessagesAsRead}
            >
              <Text style={styles.markAllReadText}>모두 읽음</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <ActivityIndicator size="small" color="#3579d7" />
          <Text style={styles.connectionText}>
            {connectionError || "채팅 서버에 연결 중..."}
          </Text>
        </View>
      )}

      {/* History Loading */}
      {isHistoryLoading && (
        <View style={styles.historyLoadingContainer}>
          <ActivityIndicator size="small" color="#3579d7" />
          <Text style={styles.historyLoadingText}>메시지 불러오는 중...</Text>
        </View>
      )}

      {/* History Error */}
      {historyError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (messages.length === 0) {
                loadInitialHistory();
              } else {
                loadMoreMessages();
              }
            }}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Chat Area */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

            // 스크롤이 최상단에 도달했고, 더 로드할 메시지가 있을 때
            if (
              contentOffset.y <= 50 && // 상단에서 50px 이내
              hasMore &&
              !isHistoryLoading &&
              messages.length > 0
            ) {
              console.log('무한 스크롤: 이전 메시지 로드 시작');
              loadMoreMessages();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Load More Indicator */}
          {hasMore && messages.length > 0 && (
            <View style={styles.loadMoreContainer}>
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreMessages}
                disabled={isHistoryLoading}
              >
                {isHistoryLoading ? (
                  <ActivityIndicator size="small" color="#3579d7" />
                ) : (
                  <Text style={styles.loadMoreText}>이전 메시지 더보기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>채팅을 시작해보세요!</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const handleLongPress = () => {
                if (msg.isOwn && msg.id) {
                  Alert.alert(
                    "메시지 삭제",
                    "이 메시지를 삭제하시겠습니까?",
                    [
                      { text: "취소", style: "cancel" },
                      {
                        text: "삭제",
                        style: "destructive",
                        onPress: () => deleteMessage(parseInt(msg.id!))
                      }
                    ]
                  );
                }
              };

              const handlePress = () => {
                // 다른 사용자의 메시지이고 읽지 않았으면 읽음 처리
                if (!msg.isOwn && !msg.isRead && msg.id) {
                  markMessageAsRead(parseInt(msg.id));
                }
              };

              return (
                <View key={msg.id || index}>
                  {msg.messageType === 'SYSTEM' ? (
                    <View style={styles.systemMessageContainer}>
                      <Text style={styles.systemMessageText}>{msg.message}</Text>
                    </View>
                  ) : msg.isOwn ? (
                    // Own message (right side)
                    <TouchableOpacity
                      style={styles.responseContainer}
                      onLongPress={handleLongPress}
                      delayLongPress={500}
                    >
                      <View style={styles.responseBackground}>
                        <Text style={styles.responseText}>{msg.message}</Text>
                        <View style={styles.messageFooter}>
                          <Text style={styles.responseTime}>{formatTime(msg.timestamp)}</Text>
                          {msg.readByUsers !== undefined && msg.readByUsers > 0 && (
                            <Text style={styles.readCountText}>
                              읽음 {msg.readByUsers}
                              {crewInfo && ` / ${crewInfo.memberCount - 1}`} {/* 본인 제외 */}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    // Other's message (left side)
                    <TouchableOpacity
                      style={styles.messageContainer}
                      onPress={handlePress}
                    >
                      <Text style={styles.messageLabel}>{msg.senderName}</Text>
                      <View style={[
                        styles.messageBackgroundBorder,
                        !msg.isRead && styles.unreadMessageBorder
                      ]}>
                        <Text style={styles.messageText}>{msg.message}</Text>
                        <View style={styles.messageFooter}>
                          <Text style={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                          {!msg.isRead && (
                            <View style={styles.unreadIndicator}>
                              <Text style={styles.unreadIndicatorText}>N</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.textarea}>
            <TextInput
              style={styles.textInput}
              placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
              placeholderTextColor="#757575"
              value={message}
              onChangeText={setMessage}
              multiline={false}
              editable={isConnected}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // Status Bar
  statusBarIPhone: {
    backgroundColor: "#ffffff",
    paddingTop: 21,
    paddingHorizontal: 54,
    height: 51,
  },
  frame: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  time: {
    paddingHorizontal: 16,
    paddingLeft: 6,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    color: "#000000",
    textAlign: "center",
    fontFamily: "SF Pro",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  dynamicIslandSpacer: {
    width: 124,
    height: 10,
  },
  levels: {
    paddingHorizontal: 16,
    paddingRight: 6,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cellularConnection: {
    width: 19.2,
    height: 12.23,
    backgroundColor: "#000000",
  },
  wifi: {
    width: 17.14,
    height: 12.33,
    backgroundColor: "#000000",
  },
  battery: {
    width: 27.33,
    height: 13,
    backgroundColor: "#000000",
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Message containers
  messageContainer: {
    marginBottom: 16,
  },
  messageLabel: {
    color: "#718096",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 16,
  },
  messageBackgroundBorder: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: 234,
    minHeight: 68,
    padding: 16,
  },
  messageText: {
    color: "#2d3748",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  messageTime: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 8,
  },

  responseContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  responseBackground: {
    backgroundColor: "#3579d7",
    borderRadius: 15,
    width: 242,
    minHeight: 88,
    padding: 16,
    alignItems: "flex-end",
  },
  responseText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "right",
    lineHeight: 20,
  },
  responseTime: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "400",
    textAlign: "right",
    marginTop: 8,
  },

  // Input Area
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingBottom: 12,
  },
  textarea: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flex: 1,
    height: 60,
    justifyContent: "center",
  },
  textInput: {
    color: "#757575",
    fontSize: 14,
    fontWeight: "400",
    paddingHorizontal: 16,
    paddingVertical: 18,
    height: "100%",
  },
  sendButton: {
    backgroundColor: "#3579d7",
    borderRadius: 22,
    width: 56,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "600",
  },

  // Connection Status
  connectionStatus: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  connectionText: {
    color: "#f57c00",
    fontSize: 14,
    fontWeight: "500",
  },

  // Empty Chat
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyChatText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "500",
  },

  // System Messages
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessageText: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: "center",
  },

  // History Loading
  historyLoadingContainer: {
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  historyLoadingText: {
    color: "#3579d7",
    fontSize: 14,
    fontWeight: "500",
  },

  // Error Container
  errorContainer: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Load More
  loadMoreContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadMoreButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadMoreText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "500",
  },

  // Chat Header
  chatHeader: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  markAllReadButton: {
    backgroundColor: "#3579d7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllReadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Message Footer
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  readCountText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "400",
  },

  // Unread Messages
  unreadMessageBorder: {
    borderColor: "#3579d7",
    borderWidth: 2,
  },
  unreadIndicator: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicatorText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
});