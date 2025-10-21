# 스토리 카드 관리 API 문서

## 📌 개요

랜드마크별 스토리 카드를 생성, 수정, 삭제할 수 있는 관리자 전용 API입니다.

### 기본 정보

- **Base URL**: `https://api.waytoearth.com` (또는 개발 서버 URL)
- **API Version**: v1
- **인증 방식**: Bearer Token (JWT)
- **권한 요구사항**: `ROLE_ADMIN` (관리자만 접근 가능)
- **Content-Type**: `application/json`

---

## 🔐 인증

모든 요청의 Header에 JWT 토큰을 포함해야 합니다.

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 권한 에러 응답

권한이 없는 경우 다음과 같은 응답을 받습니다:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "접근 권한이 없습니다"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

**HTTP Status**: `403 Forbidden`

---

## 📊 스토리 타입 (StoryType)

랜드마크 스토리는 3가지 타입으로 분류됩니다:

| 타입 | 값 | 설명 | 예시 |
|------|-----|------|------|
| 역사 | `HISTORY` | 역사적 사건, 인물, 배경 | "에펠탑 건설 역사", "경복궁의 창건" |
| 문화 | `CULTURE` | 문화유산, 전통, 예술 | "프랑스 건축 양식", "조선 궁궐 문화" |
| 자연 | `NATURE` | 자연경관, 생태계, 지리 | "세느강의 생태계", "북한산 지형" |

---

## 📡 API 엔드포인트

### 1. 스토리 카드 생성

새로운 스토리 카드를 생성합니다.

#### Request

```http
POST /v1/admin/story-cards
```

#### Request Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Request Body

```json
{
  "landmarkId": 1,
  "title": "에펠탑의 역사",
  "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 귀스타브 에펠이 설계한 철탑입니다. 높이 324m로 당시 세계에서 가장 높은 건축물이었습니다.",
  "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower-history.jpg",
  "type": "HISTORY",
  "orderIndex": 0
}
```

#### Request Body 필드 설명

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `landmarkId` | Long | ✅ | 랜드마크 ID | 존재하는 랜드마크여야 함 |
| `title` | String | ✅ | 스토리 제목 | 최대 100자 |
| `content` | String | ✅ | 스토리 내용 | 최대 2000자 |
| `imageUrl` | String | ❌ | 이미지 URL | S3 업로드 URL 권장 |
| `type` | String | ✅ | 스토리 타입 | `HISTORY`, `CULTURE`, `NATURE` 중 하나 |
| `orderIndex` | Integer | ✅ | 정렬 순서 | 0 이상, 작은 숫자가 먼저 표시됨 |

#### Response (성공)

**HTTP Status**: `201 Created`

```json
{
  "success": true,
  "message": "스토리 카드가 성공적으로 생성되었습니다.",
  "data": {
    "id": 10,
    "title": "에펠탑의 역사",
    "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 귀스타브 에펠이 설계한 철탑입니다. 높이 324m로 당시 세계에서 가장 높은 건축물이었습니다.",
    "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower-history.jpg",
    "type": "HISTORY",
    "orderIndex": 0
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

#### Response 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | Boolean | 성공 여부 (항상 `true`) |
| `message` | String | 응답 메시지 |
| `data.id` | Long | 생성된 스토리 카드 ID |
| `data.title` | String | 스토리 제목 |
| `data.content` | String | 스토리 내용 |
| `data.imageUrl` | String | 이미지 URL (없으면 `null`) |
| `data.type` | String | 스토리 타입 |
| `data.orderIndex` | Integer | 정렬 순서 |
| `timestamp` | String | 응답 시간 (ISO 8601) |
| `errorCode` | String | 에러 코드 (성공 시 `null`) |

#### Error Responses

##### 1. 유효성 검증 실패

**HTTP Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "입력값 검증에 실패했습니다",
    "details": "title: 제목은 필수입니다, content: 내용은 필수입니다"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

##### 2. 랜드마크를 찾을 수 없음

**HTTP Status**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "LANDMARK_NOT_FOUND",
    "message": "랜드마크를 찾을 수 없습니다: 999"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

##### 3. 권한 없음

**HTTP Status**: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "접근 권한이 없습니다"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### cURL 예시

```bash
curl -X POST https://api.waytoearth.com/v1/admin/story-cards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 1,
    "title": "에펠탑의 역사",
    "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다.",
    "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower.jpg",
    "type": "HISTORY",
    "orderIndex": 0
  }'
