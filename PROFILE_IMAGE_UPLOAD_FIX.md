# 프로필 이미지 업로드 403 에러 해결 가이드

## 문제 상황
프로필 이미지 업로드 시 403 Forbidden 에러 발생

## 원인
백엔드에서 Presigned URL 생성 시 `Cache-Control` 헤더를 포함하여 서명했기 때문에, 프론트엔드에서도 **정확히 같은 헤더**를 포함해서 업로드해야 합니다.

서명에 포함된 헤더: `X-Amz-SignedHeaders=cache-control;content-type;host`

## 해결 방법

### 1. React/Axios 예시

```typescript
// ❌ 기존 코드 (403 에러 발생)
const uploadToS3 = async (presignedUrl: string, file: File) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};

// ✅ 수정된 코드
const uploadToS3 = async (presignedUrl: string, file: File) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // 필수 추가!
    },
  });
};
```

### 2. Fetch API 예시

```typescript
// ❌ 기존 코드
const uploadToS3 = async (presignedUrl: string, file: File) => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
};

// ✅ 수정된 코드
const uploadToS3 = async (presignedUrl: string, file: File) => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // 필수 추가!
    },
  });
};
```

### 3. Vue 3 Composition API 예시

```typescript
// composables/useFileUpload.ts
import axios from 'axios';

export const useFileUpload = () => {
  const uploadToS3 = async (presignedUrl: string, file: File) => {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'no-cache, no-store, must-revalidate', // 필수!
        },
      });
      return true;
    } catch (error) {
      console.error('S3 업로드 실패:', error);
      return false;
    }
  };

  return {
    uploadToS3,
  };
};
```

## 전체 프로필 이미지 업로드 플로우

```typescript
import axios from 'axios';

interface PresignResponse {
  upload_url: string;
  download_url: string;
  key: string;
  expires_in: number;
}

// 1단계: Presigned URL 요청
const requestPresignedUrl = async (file: File): Promise<PresignResponse> => {
  const response = await axios.post(
    '/v1/files/presign/profile',
    {
      content_type: file.type,
      size: file.size,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

// 2단계: S3에 파일 업로드 (Cache-Control 헤더 필수!)
const uploadToS3 = async (presignedUrl: string, file: File): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // ⭐ 이것이 핵심!
    },
  });
};

// 3단계: 프로필 업데이트 (key 저장)
const updateProfile = async (profileImageKey: string): Promise<void> => {
  await axios.put(
    '/v1/users/me',
    {
      profile_image_key: profileImageKey,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
};

// 통합 함수
const uploadProfileImage = async (file: File) => {
  try {
    // 1. Presigned URL 받기
    const presignData = await requestPresignedUrl(file);

    // 2. S3 업로드 (Cache-Control 헤더 포함!)
    await uploadToS3(presignData.upload_url, file);

    // 3. 프로필 업데이트
    await updateProfile(presignData.key);

    console.log('프로필 이미지 업로드 완료!');
    return presignData.download_url;
  } catch (error) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw error;
  }
};
```

## 주의사항

### ⚠️ Cache-Control 헤더 값은 정확해야 합니다

```typescript
// ✅ 올바른 값
'Cache-Control': 'no-cache, no-store, must-revalidate'

// ❌ 틀린 값들 (403 에러 발생)
'Cache-Control': 'no-cache'
'Cache-Control': 'no-store'
'Cache-Control': 'no-cache, no-store'  // must-revalidate 빠짐
'cache-control': 'no-cache, no-store, must-revalidate'  // 대소문자 주의 (일부 브라우저)
```

### 디버깅 방법

업로드 실패 시 개발자 도구 Network 탭에서 확인:

```
Request URL: https://waytoearth-assets-prod.s3.ap-northeast-2.amazonaws.com/profiles/1/profile.jpg?X-Amz-...
Request Method: PUT
Status Code: 403 Forbidden

Request Headers:
  Content-Type: image/jpeg
  Cache-Control: no-cache, no-store, must-revalidate  ← 이 헤더가 있는지 확인!
```

## 적용 대상 API

이 가이드는 다음 모든 Presigned URL 업로드에 적용됩니다:

- ✅ **프로필 이미지**: `POST /v1/files/presign/profile`
- ✅ **피드 이미지**: `POST /v1/files/presign/feed`
- ✅ **크루 프로필 이미지**: `POST /v1/files/presign/crew/{crewId}`
- ✅ **랜드마크 이미지** (Admin): `POST /v1/admin/landmarks/{journeyId}/{landmarkId}/image/presign`
- ✅ **스토리 이미지** (Admin): `POST /v1/admin/story-cards/{journeyId}/{landmarkId}/{storyId}/image/presign`

## CloudFront 캐시 이슈 해결

이제 다음과 같이 동작합니다:

1. **업로드 시**: `Cache-Control: no-cache, no-store, must-revalidate` 헤더가 S3 파일 메타데이터에 저장됩니다
2. **다운로드 시**: CloudFront가 이 헤더를 인식하여 캐시하지 않습니다
3. **URL 캐시 버스팅**: `?v=timestamp` 쿼리 파라미터로 추가 보호

결과: 프로필 변경 → 이전 파일 삭제 → 새 파일 업로드 시 **즉시 반영**됩니다! 🎉
