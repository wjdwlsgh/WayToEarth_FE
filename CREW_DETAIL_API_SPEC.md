# 크루 상세 정보 조회 API 명세서

## 개요
크루 리스트에서 특정 크루를 클릭했을 때, 해당 크루의 상세 정보를 조회하는 API입니다.

---

## API 엔드포인트

### 크루 상세 조회

```
GET /v1/crews/{crewId}
```

**설명:** 특정 크루의 상세 정보를 조회합니다.

---

## 요청 (Request)

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `crewId` | Long | O | 조회할 크루의 ID | `1` |

### Headers

| 헤더 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `Authorization` | X | 인증 토큰 (선택, 로그인 사용자의 경우) | `Bearer eyJhbGc...` |

> 참고: Authorization 헤더는 선택사항입니다. 비로그인 사용자도 크루 상세 정보를 조회할 수 있습니다.

### 요청 예시

```http
GET /v1/crews/1 HTTP/1.1
Host: api.waytoearth.com
```

---

## 응답 (Response)

### 성공 응답 (200 OK)

#### Response Body

```json
{
  "id": 1,
  "name": "서울 러닝 크루",
  "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
  "maxMembers": 50,
  "currentMembers": 23,
  "profileImageUrl": "https://waytoearth-bucket.s3.ap-northeast-2.amazonaws.com/crews/1/profile.jpg",
  "isActive": true,
  "ownerId": 12,
  "ownerNickname": "김러너",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-20T14:45:30"
}
```

#### Response Fields

| 필드 | 타입 | Nullable | 설명 | 예시 |
|------|------|----------|------|------|
| `id` | Long | N | 크루 ID | `1` |
| `name` | String | N | 크루 이름 | `"서울 러닝 크루"` |
| `description` | String | Y | 크루 소개 | `"함께 달리며..."` |
| `maxMembers` | Integer | N | 최대 인원 | `50` |
| `currentMembers` | Integer | N | 현재 멤버 수 | `23` |
| `profileImageUrl` | String | Y | 크루 프로필 이미지 URL | `"https://..."` |
| `isActive` | Boolean | N | 크루 활성화 상태 | `true` |
| `ownerId` | Long | N | 크루장 사용자 ID | `12` |
| `ownerNickname` | String | N | 크루장 닉네임 | `"김러너"` |
| `createdAt` | DateTime | N | 크루 생성일 (ISO 8601) | `"2024-01-15T10:30:00"` |
| `updatedAt` | DateTime | N | 크루 정보 수정일 (ISO 8601) | `"2024-01-20T14:45:30"` |

---

### 에러 응답

#### 404 Not Found - 크루를 찾을 수 없음

```json
{
  "timestamp": "2024-01-20T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "크루를 찾을 수 없습니다. crewId: 999",
  "path": "/v1/crews/999"
}
```

**발생 상황:**
- 존재하지 않는 crewId를 요청한 경우
- 삭제된 크루를 조회한 경우 (isActive = false)

---

## 사용 시나리오

### 1. 크루 리스트에서 크루 선택

```typescript
// 크루 목록 조회
GET /v1/crews?page=0&size=20

// 응답에서 특정 크루 선택
const selectedCrewId = 1;

// 선택한 크루의 상세 정보 조회
GET /v1/crews/1
```

### 2. 크루 상세 페이지 진입

```typescript
// URL: /crews/1
// 페이지 로드 시 crewId로 상세 정보 조회

const crewId = getCrewIdFromUrl(); // 1
const response = await fetch(`/v1/crews/${crewId}`);
const crewDetail = await response.json();

// 화면에 표시
displayCrewInfo(crewDetail);
```

---

## 프론트엔드 통합 가이드

### JavaScript/TypeScript 예시

