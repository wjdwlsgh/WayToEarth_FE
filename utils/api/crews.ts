import { client, mockEnabled as globalMockEnabled } from "./client";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Crew = {
  id: string;
  name: string;
  description: string;
  progress: string; // e.g., "12/50"
  imageUrl?: string | null;
  role?: CrewRole; // 내 역할 (ADMIN|MEMBER)
};

const MY_CREW_KEY = "myCrew";
const MY_CREW_DETAIL_KEY = "myCrewDetail";

export type CrewRole = "ADMIN" | "MEMBER";
export type CrewMember = { id: string; nickname: string; role: CrewRole };
export type CrewApplicant = { id: string; nickname: string };
export type CrewDetail = {
  crew: Crew;
  role: CrewRole;
  members: CrewMember[];
  pending: CrewApplicant[]; // 가입 신청 목록 (관리자 전용)
};

// 크루 전용 Mock 플래그: app.config.js의 extra.crewMockEnabled 또는 EXPO_PUBLIC_CREW_MOCK=1
const extra: any = (Constants?.expoConfig as any)?.extra ?? {};
const mockEnabled =
  Boolean(extra?.crewMockEnabled) ||
  (typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_CREW_MOCK === "1") ||
  Boolean(globalMockEnabled);

// Mock helpers
async function getMockMyCrew(): Promise<Crew | null> {
  const raw = await AsyncStorage.getItem(MY_CREW_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Crew;
  } catch {
    return null;
  }
}

async function setMockMyCrew(crew: Crew | null): Promise<void> {
  if (!crew) return AsyncStorage.removeItem(MY_CREW_KEY);
  return AsyncStorage.setItem(MY_CREW_KEY, JSON.stringify(crew));
}

async function getMockMyCrewDetail(): Promise<CrewDetail | null> {
  const raw = await AsyncStorage.getItem(MY_CREW_DETAIL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrewDetail;
  } catch {
    return null;
  }
}

async function setMockMyCrewDetail(detail: CrewDetail | null): Promise<void> {
  if (!detail) return AsyncStorage.removeItem(MY_CREW_DETAIL_KEY);
  return AsyncStorage.setItem(MY_CREW_DETAIL_KEY, JSON.stringify(detail));
}

// 멤버 관리: 권한 부여/해제 (Mock)
async function mockPromoteMember(userId: string): Promise<void> {
  const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
  if (!detail) return;
  detail.members = detail.members.map((m) =>
    m.id === userId ? { ...m, role: "ADMIN" } : m
  );
  await setMockMyCrewDetail(detail);
}

async function mockDemoteMember(userId: string): Promise<void> {
  const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
  if (!detail) return;
  detail.members = detail.members.map((m) =>
    m.id === userId ? { ...m, role: "MEMBER" } : m
  );
  await setMockMyCrewDetail(detail);
}

async function mockCloseCrew(): Promise<void> {
  await setMockMyCrew(null);
  await setMockMyCrewDetail(null);
}

async function mockLeaveCrew(): Promise<void> {
  // 멤버가 크루를 떠나는 경우: 내 크루/디테일을 초기화
  await setMockMyCrew(null);
  await setMockMyCrewDetail(null);
}

export async function getMyCrew(): Promise<Crew | null> {
  if (mockEnabled) return getMockMyCrew();
  const { data } = await client.get("/v1/crews/me");
  return (data ?? null) as Crew | null;
}

export async function getMyCrewDetail(): Promise<CrewDetail | null> {
  if (mockEnabled) {
    const my = await getMockMyCrew();
    if (!my) return null;
    let detail = await getMockMyCrewDetail();
    if (!detail) {
      detail = {
        crew: my,
        role: (my.role as CrewRole) || "ADMIN",
        members: [
          { id: "u1", nickname: "나", role: (my.role as CrewRole) || "ADMIN" },
          { id: "u2", nickname: "민수", role: "MEMBER" },
          { id: "u3", nickname: "지영", role: "MEMBER" },
        ],
        pending: [
          { id: "a1", nickname: "지원자-철수" },
          { id: "a2", nickname: "지원자-영희" },
        ],
      };
      await setMockMyCrewDetail(detail);
    }
    return detail;
  }
  const { data } = await client.get("/v1/crews/me/detail");
  return (data ?? null) as CrewDetail | null;
}

