import { client, mockEnabled as globalMockEnabled } from "./client";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyProfile } from "./users";

export type Crew = {
  id: string;
  name: string;
  description: string;
  progress: string; // UI 표기용: "{currentMembers}/{maxMembers}"
  imageUrl?: string | null;
  role?: CrewRole; // OWNER를 ADMIN으로 매핑하여 UI 호환
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
  // 실제 API: 내가 속한 크루 목록(Page)
  const { data } = await client.get("/v1/crews/my", { params: { page: 0, size: 1 } });
  const page = data as any;
  const first = page?.content?.[0];
  if (!first) return null;
  return {
    id: String(first.id),
    name: String(first.name ?? "크루"),
    description: String(first.description ?? ""),
    progress: `${first.currentMembers ?? 0}/${first.maxMembers ?? 0}`,
    imageUrl: first.profileImageUrl ?? null,
  } as Crew;
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
          { id: "a1", nickname: "김러너" },
          { id: "a2", nickname: "박조거" },
        ],
      };
      await setMockMyCrewDetail(detail);
    } else if (!detail.pending || detail.pending.length === 0) {
      // 테스트 편의: 대기열이 비면 더미 신청자 한 명 추가
      const newAppId = `a${Date.now()}`;
      const newAppName = "신규 지원자";
      detail.pending = [{ id: newAppId, nickname: newAppName }];
      await setMockMyCrewDetail(detail);
    }
    return detail;
  }
  // 실제 API 조합: 내 크루 1개 기준으로 상세/멤버/대기열을 합성
  const my = await getMyCrew();
  if (!my) return null;

  const [detailRes, membersRes, pendingRes, me] = await Promise.all([
    client.get(`/v1/crews/${my.id}`),
    client.get(`/v1/crews/${my.id}/members`, { params: { page: 0, size: 100 } }),
    client.get(`/v1/crews/${my.id}/join-requests`, { params: { page: 0, size: 100 } }),
    getMyProfile().catch(() => null as any),
  ]);

  const d = detailRes.data as any; // CrewDetailResponse
  const membersPage = membersRes.data as any; // PageCrewMemberResponse
  const pendingPage = pendingRes.data as any; // PageJoinRequestResponse

  const role: CrewRole = (() => {
    const myId = me?.id != null ? Number(me.id) : undefined;
    const mine = membersPage?.content?.find((m: any) => Number(m.userId) === myId);
    // OWNER → ADMIN으로 매핑
    if (mine?.isOwner || mine?.role === "OWNER") return "ADMIN";
    return "MEMBER";
  })();

  const mapped: CrewDetail = {
    crew: {
      id: String(d.id),
      name: String(d.name ?? "크루"),
      description: String(d.description ?? ""),
      progress: `${d.currentMembers ?? 0}/${d.maxMembers ?? 0}`,
      imageUrl: d.profileImageUrl ?? null,
      role,
    },
    role,
    members: (membersPage?.content ?? []).map((m: any) => ({
      id: String(m.userId),
      nickname: String(m.userNickname ?? ""),
      role: m.isOwner || m.role === "OWNER" ? "ADMIN" : "MEMBER",
    })),
    pending: (pendingPage?.content ?? [])
      .filter((p: any) => p.status === "PENDING")
      .map((p: any) => ({ id: String(p.id), nickname: String(p.userNickname ?? "") })),
  };
  return mapped;
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
  // 실제 API: 목록 또는 검색
  if (query && query.trim().length > 0) {
    const { data } = await client.get("/v1/crews/search", {
      params: { keyword: query.trim(), page: 0, size: 20 },
    });
    const page = data as any;
    return (page?.content ?? []).map((c: any) => ({
      id: String(c.id),
      name: String(c.name ?? "크루"),
      description: String(c.description ?? ""),
      progress: `${c.currentMembers ?? 0}/${c.maxMembers ?? 0}`,
      imageUrl: c.profileImageUrl ?? null,
    })) as Crew[];
  }
  const { data } = await client.get("/v1/crews", { params: { page: 0, size: 20 } });
  const page = data as any;
  return (page?.content ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name ?? "크루"),
    description: String(c.description ?? ""),
    progress: `${c.currentMembers ?? 0}/${c.maxMembers ?? 0}`,
    imageUrl: c.profileImageUrl ?? null,
  })) as Crew[];
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
  const c = data as any;
  return {
    id: String(c.id),
    name: String(c.name ?? payload.name),
    description: String(c.description ?? payload.description ?? ""),
    progress: `${c.currentMembers ?? 1}/${c.maxMembers ?? 1}`,
    imageUrl: c.profileImageUrl ?? null,
    role: "ADMIN",
  } as Crew;
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
  // 실제 API: 가입 신청 생성 → 기본적으로 PENDING
  await client.post(`/v1/crews/${crew.id}/join-requests`, { message: message ?? "" });
  return { pending: true, crewId: crew.id } as JoinResult;
}

export async function removeMember(crewId: string, userId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.members = detail.members.filter((m) => m.id !== userId);
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.delete(`/v1/crews/${crewId}/members/${userId}`);
}

export async function approveRequest(requestId: string, note?: string): Promise<void> {
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
  await client.post(`/v1/crews/join-requests/${requestId}/approve`, { note: note ?? "" });
}

export async function rejectRequest(requestId: string, note?: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.pending = detail.pending.filter((p) => p.id !== applicantId);
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.post(`/v1/crews/join-requests/${requestId}/reject`, { note: note ?? "" });
}

// 권한 부여/회수 및 폐쇄
// 서버 스펙상 OWNER/MEMBER만 존재 → 승격은 소유권 이양으로 처리
export async function promoteMember(crewId: string, userId: string): Promise<void> {
  if (mockEnabled) return mockPromoteMember(userId);
  // 승격 = 소유권 이양 (UI 호환 목적)
  await client.post(`/v1/crews/${crewId}/transfer-ownership`, { newOwnerId: Number(userId) });
}

export async function demoteMember(crewId: string, userId: string): Promise<void> {
  if (mockEnabled) return mockDemoteMember(userId);
  await client.patch(`/v1/crews/${crewId}/members/${userId}/role`, { newRole: "MEMBER" });
}

export async function closeCrew(crewId: string): Promise<void> {
  if (mockEnabled) return mockCloseCrew();
  await client.delete(`/v1/crews/${crewId}`);
}

// 멤버 탈퇴
export async function leaveCrew(crewId: string): Promise<void> {
  if (mockEnabled) return mockLeaveCrew();
  await client.delete(`/v1/crews/${crewId}/members/leave`);
}

// 운영진 권한 이임(소유권 이전)
export async function transferOwnership(crewId: string, userId: string): Promise<void> {
  if (mockEnabled) {
    const detail = (await getMockMyCrewDetail()) as CrewDetail | null;
    if (!detail) return;
    detail.members = detail.members.map((m) => ({ ...m, role: m.id === userId ? "ADMIN" : "MEMBER" }));
    // 현재 뷰 사용자의 role도 MEMBER로 강등되는 상황을 반영(단일 디바이스 데모)
    detail.role = "MEMBER";
    await setMockMyCrewDetail(detail);
    return;
  }
  await client.post(`/v1/crews/${crewId}/transfer-ownership`, { newOwnerId: Number(userId) });
}