```typescript
// 타입 정의
interface CrewDetailResponse {
  id: number;
  name: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
  profileImageUrl: string | null;
  isActive: boolean;
  ownerId: number;
  ownerNickname: string;
  createdAt: string; // ISO 8601 날짜 문자열
  updatedAt: string;
}

// API 호출 함수
async function getCrewDetail(crewId: number): Promise<CrewDetailResponse> {
  try {
    const response = await fetch(`/v1/crews/${crewId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 선택: 로그인 사용자인 경우 Authorization 헤더 추가
        // 'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('크루를 찾을 수 없습니다.');
      }
      throw new Error('크루 정보를 불러오는데 실패했습니다.');
    }

    const crewDetail: CrewDetailResponse = await response.json();
    return crewDetail;
  } catch (error) {
    console.error('크루 상세 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
async function loadCrewDetailPage(crewId: number) {
  try {
    const crew = await getCrewDetail(crewId);

    // UI 업데이트
    document.getElementById('crew-name').textContent = crew.name;
    document.getElementById('crew-description').textContent = crew.description;
    document.getElementById('member-count').textContent =
      `${crew.currentMembers} / ${crew.maxMembers}`;
    document.getElementById('owner-name').textContent = crew.ownerNickname;

    if (crew.profileImageUrl) {
      document.getElementById('crew-image').src = crew.profileImageUrl;
    }

    // 가입 가능 여부 표시
    const isFull = crew.currentMembers >= crew.maxMembers;
    const isInactive = !crew.isActive;

    if (isFull) {
      showMessage('현재 크루 정원이 가득 찼습니다.');
    } else if (isInactive) {
      showMessage('현재 활성화되지 않은 크루입니다.');
    }

  } catch (error) {
    showErrorMessage('크루 정보를 불러올 수 없습니다.');
  }
}
```

### React 예시

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface CrewDetailResponse {
  id: number;
  name: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
  profileImageUrl: string | null;
  isActive: boolean;
  ownerId: number;
  ownerNickname: string;
  createdAt: string;
  updatedAt: string;
}

function CrewDetailPage() {
  const { crewId } = useParams<{ crewId: string }>();
  const [crew, setCrew] = useState<CrewDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrewDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/v1/crews/${crewId}`);

        if (!response.ok) {
          throw new Error('크루를 찾을 수 없습니다.');
        }

        const data = await response.json();
        setCrew(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCrewDetail();
  }, [crewId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!crew) return <div>크루를 찾을 수 없습니다.</div>;

  const isFull = crew.currentMembers >= crew.maxMembers;

  return (
    <div className="crew-detail">
      <img
        src={crew.profileImageUrl || '/default-crew-image.png'}
        alt={crew.name}
      />
      <h1>{crew.name}</h1>
      <p>{crew.description}</p>

      <div className="crew-info">
        <div>크루장: {crew.ownerNickname}</div>
        <div>멤버: {crew.currentMembers} / {crew.maxMembers}</div>
        <div>상태: {crew.isActive ? '활성' : '비활성'}</div>
      </div>

      {isFull && (
        <div className="alert">현재 크루 정원이 가득 찼습니다.</div>
      )}

      {!crew.isActive && (
        <div className="alert">현재 활성화되지 않은 크루입니다.</div>
      )}

      <button
        disabled={isFull || !crew.isActive}
        onClick={() => handleJoinCrew(crew.id)}
      >
        가입 신청
      </button>
    </div>
  );
}
```

---

## 추가 참고 API

크루 상세 페이지에서 함께 사용할 수 있는 관련 API들:

### 1. 크루 멤버 목록 조회
```
GET /v1/crews/{crewId}/members?page=0&size=20
```
크루에 속한 멤버들의 목록을 조회합니다.

### 2. 가입 신청 가능 여부 확인
```
GET /v1/crews/{crewId}/can-join
```
현재 사용자가 해당 크루에 가입 신청할 수 있는지 확인합니다.

### 3. 크루 가입 신청
```
POST /v1/crews/{crewId}/join-requests
```
크루에 가입 신청을 보냅니다.

### 4. 크루 멤버 수 조회
```
GET /v1/crews/{crewId}/members/count
```
크루의 현재 활성 멤버 수를 조회합니다.

---

## 주의사항

1. **인증 필요 여부**
   - 크루 상세 조회는 **인증 없이** 가능합니다.
   - 단, 가입 신청 등의 액션은 인증이 필요합니다.

2. **비활성 크루**
   - `isActive: false`인 크루도 조회는 가능합니다.
   - 단, 가입 신청은 불가능합니다.

3. **정원 초과**
   - `currentMembers >= maxMembers`인 경우 가입 신청이 불가능합니다.
   - UI에서 미리 차단하는 것을 권장합니다.

4. **프로필 이미지**
   - `profileImageUrl`이 `null`인 경우 기본 이미지를 사용하세요.

5. **날짜 포맷**
   - `createdAt`, `updatedAt`은 ISO 8601 형식입니다.
   - JavaScript의 `new Date(createdAt)`로 파싱 가능합니다.

---

## 테스트

### cURL 예시

```bash
# 기본 조회
curl -X GET "http://localhost:8080/v1/crews/1" \
  -H "Content-Type: application/json"

# 인증 포함 조회 (선택)
curl -X GET "http://localhost:8080/v1/crews/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Postman 설정

1. **Method:** GET
2. **URL:** `http://localhost:8080/v1/crews/1`
3. **Headers:**
   - `Content-Type`: `application/json`
4. **Path Variables:**
   - `crewId`: `1`

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-01-14 | 초기 문서 작성 |

---

**작성일:** 2025-01-14
**문서 버전:** 1.0
**API 버전:** v1
