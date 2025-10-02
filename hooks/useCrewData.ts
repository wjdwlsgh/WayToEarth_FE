import { useEffect, useMemo, useState, useCallback } from "react";
import type { TopCrewItemData } from "../types/Crew";
import type { Crew } from "../utils/api/crews";
import { getMyCrew, listCrews, createCrew, joinCrew } from "../utils/api/crews";

const RAW_TOP_CREWS: TopCrewItemData[] = [
  { id: "2", rank: "1등 크루", name: "마리오 크루", distance: "1150km" },
  { id: "1", rank: "2등 크루", name: "산책 크루", distance: "950km" },
  { id: "3", rank: "3등 크루", name: "초록 크루", distance: "685km" },
];

export function useCrewData(searchText: string) {
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, list] = await Promise.all([
        getMyCrew(),
        listCrews(searchText),
      ]);
      setMyCrew(m);
      // 내 크루가 목록에 있으면 중복 제거 후 최상단에 노출
      const filtered = (list ?? []).filter((c) => !m || c.id !== m.id);
      setCrews(filtered);
    } catch (e: any) {
      setError(e?.message || "크루 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const topCrews = RAW_TOP_CREWS;

  const finalList = useMemo(() => {
    return myCrew ? [myCrew, ...crews] : crews;
  }, [myCrew, crews]);

  const ensureMyCrew = useCallback(async () => {
    const created = await createCrew({ name: "내 크루", description: "함께 달려요" });
    setMyCrew(created);
  }, []);

  const createMyCrew = useCallback(async (name: string, description?: string) => {
    const created = await createCrew({ name, description });
    setMyCrew(created);
    // 목록에서 중복 제거
    setCrews((prev) => prev.filter((c) => c.id !== created.id));
    return created;
  }, []);

  const joinExistingCrew = useCallback(async (crew: Crew) => {
    const joined = await joinCrew(crew);
    setMyCrew(joined);
    setCrews((prev) => prev.filter((c) => c.id !== joined.id));
    return joined;
  }, []);

  return { topCrews, crews: finalList, myCrew, loading, error, refresh, ensureMyCrew, createMyCrew, joinExistingCrew };
}
