import React, { useEffect, useRef, useState } from "react";
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
import BottomNavigation, {
  BOTTOM_NAV_MIN_HEIGHT,
} from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";
import { useWebSocket } from "../hooks/useWebSocket";
import { useChatHistory } from "../hooks/useChatHistory";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { getMyCrew } from "../utils/api/crews";

// WebSocket 존재 확인 로그 (디버그)
console.log("WebSocket 확인:");
console.log("- global.WebSocket:", !!(global as any).WebSocket);
// @ts-ignore
console.log("- WebSocket:", !!WebSocket);

const { width } = Dimensions.get("window");

export default function ChatScreen({ navigation, route: propRoute }: any) {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [crewId, setCrewId] = useState<number | null>(
    (route as any)?.params?.crewId ?? propRoute?.params?.crewId ?? null
  );
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { activeTab, onTabPress } = useBottomNav("crew");
  const [token, setToken] = useState<string | null>(null);

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
    clearMessages,
  } = useChatHistory({
    crewId: crewId ?? 0,
    currentUserId: currentUserId ?? undefined,
  });

  // 토큰은 헤더로, URL에는 포함하지 않음
  const websocketUrl = crewId
    ? `wss://api.waytoearth.cloud/ws/crew/${crewId}/chat`
    : null;

  // JWT 토큰 로드 및 사용자 ID 추출 시도
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("jwtToken");
        if (!isMounted) return;
        if (storedToken) {
          setToken(storedToken);
          try {
            const parts = storedToken.split(".");
            if (parts.length === 3) {
              // atob가 없는 환경 대비 try/catch
              let payloadJson: any = null;
              try {
                // @ts-ignore
                const decoded = (global as any).atob
                  ? (global as any).atob(parts[1])
                  : Buffer.from(parts[1], "base64").toString("utf-8");
                payloadJson = JSON.parse(decoded);
              } catch {}
              const uid =
                payloadJson?.userId ??
                payloadJson?.id ??
                (payloadJson?.sub ? parseInt(payloadJson.sub, 10) : null);
              if (typeof uid === "number" && !Number.isNaN(uid))
                setCurrentUserId(uid);
            }
          } catch {}
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // crewId 결정: route -> 저장된 값 -> 내 크루 1개 조회
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (crewId != null) {
        try {
          await AsyncStorage.setItem("@selected_crew_id", String(crewId));
        } catch {}
        return;
      }
      try {
        const saved = await AsyncStorage.getItem("@selected_crew_id");
        if (!cancelled && saved && !Number.isNaN(parseInt(saved, 10))) {
          setCrewId(parseInt(saved, 10));
          return;
        }
      } catch {}
      try {
        const mine = await getMyCrew();
        if (!cancelled && mine?.id) {
          setCrewId(parseInt(String(mine.id), 10));
          try {
            await AsyncStorage.setItem("@selected_crew_id", String(mine.id));
          } catch {}
        }
      } catch (e) {
        console.warn("[ChatScreen] 내 크루 조회 실패:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [(route as any)?.params?.crewId, propRoute?.params?.crewId]);

  const {
    isConnected,
    connectionError,
    sendMessage: sendWsMessage,
    disconnect,
  } = useWebSocket({
    url: token && websocketUrl ? websocketUrl : null,
    token,
    onMessage: (newMessage) => {
      addNewMessage(newMessage);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    },
  });

  // 초기 히스토리 로드 (토큰, crewId 준비 후 1회)
  const initialRequestedRef = useRef(false);
  useEffect(() => {
    initialRequestedRef.current = false;
  }, [crewId]);
  useEffect(() => {
    if (!token || !crewId) return;
    if (initialRequestedRef.current) return;
    if (isHistoryLoading) return;
    initialRequestedRef.current = true;
    loadInitialHistory();
    loadCrewInfo();
    loadUnreadCount();
  }, [
    token,
    crewId,
    isHistoryLoading,
    loadInitialHistory,
    loadCrewInfo,
    loadUnreadCount,
  ]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
      clearMessages();
    };
  }, [disconnect, clearMessages]);

  const handleSend = () => {
    const messageText = message.trim();
    if (!messageText) return;
    if (!isConnected) return;
    const ok = sendWsMessage(messageText, "TEXT");
    if (ok) setMessage("");
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 상단 상태바 스타일 (디자인 유지) */}
      <View
        style={[
          styles.statusBarIPhone,
          {
            paddingTop: Math.max(insets.top, 21),
            height: Math.max(insets.top, 21) + 30,
          },
        ]}
      >
        <View style={styles.frame}>
          <View style={styles.levels}>
            <View style={styles.cellularConnection} />
            <View style={styles.wifi} />
            <View style={styles.battery} />
          </View>
        </View>
      </View>

      {/* 헤더 */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <Text style={styles.chatTitle}>
            {crewInfo ? `${crewInfo.name} 채팅` : "크루 채팅"}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
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

      {/* 연결 상태 */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <ActivityIndicator size="small" color="#3579d7" />
          <Text style={styles.connectionText}>
            {connectionError || "채팅 서버에 연결 중..."}
          </Text>
        </View>
      )}

      {/* 히스토리 로딩 */}
      {isHistoryLoading && (
        <View style={styles.historyLoadingContainer}>
          <ActivityIndicator size="small" color="#3579d7" />
          <Text style={styles.historyLoadingText}>메시지 불러오는 중...</Text>
        </View>
      )}

      {/* 에러 표시 */}
      {historyError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (messages.length === 0) loadInitialHistory();
              else loadMoreMessages();
            }}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 본문 */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const { contentOffset } = e.nativeEvent;
            if (
              contentOffset.y <= 50 &&
              hasMore &&
              !isHistoryLoading &&
              messages.length > 0
            ) {
              loadMoreMessages();
            }
          }}
          scrollEventThrottle={400}
        >
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
              const onLong = () => {
                if (msg.isOwn && msg.id) {
                  Alert.alert("메시지 삭제", "이 메시지를 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: () => deleteMessage(parseInt(msg.id!)),
                    },
                  ]);
                }
              };
              const onPress = () => {
                if (!msg.isOwn && !msg.isRead && msg.id)
                  markMessageAsRead(parseInt(msg.id));
              };
              return (
                <View key={msg.id || index}>
                  {msg.messageType === "SYSTEM" ? (
                    <View style={styles.systemMessageContainer}>
                      <Text style={styles.systemMessageText}>
                        {msg.message}
                      </Text>
                    </View>
                  ) : msg.isOwn ? (
                    <TouchableOpacity
                      style={styles.responseContainer}
                      onLongPress={onLong}
                      delayLongPress={500}
                    >
                      <View style={styles.responseBackground}>
                        <Text style={styles.responseText}>{msg.message}</Text>
                        <View style={styles.messageFooter}>
                          <Text style={styles.responseTime}>
                            {formatTime(msg.timestamp)}
                          </Text>
                          {typeof msg.readByUsers === "number" && crewInfo && (
                            <Text style={styles.readCountText}>
                              읽음 {msg.readByUsers} /{" "}
                              {Math.max((crewInfo.memberCount ?? 1) - 1, 0)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.messageContainer}
                      onPress={onPress}
                    >
                      <Text style={styles.messageLabel}>{msg.senderName}</Text>
                      <View
                        style={[
                          styles.messageBackgroundBorder,
                          !msg.isRead && styles.unreadMessageBorder,
                        ]}
                      >
                        <Text style={styles.messageText}>{msg.message}</Text>
                        <View style={styles.messageFooter}>
                          <Text style={styles.messageTime}>
                            {formatTime(msg.timestamp)}
                          </Text>
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

        {/* 입력 영역: 하단 세이프에어리어 + 바텀탭 높이만큼 여백 */}
        <View
          style={[
            styles.inputContainer,
            { marginBottom: (insets.bottom || 0) + BOTTOM_NAV_MIN_HEIGHT + 8 },
          ]}
        >
          <View style={styles.textarea}>
            <TextInput
              style={styles.textInput}
              placeholder={
                isConnected ? "메시지를 입력하세요..." : "연결 중..."
              }
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
  wifi: { width: 17.14, height: 12.33, backgroundColor: "#000000" },
  battery: { width: 27.33, height: 13, backgroundColor: "#000000" },

  // Chat Container
  chatContainer: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },

  // Message containers
  messageContainer: { marginBottom: 16 },
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

  // Own message
  responseContainer: { alignItems: "flex-end", marginBottom: 16 },
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
  sendIcon: { fontSize: 24, color: "#ffffff", fontWeight: "600" },

  // Connection / status
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
  connectionText: { color: "#f57c00", fontSize: 14, fontWeight: "500" },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyChatText: { color: "#9ca3af", fontSize: 16, fontWeight: "500" },
  systemMessageContainer: { alignItems: "center", marginVertical: 8 },
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
  historyLoadingText: { color: "#3579d7", fontSize: 14, fontWeight: "500" },

  // Error
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
  errorText: { color: "#dc2626", fontSize: 14, fontWeight: "500", flex: 1 },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },

  // Load more
  loadMoreContainer: { alignItems: "center", paddingVertical: 12 },
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
  loadMoreText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },

  // Header
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
  chatHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatHeaderRight: { flexDirection: "row", alignItems: "center" },
  chatTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  markAllReadButton: {
    backgroundColor: "#3579d7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllReadText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },

  // Footer meta
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  readCountText: { color: "#9ca3af", fontSize: 10, fontWeight: "400" },
  unreadMessageBorder: { borderColor: "#3579d7", borderWidth: 2 },
  unreadIndicator: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicatorText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
});
