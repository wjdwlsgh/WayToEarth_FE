import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { UserProfile } from "../utils/api/users";
import { getMyProfile } from "../utils/api/users";
import { useCrewChat, type ChatMessage } from "../hooks/useCrewChat";

type Params = {
  CrewChat: { crewId: string; crewName: string };
};

// UI-only formatting lives here; transport is in useCrewChat

export default function CrewChatScreen() {
  const route = useRoute<RouteProp<Params, "CrewChat">>();
  const navigation = useNavigation<any>();
  const { crewId, crewName } = route.params || { crewId: "0", crewName: "크루" };

  const [me, setMe] = useState<UserProfile | null>(null);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const seed = useMemo(() => {
    const now = Date.now();
    return [
      { id: `m1`, text: "오늘 한강에서 같이 뛸 사람?", createdAt: now - 5*60*1000, userId: "u2", nickname: "김철수", role: "MEMBER" as const },
      { id: `m2`, text: "저 참여할게요! 몇 시에 만날까요?", createdAt: now - 4*60*1000, userId: "me", nickname: "나", role: "MEMBER" as const },
      { id: `m3`, text: "6시 반에 잠실대교 어떠세요?", createdAt: now - 3*60*1000, userId: "u3", nickname: "이영희", role: "ADMIN" as const },
      { id: `m4`, text: "좋아요! 그럼 6시 반에 봐요 👍", createdAt: now - 2*60*1000, userId: "me", nickname: "나", role: "MEMBER" as const },
    ] as ChatMessage[];
  }, []);
  const { messages, send } = useCrewChat(String(crewId), seed);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile();
        setMe(p);
      } catch {}
    })();
  }, []);

  // messages state comes from useCrewChat

  const isMe = useCallback(
    (m: ChatMessage) => {
      const myId = me?.id != null ? String(me.id) : "";
      return m.userId === "me" || (myId && m.userId === myId) || m.nickname === "나";
    },
    [me]
  );

  const onSend = useCallback(async () => {
    const profile = me
      ? { id: String(me.id ?? "me"), nickname: "나", role: "MEMBER" as const }
      : { id: "me", nickname: "나", role: "MEMBER" as const };
    await send(profile, input);
    setInput("");
    listRef.current?.scrollToEnd({ animated: true });
  }, [me, input, send]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = isMe(item);
      return (
        <View style={{ marginBottom: 14 }}>
          {/* 이름 색상: ADMIN/매니저는 포인트 컬러 */}
          <Text
            style={{
              alignSelf: mine ? "flex-end" : "flex-start",
              color: mine ? "#4A7FE8" : item.role === "ADMIN" ? "#3B82F6" : "#6B7280",
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            {mine ? "나" : item.nickname}
          </Text>
          <View
            style={[
              s.bubble,
              mine ? s.bubbleMe : s.bubbleOther,
              { alignSelf: mine ? "flex-end" : "flex-start" },
            ]}
          >
            <Text style={mine ? s.bubbleTextMe : s.bubbleTextOther}>{item.text}</Text>
          </View>
          <Text
            style={{
              alignSelf: mine ? "flex-end" : "flex-start",
              color: "#9CA3AF",
              fontSize: 11,
              marginTop: 6,
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      );
    },
    [isMe]
  );

  const data = useMemo(() => messages.sort((a, b) => a.createdAt - b.createdAt), [messages]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{crewName}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={10}
      >
        <FlatList
          ref={listRef}
          contentContainerStyle={s.list}
          data={data}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={onSend}>
            <Ionicons name="send-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = `${d.getMinutes()}`.padStart(2, "0");
  const ampm = h >= 12 ? "오후" : "오전";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hh}:${m}`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  list: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleMe: { backgroundColor: "#4A7FE8" },
  bubbleOther: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  bubbleTextMe: { color: "#fff", fontSize: 15, lineHeight: 20 },
  bubbleTextOther: { color: "#111", fontSize: 15, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    color: "#111",
    backgroundColor: "#fff",
  },
  sendBtn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4A7FE8",
    alignItems: "center",
    justifyContent: "center",
  },
});
