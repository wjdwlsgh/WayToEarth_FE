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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";
import { useWebSocket, ChatMessage } from "../hooks/useWebSocket";

// WebSocket polyfill 확인
console.log('WebSocket 확인:');
console.log('- global.WebSocket:', !!global.WebSocket);
console.log('- window.WebSocket:', !!(global as any).window?.WebSocket);
console.log('- WebSocket:', !!WebSocket);

const { width } = Dimensions.get("window");

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [crewId] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  const { activeTab, onTabPress } = useBottomNav("crew");
  const [token, setToken] = useState<string | null>(null);

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
      setMessages(prev => [...prev, newMessage]);
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

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('ChatScreen 언마운트 - WebSocket 정리');
      disconnect();
    };
  }, [disconnect]);

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

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <ActivityIndicator size="small" color="#3579d7" />
          <Text style={styles.connectionText}>
            {connectionError || "채팅 서버에 연결 중..."}
          </Text>
        </View>
      )}

      {/* Main Chat Area */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>채팅을 시작해보세요!</Text>
            </View>
          ) : (
            messages.map((msg, index) => (
              <View key={msg.id || index}>
                {msg.messageType === 'SYSTEM' ? (
                  <View style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{msg.message}</Text>
                  </View>
                ) : msg.isOwn ? (
                  // Own message (right side)
                  <View style={styles.responseContainer}>
                    <View style={styles.responseBackground}>
                      <Text style={styles.responseText}>{msg.message}</Text>
                      <Text style={styles.responseTime}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                ) : (
                  // Other's message (left side)
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>{msg.senderName}</Text>
                    <View style={styles.messageBackgroundBorder}>
                      <Text style={styles.messageText}>{msg.message}</Text>
                      <Text style={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))
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
});