```

#### JavaScript (Axios) 예시

```javascript
const createStoryCard = async (storyData) => {
  try {
    const response = await axios.post(
      'https://api.waytoearth.com/v1/admin/story-cards',
      {
        landmarkId: 1,
        title: '에펠탑의 역사',
        content: '에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다.',
        imageUrl: 'https://cdn.waytoearth.com/stories/eiffel-tower.jpg',
        type: 'HISTORY',
        orderIndex: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('생성된 스토리 ID:', response.data.data.id);
    return response.data;
  } catch (error) {
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('Error Code:', error.response.data.error.code);
      console.error('Error Message:', error.response.data.error.message);
    }
    throw error;
  }
};
```

#### React Query 예시

```typescript
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface CreateStoryCardRequest {
  landmarkId: number;
  title: string;
  content: string;
  imageUrl?: string;
  type: 'HISTORY' | 'CULTURE' | 'NATURE';
  orderIndex: number;
}

interface StoryCardResponse {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  type: string;
  orderIndex: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errorCode: string | null;
}

const useCreateStoryCard = () => {
  return useMutation({
    mutationFn: async (data: CreateStoryCardRequest) => {
      const response = await axios.post<ApiResponse<StoryCardResponse>>(
        '/v1/admin/story-cards',
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('스토리 생성 성공:', data.data.id);
      // 쿼리 무효화 또는 다른 작업
    },
    onError: (error: any) => {
      console.error('스토리 생성 실패:', error.response?.data?.error);
    }
  });
};

// 사용 예시
function CreateStoryForm() {
  const createStoryMutation = useCreateStoryCard();

  const handleSubmit = (formData) => {
    createStoryMutation.mutate({
      landmarkId: formData.landmarkId,
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl,
      type: formData.type,
      orderIndex: formData.orderIndex
    });
  };

  return (
    // ... form UI
  );
}
```

---

### 2. 스토리 카드 수정

기존 스토리 카드의 정보를 수정합니다.

#### Request

```http
PUT /v1/admin/story-cards/{storyId}
```

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `storyId` | Long | ✅ | 수정할 스토리 카드 ID |

#### Request Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Request Body

```json
{
  "title": "에펠탑의 역사 (수정)",
  "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었으며, 귀스타브 에펠이 설계했습니다. 완공 당시 324m로 세계에서 가장 높은 구조물이었습니다.",
  "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower-v2.jpg",
  "type": "HISTORY",
  "orderIndex": 0
}
```

#### Request Body 필드 설명

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `title` | String | ✅ | 스토리 제목 | 최대 100자 |
| `content` | String | ✅ | 스토리 내용 | 최대 2000자 |
| `imageUrl` | String | ❌ | 이미지 URL | null 가능 |
| `type` | String | ✅ | 스토리 타입 | `HISTORY`, `CULTURE`, `NATURE` |
| `orderIndex` | Integer | ✅ | 정렬 순서 | 0 이상 |

#### Response (성공)

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "message": "스토리 카드가 성공적으로 수정되었습니다.",
  "data": {
    "id": 10,
    "title": "에펠탑의 역사 (수정)",
    "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었으며, 귀스타브 에펠이 설계했습니다. 완공 당시 324m로 세계에서 가장 높은 구조물이었습니다.",
    "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower-v2.jpg",
    "type": "HISTORY",
    "orderIndex": 0
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

#### Error Responses

##### 스토리 카드를 찾을 수 없음

**HTTP Status**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "STORY_CARD_NOT_FOUND",
    "message": "스토리 카드를 찾을 수 없습니다: 999"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### cURL 예시

```bash
curl -X PUT https://api.waytoearth.com/v1/admin/story-cards/10 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "에펠탑의 역사 (수정)",
    "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다.",
    "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower-v2.jpg",
    "type": "HISTORY",
    "orderIndex": 0
  }'
```

#### JavaScript (Axios) 예시

```javascript
const updateStoryCard = async (storyId, updateData) => {
  try {
    const response = await axios.put(
      `https://api.waytoearth.com/v1/admin/story-cards/${storyId}`,
      {
        title: '에펠탑의 역사 (수정)',
        content: '에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다.',
        imageUrl: 'https://cdn.waytoearth.com/stories/eiffel-tower-v2.jpg',
        type: 'HISTORY',
        orderIndex: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('스토리 수정 실패:', error.response?.data);
    throw error;
  }
};
```

#### React Query 예시

```typescript
interface UpdateStoryCardRequest {
  title: string;
  content: string;
  imageUrl?: string;
  type: 'HISTORY' | 'CULTURE' | 'NATURE';
  orderIndex: number;
}

const useUpdateStoryCard = () => {
  return useMutation({
    mutationFn: async ({
      storyId,
      data
    }: {
      storyId: number;
      data: UpdateStoryCardRequest
    }) => {
      const response = await axios.put<ApiResponse<StoryCardResponse>>(
        `/v1/admin/story-cards/${storyId}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('스토리 수정 성공:', data.data.id);
    }
  });
};
```

---

### 3. 스토리 카드 삭제

스토리 카드를 삭제합니다. **삭제된 데이터는 복구할 수 없으니 주의하세요.**

#### Request

```http
DELETE /v1/admin/story-cards/{storyId}
```

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `storyId` | Long | ✅ | 삭제할 스토리 카드 ID |

#### Request Headers

```http
Authorization: Bearer {access_token}
```

#### Response (성공)

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "message": "스토리 카드가 성공적으로 삭제되었습니다.",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

#### Error Responses

##### 스토리 카드를 찾을 수 없음

**HTTP Status**: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "STORY_CARD_NOT_FOUND",
    "message": "스토리 카드를 찾을 수 없습니다: 999"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### cURL 예시

```bash
curl -X DELETE https://api.waytoearth.com/v1/admin/story-cards/10 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### JavaScript (Axios) 예시

```javascript
const deleteStoryCard = async (storyId) => {
  try {
    const response = await axios.delete(
      `https://api.waytoearth.com/v1/admin/story-cards/${storyId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('삭제 성공:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('스토리 삭제 실패:', error.response?.data);
    throw error;
  }
};
```

#### React Query 예시

```typescript
const useDeleteStoryCard = () => {
  return useMutation({
    mutationFn: async (storyId: number) => {
      const response = await axios.delete<ApiResponse<null>>(
        `/v1/admin/story-cards/${storyId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      console.log('스토리 삭제 성공');
      // 목록 새로고침 등
    }
  });
};

// 사용 예시 (삭제 확인 포함)
function DeleteStoryButton({ storyId }: { storyId: number }) {
  const deleteStoryMutation = useDeleteStoryCard();

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteStoryMutation.mutate(storyId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteStoryMutation.isPending}
    >
      {deleteStoryMutation.isPending ? '삭제 중...' : '삭제'}
    </button>
  );
}
```

---

### 4. 스토리 이미지 업로드 URL 발급

스토리 카드에 사용할 이미지를 S3에 업로드하기 위한 Presigned URL을 발급받습니다.

#### Request

```http
POST /v1/admin/story-cards/{journeyId}/{landmarkId}/{storyId}/image/presign
```

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `journeyId` | Long | ✅ | 여정 ID |
| `landmarkId` | Long | ✅ | 랜드마크 ID |
| `storyId` | Long | ✅ | 스토리 카드 ID |

#### Request Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Request Body

```json
{
  "contentType": "image/jpeg",
  "size": 2048576
}
```

#### Request Body 필드 설명

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `contentType` | String | ✅ | 파일 MIME 타입 | `image/jpeg`, `image/png`, `image/webp` |
| `size` | Long | ✅ | 파일 크기 (bytes) | 최대 10MB (10485760 bytes) |

#### 지원 파일 형식

| 형식 | MIME Type | 확장자 |
|------|-----------|--------|
| JPEG | `image/jpeg` | `.jpg`, `.jpeg` |
| PNG | `image/png` | `.png` |
| WebP | `image/webp` | `.webp` |

#### Response (성공)

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "message": "스토리 이미지 업로드 URL이 성공적으로 발급되었습니다.",
  "data": {
    "uploadUrl": "https://waytoearth-bucket.s3.ap-northeast-2.amazonaws.com/journeys/1/landmarks/5/stories/10/550e8400-e29b-41d4-a716-446655440000.jpg?X-Amz-Algorithm=...",
    "downloadUrl": "https://d1234567890.cloudfront.net/journeys/1/landmarks/5/stories/10/550e8400-e29b-41d4-a716-446655440000.jpg?v=1640000000000",
    "key": "journeys/1/landmarks/5/stories/10/550e8400-e29b-41d4-a716-446655440000.jpg",
    "expiresIn": 300
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

#### Response 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `data.uploadUrl` | String | S3 Presigned PUT URL (이 URL로 파일 업로드) |
| `data.downloadUrl` | String | CloudFront CDN URL (DB에 저장할 URL) |
| `data.key` | String | S3 객체 키 |
| `data.expiresIn` | Integer | URL 만료 시간 (초) - 기본 300초 (5분) |

#### Error Responses

##### 파일 크기 초과

**HTTP Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "파일 크기는 10MB 이하여야 합니다"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

##### 지원하지 않는 파일 형식

**HTTP Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "지원하지 않는 파일 형식입니다"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

#### 이미지 업로드 전체 플로우

```typescript
// 1단계: Presigned URL 발급
const getPresignedUrl = async (file: File) => {
  const response = await axios.post(
    `/v1/admin/story-cards/1/5/10/image/presign`,
    {
      contentType: file.type,
      size: file.size
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return response.data.data;
};

// 2단계: S3에 이미지 업로드
const uploadToS3 = async (uploadUrl: string, file: File) => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type
    }
  });
};

// 3단계: 스토리 카드 생성/수정 시 downloadUrl 사용
const createStoryWithImage = async (file: File, storyData: any) => {
  // 1. Presigned URL 발급
  const { uploadUrl, downloadUrl } = await getPresignedUrl(file);

  // 2. S3에 업로드
  await uploadToS3(uploadUrl, file);

  // 3. 스토리 카드 생성 (downloadUrl을 imageUrl로 사용)
  const response = await axios.post('/v1/admin/story-cards', {
    ...storyData,
    imageUrl: downloadUrl
  });

  return response.data;
};
```

#### React 컴포넌트 예시 (이미지 업로드 포함)

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface PresignResponse {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

function CreateStoryWithImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Presigned URL 발급
  const presignMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await axios.post<ApiResponse<PresignResponse>>(
        `/v1/admin/story-cards/1/5/10/image/presign`,
        {
          contentType: file.type,
          size: file.size
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      return response.data.data;
    }
  });

  // S3 업로드
  const uploadMutation = useMutation({
    mutationFn: async ({ url, file }: { url: string; file: File }) => {
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type
        }
      });
    }
  });

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 파일 크기 체크 (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    // 파일 형식 체크
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      alert('JPEG, PNG, WebP 형식만 지원합니다');
      return;
    }

    setFile(selectedFile);

    try {
      // 1. Presigned URL 발급
      const presignData = await presignMutation.mutateAsync(selectedFile);

      // 2. S3에 업로드
      await uploadMutation.mutateAsync({
        url: presignData.uploadUrl,
        file: selectedFile
      });

      // 3. downloadUrl을 상태에 저장 (스토리 생성 시 사용)
      setImageUrl(presignData.downloadUrl);

      alert('이미지 업로드 성공!');
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다');
    }
  };

  const handleSubmit = async (formData: any) => {
    // 스토리 카드 생성 (imageUrl 포함)
    await axios.post('/v1/admin/story-cards', {
      ...formData,
      imageUrl: imageUrl // 업로드한 이미지 URL
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        disabled={presignMutation.isPending || uploadMutation.isPending}
      />

      {(presignMutation.isPending || uploadMutation.isPending) && (
        <p>이미지 업로드 중...</p>
      )}

      {imageUrl && (
        <div>
          <p>이미지 업로드 완료!</p>
          <img src={imageUrl} alt="Preview" style={{ maxWidth: '200px' }} />
        </div>
      )}

      {/* 나머지 폼 필드들... */}
    </form>
  );
}
```

---

## 📝 조회 API (일반 사용자용)

관리자가 생성한 스토리 카드는 일반 사용자도 조회할 수 있습니다.

### 랜드마크별 스토리 목록 조회

```http
GET /v1/landmarks/{landmarkId}/stories
```

#### Query Parameters (Optional)

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `type` | String | ❌ | 스토리 타입 필터 | `HISTORY`, `CULTURE`, `NATURE` |

#### Request 예시

```http
GET /v1/landmarks/5/stories?type=HISTORY
Authorization: Bearer {access_token}
```

#### Response

```json
{
  "success": true,
  "message": "스토리 목록을 성공적으로 조회했습니다.",
  "data": [
    {
      "id": 10,
      "title": "에펠탑의 역사",
      "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다...",
      "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower.jpg",
      "type": "HISTORY",
      "orderIndex": 0
    },
    {
      "id": 11,
      "title": "에펠탑 건축 과정",
      "content": "2년 2개월에 걸쳐 300명의 노동자가...",
      "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-construction.jpg",
      "type": "HISTORY",
      "orderIndex": 1
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

### 단일 스토리 조회

```http
GET /v1/story-cards/{storyCardId}
```

#### Response

```json
{
  "success": true,
  "message": "스토리를 성공적으로 조회했습니다.",
  "data": {
    "id": 10,
    "title": "에펠탑의 역사",
    "content": "에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다...",
    "imageUrl": "https://cdn.waytoearth.com/stories/eiffel-tower.jpg",
    "type": "HISTORY",
    "orderIndex": 0
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "errorCode": null
}
```

---

## ⚠️ 에러 코드 정리

| HTTP Status | Error Code | 설명 | 해결 방법 |
|-------------|------------|------|-----------|
| 400 | `INVALID_PARAMETER` | 잘못된 파라미터 (유효성 검증 실패) | 요청 데이터 확인 |
| 401 | `UNAUTHORIZED` | 인증 실패 (토큰 없음/만료) | 로그인 다시 수행 |
| 403 | `FORBIDDEN` | 권한 없음 (관리자 아님) | 관리자 계정으로 로그인 |
| 404 | `STORY_CARD_NOT_FOUND` | 스토리 카드를 찾을 수 없음 | 올바른 ID 확인 |
| 404 | `LANDMARK_NOT_FOUND` | 랜드마크를 찾을 수 없음 | 올바른 랜드마크 ID 확인 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 관리자에게 문의 |

---

## 🎯 사용 시나리오

### 시나리오 1: 이미지가 있는 스토리 생성

```typescript
async function createStoryWithImage(
  landmarkId: number,
  imageFile: File,
  storyData: {
    title: string;
    content: string;
    type: 'HISTORY' | 'CULTURE' | 'NATURE';
    orderIndex: number;
  }
) {
  // 1. Presigned URL 발급 (journeyId, landmarkId는 상황에 맞게)
  const presignResponse = await axios.post(
    `/v1/admin/story-cards/1/${landmarkId}/0/image/presign`,
    {
      contentType: imageFile.type,
      size: imageFile.size
    }
  );

  const { uploadUrl, downloadUrl } = presignResponse.data.data;

  // 2. S3에 이미지 업로드
  await axios.put(uploadUrl, imageFile, {
    headers: {
      'Content-Type': imageFile.type
    }
  });

  // 3. 스토리 카드 생성
  const createResponse = await axios.post('/v1/admin/story-cards', {
    landmarkId,
    title: storyData.title,
    content: storyData.content,
    imageUrl: downloadUrl,
    type: storyData.type,
    orderIndex: storyData.orderIndex
  });

  return createResponse.data.data;
}
```

### 시나리오 2: 스토리 순서 변경

```typescript
async function reorderStories(stories: Array<{ id: number; newOrder: number }>) {
  // 각 스토리의 orderIndex를 업데이트
  const promises = stories.map(story =>
    axios.put(`/v1/admin/story-cards/${story.id}`, {
      // 기존 데이터는 그대로 유지하고 orderIndex만 변경
      orderIndex: story.newOrder
    })
  );

  await Promise.all(promises);
}

// 사용 예시
await reorderStories([
  { id: 10, newOrder: 2 },
  { id: 11, newOrder: 0 },
  { id: 12, newOrder: 1 }
]);
```

### 시나리오 3: 스토리 타입별 필터링 조회

```typescript
async function getStoriesByType(
  landmarkId: number,
  type: 'HISTORY' | 'CULTURE' | 'NATURE'
) {
  const response = await axios.get(
    `/v1/landmarks/${landmarkId}/stories`,
    {
      params: { type }
    }
  );

  return response.data.data;
}

// 사용 예시
const historyStories = await getStoriesByType(5, 'HISTORY');
```

---

## 📱 TypeScript 타입 정의

```typescript
// 공통 API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errorCode: string | null;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

// 스토리 타입
type StoryType = 'HISTORY' | 'CULTURE' | 'NATURE';

// 스토리 카드 응답
interface StoryCard {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  type: StoryType;
  orderIndex: number;
}

// 생성 요청
interface CreateStoryCardRequest {
  landmarkId: number;
  title: string;
  content: string;
  imageUrl?: string;
  type: StoryType;
  orderIndex: number;
}

// 수정 요청
interface UpdateStoryCardRequest {
  title: string;
  content: string;
  imageUrl?: string;
  type: StoryType;
  orderIndex: number;
}

// Presigned URL 요청
interface PresignRequest {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
}

// Presigned URL 응답
interface PresignResponse {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}
```

---

## 🧪 테스트 가이드

### Postman 컬렉션

```json
{
  "info": {
    "name": "Story Card API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Story Card",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"landmarkId\": 1,\n  \"title\": \"에펠탑의 역사\",\n  \"content\": \"에펠탑은 1889년 파리 만국박람회를 기념하여 건설되었습니다.\",\n  \"imageUrl\": \"https://cdn.waytoearth.com/stories/eiffel-tower.jpg\",\n  \"type\": \"HISTORY\",\n  \"orderIndex\": 0\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/v1/admin/story-cards",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "admin", "story-cards"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.waytoearth.com"
    },
    {
      "key": "accessToken",
      "value": "YOUR_ACCESS_TOKEN"
    }
  ]
}
```

---

## 🔍 FAQ

### Q1. 이미지 없이 스토리를 생성할 수 있나요?
**A**: 네, `imageUrl` 필드는 선택사항입니다. `null` 또는 필드를 생략하면 됩니다.

### Q2. 스토리 순서를 변경하려면 어떻게 하나요?
**A**: `orderIndex` 값을 변경하여 PUT 요청을 보내면 됩니다. 작은 숫자가 먼저 표시됩니다.

### Q3. 하나의 랜드마크에 최대 몇 개의 스토리를 만들 수 있나요?
**A**: 제한은 없지만, UX를 고려하여 타입별로 3-5개 정도를 권장합니다.

### Q4. 이미지 업로드 실패 시 재시도할 수 있나요?
**A**: Presigned URL은 5분간 유효합니다. 시간 내에 재시도하거나, 만료 시 새 URL을 발급받으세요.

### Q5. 스토리 카드를 비활성화만 하고 싶은데 삭제해야 하나요?
**A**: 현재는 삭제만 지원합니다. 비활성화 기능이 필요하면 백엔드 팀에 문의해주세요.

---

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- **GitHub Issues**: [WayToEarth_BE Issues](https://github.com/WayToEarth-Team/WayToEarth_BE/issues)
- **Swagger UI**: `https://api.waytoearth.com/swagger-ui.html`

---

**최종 업데이트**: 2024-01-20
**API Version**: v1
**문서 작성자**: Claude Code AI Assistant