export async function listCrews(query?: string): Promise<Crew[]> {
  if (mockEnabled) {
    const items: Crew[] = [
      {
        id: "1",
        name: "1번 크루",
        description: "저희 크루는 건들 크루입니다",
        progress: "1/50",
      },
      {
        id: "2",
        name: "2번 크루",
        description: "함께 달려요",
        progress: "12/50",
      },
      {
        id: "3",
        name: "3번 크루",
        description: "주 3회 모여요",
        progress: "7/50",
      },
      {
        id: "4",
        name: "4번 크루",
        description: "주말 러닝",
        progress: "22/50",
      },
    ];
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }
  const { data } = await client.get("/v1/crews", { params: { q: query } });
  return (data ?? []) as Crew[];
}

export async function createCrew(payload: {
  name: string;
  description?: string;
}): Promise<Crew> {
  if (mockEnabled) {
    const newCrew: Crew = {
      id: String(Date.now()),
      name: payload.name.trim() || "내 크루",
      description: payload.description?.trim() || "함께 달려요",
      progress: "1/50",
      role: "ADMIN",
    };
    await setMockMyCrew(newCrew);
    await setMockMyCrewDetail({
      crew: newCrew,
      role: "ADMIN",
      members: [{ id: "u1", nickname: "나", role: "ADMIN" }],
      pending: [],
    });
    return newCrew;
  }
  const { data } = await client.post("/v1/crews", payload);
  return data as Crew;
}

export type JoinResult = { pending: true; crewId: string } | Crew;

export async function joinCrew(crew: Crew, message?: string): Promise<JoinResult> {
  if (mockEnabled) {
    // 모킹: 즉시 가입하지 않고, 관리자 승인 대기 상태로 처리
    // 1) 관리자가 보는 대기열에 신청 추가 (동일 디바이스에서 관리자 화면 데모 목적)
    const currentDetail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (currentDetail && String(currentDetail.crew.id) === String(crew.id)) {
      const nextNickname = `지원자-${Date.now().toString().slice(-4)}`;
      currentDetail.pending = [
        ...currentDetail.pending,
        { id: `app-${Date.now()}`, nickname: nextNickname },
      ];
      await setMockMyCrewDetail(currentDetail);
    }
    // 2) 내 상태는 '가입 대기중'으로만 표시하고, 실제 멤버 편입은 승인 시에 수행
    return { pending: true, crewId: crew.id };
  }
  const { data } = await client.post(`/v1/crews/${crew.id}/join`, message ? { message } : undefined);
  return (data ?? crew) as JoinResult;
}

export async function removeMember(userId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.members = detail.members.filter((m) => m.id !== userId);
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.post(`/v1/crews/members/${userId}/remove`);
}

export async function approveRequest(applicantId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    const idx = detail.pending.findIndex((p) => p.id === applicantId);
    if (idx >= 0) {
      const [a] = detail.pending.splice(idx, 1);
      detail.members.push({ id: a.id, nickname: a.nickname, role: "MEMBER" });
      await setMockMyCrewDetail(detail);
    }
    return;
  }
  await client.post(`/v1/crews/applicants/${applicantId}/approve`);
}

export async function rejectRequest(applicantId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.pending = detail.pending.filter((p) => p.id !== applicantId);
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.post(`/v1/crews/applicants/${applicantId}/reject`);
}

// 권한 부여/회수 및 폐쇄
export async function promoteMember(userId: string): Promise<void> {
  if (mockEnabled) return mockPromoteMember(userId);
  await client.post(`/v1/crews/members/${userId}/promote`);
}

export async function demoteMember(userId: string): Promise<void> {
  if (mockEnabled) return mockDemoteMember(userId);
  await client.post(`/v1/crews/members/${userId}/demote`);
}

export async function closeCrew(): Promise<void> {
  if (mockEnabled) return mockCloseCrew();
  await client.post(`/v1/crews/close`);
}

// 멤버 탈퇴
export async function leaveCrew(): Promise<void> {
  if (mockEnabled) return mockLeaveCrew();
  await client.post(`/v1/crews/leave`);
}

// 운영진 권한 이임(소유권 이전): 선택한 멤버를 ADMIN으로, 나머지는 MEMBER로 정규화
export async function transferOwnership(userId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.members = detail.members.map((m) => ({ ...m, role: m.id === userId ? "ADMIN" : "MEMBER" }));
    // 현재 뷰 사용자의 role도 MEMBER로 강등되는 상황을 반영(단일 디바이스 데모)
    detail.role = "MEMBER";
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.post(`/v1/crews/members/${userId}/transfer-ownership`);
}
