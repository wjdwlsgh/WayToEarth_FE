// types/guestbook.ts

/**
 * 방명록 작성 요청
 */
export interface GuestbookCreateRequest {
  landmarkId: number;
  message: string;
  isPublic?: boolean; // 기본값: true
}

/**
 * 사용자 요약 정보
 */
export interface UserSummary {
  id: number;
  nickname: string;
  profileImageUrl: string;
}

/**
 * 랜드마크 요약 정보
 */
export interface LandmarkSummary {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  imageUrl: string;
  countryCode: string;
  cityName: string;
}

/**
 * 방명록 응답
 */
export interface GuestbookResponse {
  id: number;
  user: UserSummary;
  landmark: LandmarkSummary;
  message: string;
  createdAt: string; // ISO 8601 형식
}

/**
 * 페이징 응답 (Spring Page)
 */
export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

/**
 * 랜드마크 통계
 */
export interface LandmarkStatistics {
  totalGuestbook: number; // 방명록 총 개수
  totalVisitors: number; // 방문자 수 (스탬프 기준)
}

/**
 * 방명록 에러
 */
export interface GuestbookError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
