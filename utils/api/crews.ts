import { client } from "./client";
import { getMyProfile } from "./users";

export type Crew = {
  id: string;
  name: string;
  description: string;
  progress: string; // UI 표기용: "{currentMembers}/{maxMembers}"
  imageUrl?: string | null;
  role?: CrewRole; // OWNER를 ADMIN으로 매핑하여 UI 호환
};

// Local mock storage keys removed – using only real API

export type CrewRole = "ADMIN" | "MEMBER";
export type CrewMember = { id: string; nickname: string; role: CrewRole };
export type CrewApplicant = { id: string; nickname: string };
export type CrewDetail = {
  crew: Crew;
  role: CrewRole;
  members: CrewMember[];
  pending: CrewApplicant[]; // 가입 신청 목록 (관리자 전용)
};

export async function getMyCrew(): Promise<Crew | null> {
  // 기본: 내가 속한 크루 1개 조회
  // 일부 환경에서 /v1/crews/my가 비정상일 수 있어 memberships/my로 폴백
  const [myRes, membershipsRes] = await Promise.all([
    client.get("/v1/crews/my", { params: { page: 0, size: 1 } }).catch(() => ({ data: null })),
    client.get("/v1/crews/memberships/my").catch(() => ({ data: [] })),
  ]);

  const page = myRes.data as any;
  const first = page?.content?.[0];
  if (first) {
    return {
      id: String(first.id),
      name: String(first.name ?? "크루"),
      description: String(first.description ?? ""),
      progress: `${first.currentMembers ?? 0}/${first.maxMembers ?? 0}`,
      imageUrl: first.profileImageUrl ?? null,
    } as Crew;
  }

  const memberships = (membershipsRes.data as any[]) || [];
  const active = memberships.find((m: any) => m?.status ? String(m.status).toUpperCase() === "ACTIVE" : true);
  if (!active) return null;
  // active 멤버십이 있으면 해당 크루 상세를 조회해 매핑
  const crewId = String(active.crewId ?? active?.crew?.id ?? "");
  if (!crewId) return null;
  try {
    const { data: d } = await client.get(`/v1/crews/${crewId}`);
    return {
      id: String(d.id),
      name: String(d.name ?? "크루"),
      description: String(d.description ?? ""),
      progress: `${d.currentMembers ?? 0}/${d.maxMembers ?? 0}`,
      imageUrl: d.profileImageUrl ?? null,
    } as Crew;
  } catch {
    // 상세 조회가 500/404 등으로 실패하면 현재 활성 크루가 없다고 간주
    return null;
  }
}

