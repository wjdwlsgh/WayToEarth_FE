// utils/api/journeyRoutes.ts
// Mock API for Journey routes (virtual journeys)

export type RouteId = string;

export type RouteSummary = {
  id: RouteId;
  title: string;
  description: string;
  distance: string; // e.g., '42.5Km'
  duration: string; // e.g., '28일'
  difficulty: '쉬움' | '보통' | '어려움' | string;
  completed: number;
  total: number;
  image: 'palace' | 'jeju' | 'hangang' | string;
  tags: string[];
};

export type Landmark = { id: string; name: string; distance: string; completed?: boolean };

export type RouteDetail = RouteSummary & {
  landmarks: Landmark[];
};

const mockRoutes: RouteDetail[] = [
  {
    id: '1',
    title: '한국의 고궁탐방',
    description:
      '조선왕조의 아름다운 궁궐들을 달리며 만나보세요. 경복궁에서 시작하여 창덕궁, 창경궁, 덕수궁까지 이어지는 역사의 여정입니다.',
    distance: '42.5Km',
    duration: '28일',
    difficulty: '보통',
    completed: 1,
    total: 234,
    image: 'palace',
    tags: ['경복궁', '창덕궁', '덕수궁'],
    landmarks: [
      { id: '1-1', name: '경복궁', distance: '8.5km 지점', completed: true },
      { id: '1-2', name: '창덕궁', distance: '15.2km 지점' },
      { id: '1-3', name: '창경궁', distance: '23.1km 지점' },
      { id: '1-4', name: '종묘', distance: '31.5km 지점' },
      { id: '1-5', name: '덕수궁', distance: '42.5km 지점' },
    ],
  },
  {
    id: '2',
    title: '제주 올레길 완주',
    description: '제주의 아름다운 자연과 함께하는 특별한 여정',
    distance: '425Km',
    duration: '60일',
    difficulty: '어려움',
    completed: 0,
    total: 156,
    image: 'jeju',
    tags: ['성산일출봉', '우도', '한라산'],
    landmarks: [
      { id: '2-1', name: '성산일출봉', distance: '12.0km 지점' },
      { id: '2-2', name: '우도', distance: '84.3km 지점' },
      { id: '2-3', name: '한라산', distance: '201.0km 지점' },
    ],
  },
  {
    id: '3',
    title: '서울 한강 종주',
    description: '한강을 따라 서울의 모든 다리를 지나는 도심 여정',
    distance: '50.2Km',
    duration: '15일',
    difficulty: '쉬움',
    completed: 0,
    total: 312,
    image: 'hangang',
    tags: ['반포대교', '동작대교', '한강공원'],
    landmarks: [
      { id: '3-1', name: '반포대교', distance: '5.0km 지점' },
      { id: '3-2', name: '동작대교', distance: '12.0km 지점' },
      { id: '3-3', name: '여의도 한강공원', distance: '20.0km 지점' },
    ],
  },
];

const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export async function listRoutes(): Promise<RouteSummary[]> {
  await wait();
  return mockRoutes.map(({ landmarks, ...rest }) => rest);
}

export async function getRouteDetail(id: RouteId): Promise<RouteDetail> {
  await wait();
  const found = mockRoutes.find((r) => r.id === id);
  if (!found) throw new Error('Route not found');
  return found;
}

