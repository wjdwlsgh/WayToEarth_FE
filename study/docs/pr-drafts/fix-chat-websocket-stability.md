# PR: fix(chat): 채팅 화면 안정화 및 WebSocket 재연결/중복 처리 보강

- Branch: fix/chat-websocket-stability
- Base: main

## Summary
- ChatScreen 메시지 처리/에러 핸들링 개선
- useWebSocket 재연결/중복 이벤트 처리 강화

## Changes
- 중복 메시지/이벤트 처리 로직 추가
- 재연결 시 안정성 보강 및 오류 대응 개선

## Files
- Pages/ChatScreen.tsx
- hooks/useWebSocket.ts

## Checklist
- [ ] 재연결/중복 수신 재현 테스트
- [ ] 에러/로딩 상태 UX 확인

## PR Link
- https://github.com/wjdwlsgh/WayToEarth_FE/pull/new/fix/chat-websocket-stability