export async function getMyCrewDetail(): Promise<CrewDetail | null> {
  // 실제 API 조합: 내 크루 1개 기준으로 상세/멤버/대기열을 합성
  const my = await getMyCrew();
  if (!my) return null;

  const [detailRes, membersRes, pendingRes, me, membershipsRes] = await Promise.all([
    client.get(`/v1/crews/${my.id}`).catch(() => ({ data: {} })),
    client.get(`/v1/crews/${my.id}/members`, { params: { page: 0, size: 100 } }).catch(() => ({ data: { content: [] } })),
    client.get(`/v1/crews/${my.id}/join-requests`, { params: { page: 0, size: 100 } }).catch(() => ({ data: { content: [] } })),
    getMyProfile().catch(() => null as any),
    client.get(`/v1/crews/memberships/my`).catch(() => ({ data: [] })),
  ]);

  const d = detailRes.data as any; // CrewDetailResponse (may be empty on failure)
  const membersPage = membersRes.data as any; // PageCrewMemberResponse
  const pendingPage = pendingRes.data as any; // PageJoinRequestResponse
  const memberships = membershipsRes.data as any[];

  // 안정적인 ID 선택: 상세가 비어있으면 my.id 사용
  const rawId = d?.id ?? (my as any)?.id;
  if (!rawId) {
    // 유효한 크루 식별자가 없으면 상세 구성 불가
    return null;
  }

  const role: CrewRole = (() => {
    const myId = me?.id != null ? Number(me.id) : undefined;
    const list = membersPage?.content ?? [];
    const mine = list.find((m: any) => Number(m.userId) === myId);
    const isOwnerLike = (x: any) => Boolean(x?.isOwner || x?.owner || x?.isLeader || x?.role === "OWNER");
    if (mine && isOwnerLike(mine)) return "ADMIN";
    // 멤버십 폴백
    const ms = (memberships || []).find((m: any) => String(m?.crewId) === String(my.id));
    if (ms && isOwnerLike(ms)) return "ADMIN";
    // 상세 정보에 owner 식별자가 있을 수 있음
    const ownerHints = [d?.ownerUserId, d?.ownerId, d?.owner?.id, d?.owner?.userId].filter((v) => v != null);
    if (myId != null && ownerHints.some((v) => Number(v) === myId)) return "ADMIN";
    return "MEMBER";
  })();

  // 멤버 목록 폴백: /members가 비정상/불완전하면 /members/regular를 가져와 OWNER를 합성
  let membersList: any[] = Array.isArray(membersPage?.content)
    ? membersPage.content
    : [];
  if (membersList.length <= 1) {
    try {
      const { data: reg } = await client.get(`/v1/crews/${my.id}/members/regular`, { params: { page: 0, size: 100 } });
      const regulars = Array.isArray(reg?.content) ? reg.content : Array.isArray(reg) ? reg : [];
      // OWNER 합성: 상세/기존 목록에서 소유자 식별
      const ownerId = [d?.ownerUserId, d?.ownerId, d?.owner?.id, d?.owner?.userId, membersList.find((m: any) => m?.isOwner)?.userId]
        .find((v) => v != null);
      const ownerNick = d?.ownerNickname || d?.owner?.nickname || membersList.find((m: any) => m?.isOwner)?.userNickname;
      const owner = ownerId
        ? [{ userId: Number(ownerId), userNickname: String(ownerNick ?? "크루장"), role: "OWNER", isOwner: true }]
        : [];
      // 중복 제거
      const merged = [...owner, ...regulars];
      const seen = new Set<string>();
      membersList = merged.filter((m: any) => {
        const key = String(m.userId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      // ignore
    }
  }

  const mapped: CrewDetail = {
    crew: {
      id: String(rawId),
      name: String(d?.name ?? "크루"),
      description: String(d?.description ?? ""),
      progress: `${d?.currentMembers ?? 0}/${d?.maxMembers ?? 0}`,
      imageUrl: d?.profileImageUrl ?? null,
      role,
    },
    role,
    members: (membersList ?? []).map((m: any) => ({
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
  // 실제 API: 가입 신청 생성 → 기본적으로 PENDING
  const payload = (message && message.trim().length > 0) ? { message: message.trim() } : {};
  await client.post(`/v1/crews/${crew.id}/join-requests`, payload as any);
  return { pending: true, crewId: crew.id } as JoinResult;
}

export async function removeMember(crewId: string, userId: string): Promise<void> {
  await client.delete(`/v1/crews/${crewId}/members/${userId}`);
}

export async function approveRequest(requestId: string, note?: string): Promise<void> {
  await client.post(`/v1/crews/join-requests/${requestId}/approve`, { note: note ?? "" });
}

export async function rejectRequest(requestId: string, note?: string): Promise<void> {
  await client.post(`/v1/crews/join-requests/${requestId}/reject`, { note: note ?? "" });
}

// 권한 부여/회수 및 폐쇄
// 서버 스펙상 OWNER/MEMBER만 존재 → 승격은 소유권 이양으로 처리
export async function promoteMember(crewId: string, userId: string): Promise<void> {
  // 승격 = 소유권 이양 (UI 호환 목적)
  await client.post(`/v1/crews/${crewId}/transfer-ownership`, { newOwnerId: Number(userId) });
}

export async function demoteMember(crewId: string, userId: string): Promise<void> {
  await client.patch(`/v1/crews/${crewId}/members/${userId}/role`, { newRole: "MEMBER" });
}

export async function closeCrew(crewId: string): Promise<void> {
  await client.delete(`/v1/crews/${crewId}`);
}

// 멤버 탈퇴
export async function leaveCrew(crewId: string): Promise<void> {
  await client.delete(`/v1/crews/${crewId}/members/leave`);
}

// 운영진 권한 이임(소유권 이전)
export async function transferOwnership(crewId: string, userId: string): Promise<void> {
  await client.post(`/v1/crews/${crewId}/transfer-ownership`, { newOwnerId: Number(userId) });
}
