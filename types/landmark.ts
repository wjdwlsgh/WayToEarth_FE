// types/landmark.ts
// 랜드마크 스토리 페이지 타입 정의

export type StoryType = 'HISTORY' | 'CULTURE' | 'NATURE';

export interface GalleryImage {
  id: number;
  imageUrl: string;
  orderIndex: number;
}

// 백엔드 응답 형식 (스펙 문서: images는 List<String>)
// 실제로는 문자열 배열로 올 가능성이 높음
export type GalleryImageResponse = string[] | GalleryImage[];

export interface StoryCard {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null; // 커버 이미지
  images?: GalleryImage[]; // 갤러리 이미지 배열 (순서 보장, optional)
  type: StoryType;
  orderIndex: number;
}

export interface LandmarkDetail {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  orderIndex: number;
  imageUrl: string | null; // 커버 이미지
  images?: GalleryImage[]; // 갤러리 이미지 배열 (순서 보장, optional)
  countryCode: string;
  cityName: string;
  hasStamp: boolean;
  storyCards: StoryCard[];
}

export interface LandmarkSummary {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  orderIndex: number;
  imageUrl: string | null;
}

// 스토리 타입 라벨 매핑
export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  HISTORY: '역사',
  CULTURE: '문화',
  NATURE: '자연',
};

// 스토리 타입 컬러 매핑 (디자인 일관성)
export const STORY_TYPE_COLORS: Record<StoryType, string> = {
  HISTORY: '#EF4444', // 빨강
  CULTURE: '#F59E0B', // 주황
  NATURE: '#10B981', // 초록
};
