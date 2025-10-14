import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SocketLike } from "../utils/realtime/socket";
import { createSocket } from "../utils/realtime/socket";

export type ChatMessage = {
  id: string;
  text: string;
  createdAt: number;
  userId: string;
  nickname: string;
  role: "ADMIN" | "MEMBER";
  pending?: boolean;
};

const keyOf = (crewId: string) => `crewChat:${crewId}`;

export function useCrewChat(crewId: string, seed?: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<SocketLike | null>(null);

  // load cache + connect socket
  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = await AsyncStorage.getItem(keyOf(crewId));
      if (mounted) {
        if (raw) setMessages(JSON.parse(raw));
        else if (seed && seed.length) {
          setMessages(seed);
          await AsyncStorage.setItem(keyOf(crewId), JSON.stringify(seed));
        }
      }

      // try to connect socket (optional)
      const s = await createSocket();
      if (!mounted) return;
      if (!s) return; // no socket.io-client installed; stay offline
      socketRef.current = s;
      s.on("connect", () => {
        s.emit("join", { room: `crew:${crewId}` });
      });
      s.on?.("connect_error", (err: any) => {
        console.log("[chat] connect_error", err?.message || err);
      });
      s.on?.("error", (err: any) => {
        console.log("[chat] error", err?.message || err);
      });
      s.on?.("disconnect", (reason: any) => {
        console.log("[chat] disconnect", reason);
      });
      s.on("message:new", (m: ChatMessage) => {
        setMessages((prev) => {
          const next = [...prev, m];
          AsyncStorage.setItem(keyOf(crewId), JSON.stringify(next));
          return next;
        });
      });
    })();
    return () => {
      mounted = false;
      socketRef.current?.disconnect?.();
      socketRef.current = null;
    };
  }, [crewId, JSON.stringify(seed || [])]);

  const send = useCallback(
    async (me: { id: string; nickname: string; role: "ADMIN" | "MEMBER" }, text: string) => {
      const t = text.trim();
      if (!t) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        text: t,
        createdAt: Date.now(),
        userId: me.id || "me",
        nickname: me.nickname || "나",
        role: me.role || "MEMBER",
        pending: true,
      };
      setMessages((prev) => {
        const next = [...prev, optimistic];
        AsyncStorage.setItem(keyOf(crewId), JSON.stringify(next));
        return next;
      });

      const s = socketRef.current;
      if (!s) return; // offline: stored locally only
      s.emit(
        "message:send",
        { room: `crew:${crewId}`, text: t, tempId },
        (ack: { id: string; createdAt: number }) => {
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === tempId ? { ...m, ...ack, pending: false } : m
            );
            AsyncStorage.setItem(keyOf(crewId), JSON.stringify(next));
            return next;
          });
        }
      );
    },
    [crewId]
  );

  const data = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  return { messages: data, send };
}
