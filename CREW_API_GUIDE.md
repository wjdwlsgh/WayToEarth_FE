# 🏃 크루 API 완벽 가이드

> 크루 생성, 조회, 수정, 프로필 이미지 업로드까지 - 프론트엔드 구현 가이드

---

## 📋 목차

1. [개요](#개요)
2. [크루 프로필 이미지 업로드](#크루-프로필-이미지-업로드)
3. [크루 CRUD API](#크루-crud-api)
4. [크루 조회 API](#크루-조회-api)
5. [프론트엔드 구현 예시](#프론트엔드-구현-예시)
6. [에러 처리](#에러-처리)

---

## 개요

### 🎯 크루 시스템 특징

- **크루장 권한**: 크루 생성자가 자동으로 크루장이 됨
- **프로필 이미지**: S3 Presigned URL 방식 (최대 5MB)
- **멤버 제한**: 최소 2명 ~ 최대 100명
- **활성화 상태**: 크루장이 크루 활성화/비활성화 가능

---

## 크루 프로필 이미지 업로드

### 📤 1단계: Presigned URL 발급

크루 프로필 이미지 업로드를 위한 S3 Presigned URL을 발급받습니다.

#### Request

```http
POST /v1/files/presign/crew/{crewId}
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "contentType": "image/jpeg",
  "size": 2048000
}
```

**Parameters:**

| 파라미터 | 위치 | 타입 | 필수 | 설명 |
|---------|-----|------|------|------|
| `crewId` | Path | Long | ✅ | 크루 ID |
| `contentType` | Body | String | ✅ | MIME 타입 (`image/jpeg`, `image/png`, `image/webp`) |
| `size` | Body | Long | ✅ | 파일 크기 (바이트) |

**권한:**
- ✅ 크루장만 업로드 가능
- ❌ 일반 멤버는 403 Forbidden

#### Response (200 OK)

```json
{
  "success": true,
  "message": "크루 프로필 이미지 업로드 URL이 성공적으로 발급되었습니다.",
  "data": {
    "upload_url": "https://bucket.s3.amazonaws.com/crews/123/profile_1234567890.jpg?X-Amz-Algorithm=...",
    "download_url": "https://cloudfront.example.com/crews/123/profile_1234567890.jpg",
    "key": "crews/123/profile_1234567890.jpg",
    "expires_in": 300
  }
}
```

**Response 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `upload_url` | String | S3에 파일을 업로드할 Presigned URL (5분간 유효) |
| `download_url` | String | 업로드 후 이미지 조회 URL (CloudFront 또는 S3) |
| `key` | String | S3 객체 키 (`crews/{crewId}/profile_{timestamp}.{ext}`) |
| `expires_in` | Integer | URL 만료 시간 (초) |

---

### 📤 2단계: S3에 파일 업로드

발급받은 `upload_url`로 실제 이미지 파일을 업로드합니다.

```javascript
// 프론트엔드
const uploadImage = async (file, uploadUrl) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,  // image/jpeg
    },
    body: file  // File 객체
  });

  if (!response.ok) {
    throw new Error('이미지 업로드 실패');
  }

  return response;
};

// 사용 예시
const file = document.getElementById('fileInput').files[0];
await uploadImage(file, presignResponse.data.upload_url);
```

---

### 📤 3단계: 크루 정보 업데이트 (프로필 이미지 URL 저장)

업로드 완료 후 `download_url`을 크루 정보에 저장합니다.

```http
PUT /v1/crews/{crewId}
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "profileImageUrl": "https://cloudfront.example.com/crews/123/profile_1234567890.jpg"
}
```

---

### 🗑️ 크루 프로필 이미지 삭제

#### Request

```http
DELETE /v1/files/crew/{crewId}/profile
Authorization: Bearer {token}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "크루 프로필 이미지가 성공적으로 삭제되었습니다.",
  "data": null
}
```

**동작:**
- S3에서 기존 프로필 이미지 파일 삭제
- DB에서 `profileImageUrl` 필드 `null`로 초기화

---

## 크루 CRUD API

### ✅ 1. 크루 생성

#### Request

```http
POST /v1/crews
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "name": "서울 러닝 크루",
  "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
  "maxMembers": 20,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg"
}
```

**Request Body:**

| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|---------|------|
| `name` | String | ✅ | 최대 50자 | 크루 이름 |
| `description` | String | ❌ | 최대 500자 | 크루 소개 |
| `maxMembers` | Integer | ❌ | 2~100 | 최대 인원 (기본값: 50) |
| `profileImageUrl` | String | ❌ | - | 프로필 이미지 URL |

#### Response (201 Created)

```json
{
  "id": 123,
  "name": "서울 러닝 크루",
  "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
  "maxMembers": 20,
  "currentMembers": 1,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg",
  "isActive": true,
  "ownerId": 456,
  "ownerNickname": "김러너",
  "createdAt": "2025-01-21T10:00:00",
  "updatedAt": "2025-01-21T10:00:00"
}
```

---

### 🔄 2. 크루 정보 수정

**권한:** 크루장만 가능

#### Request

```http
PUT /v1/crews/{crewId}
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "name": "서울 러닝 크루 (수정)",
  "description": "새로운 소개글",
  "maxMembers": 30,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/new-profile.jpg"
}
```

**Request Body:**

| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|---------|------|
| `name` | String | ❌ | 최대 50자 | 크루 이름 (null이면 기존 값 유지) |
| `description` | String | ❌ | 최대 500자 | 크루 소개 |
| `maxMembers` | Integer | ❌ | 2~100 | 최대 인원 |
| `profileImageUrl` | String | ❌ | - | 프로필 이미지 URL |

**참고:**
- 모든 필드는 선택사항입니다
- `null` 또는 제공하지 않으면 기존 값 유지
- 빈 문자열(`""`)을 보내면 해당 필드 초기화

#### Response (200 OK)

```json
{
  "id": 123,
  "name": "서울 러닝 크루 (수정)",
  "description": "새로운 소개글",
  "maxMembers": 30,
  "currentMembers": 5,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/new-profile.jpg",
  "isActive": true,
  "ownerId": 456,
  "ownerNickname": "김러너",
  "createdAt": "2025-01-21T10:00:00",
  "updatedAt": "2025-01-21T11:30:00"
}
```

---

### 🗑️ 3. 크루 삭제

**권한:** 크루장만 가능

#### Request

```http
DELETE /v1/crews/{crewId}
Authorization: Bearer {token}
```

#### Response (204 No Content)

응답 Body 없음

---

### 🔄 4. 크루 활성화/비활성화 토글

**권한:** 크루장만 가능

#### Request

```http
PATCH /v1/crews/{crewId}/toggle-status
Authorization: Bearer {token}
```

#### Response (200 OK)

```json
{
  "id": 123,
  "name": "서울 러닝 크루",
  "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
  "maxMembers": 20,
  "currentMembers": 5,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg",
  "isActive": false,
  "ownerId": 456,
  "ownerNickname": "김러너",
  "createdAt": "2025-01-21T10:00:00",
  "updatedAt": "2025-01-21T12:00:00"
}
```

**동작:**
- `isActive: true` → `false`: 크루 비활성화 (신규 가입 불가)
- `isActive: false` → `true`: 크루 활성화 (신규 가입 가능)

---

## 크루 조회 API

### 📋 1. 크루 목록 조회 (페이징)

#### Request

```http
GET /v1/crews?page=0&size=20&sort=createdAt&direction=desc
Authorization: Bearer {token}
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| `page` | Integer | ❌ | 0 | 페이지 번호 (0부터 시작) |
| `size` | Integer | ❌ | 20 | 페이지 크기 |
| `sort` | String | ❌ | `createdAt` | 정렬 기준 (`createdAt`, `name`, `currentMembers`) |
| `direction` | String | ❌ | `desc` | 정렬 방향 (`asc`, `desc`) |

#### Response (200 OK)

```json
{
  "content": [
    {
      "id": 123,
      "name": "서울 러닝 크루",
      "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
      "maxMembers": 20,
      "currentMembers": 10,
      "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg",
      "ownerNickname": "김러너",
      "createdAt": "2025-01-21T10:00:00",
      "canJoin": true
    },
    {
      "id": 124,
      "name": "부산 러닝 크루",
      "description": "부산에서 함께 달려요",
      "maxMembers": 30,
      "currentMembers": 15,
      "profileImageUrl": "https://cloudfront.example.com/crews/124/profile.jpg",
      "ownerNickname": "이러너",
      "createdAt": "2025-01-20T14:00:00",
      "canJoin": false
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 50,
  "totalPages": 3,
  "last": false,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "numberOfElements": 20,
  "first": true,
  "empty": false
}
```

**Response 필드 (content 배열):**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 크루 ID |
| `name` | String | 크루 이름 |
| `description` | String | 크루 소개 |
| `maxMembers` | Integer | 최대 인원 |
| `currentMembers` | Integer | 현재 멤버 수 |
| `profileImageUrl` | String | 프로필 이미지 URL |
| `ownerNickname` | String | 크루장 닉네임 |
| `createdAt` | DateTime | 생성일 |
| `canJoin` | Boolean | 가입 가능 여부 (로그인 사용자 기준) |

---

### 🔍 2. 크루 검색

#### Request

```http
GET /v1/crews/search?keyword=서울&page=0&size=20
Authorization: Bearer {token}
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| `keyword` | String | ✅ | - | 검색 키워드 (크루 이름) |
| `page` | Integer | ❌ | 0 | 페이지 번호 |
| `size` | Integer | ❌ | 20 | 페이지 크기 |

#### Response (200 OK)

크루 목록 조회와 동일한 페이징 응답 구조

---

### 📌 3. 크루 상세 조회

#### Request

```http
GET /v1/crews/{crewId}
```

#### Response (200 OK)

```json
{
  "id": 123,
  "name": "서울 러닝 크루",
  "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
  "maxMembers": 20,
  "currentMembers": 10,
  "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg",
  "isActive": true,
  "ownerId": 456,
  "ownerNickname": "김러너",
  "createdAt": "2025-01-21T10:00:00",
  "updatedAt": "2025-01-21T10:00:00"
}
```

---

### 👤 4. 내가 속한 크루 목록

#### Request

```http
GET /v1/crews/my?page=0&size=20
Authorization: Bearer {token}
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| `page` | Integer | ❌ | 0 | 페이지 번호 |
| `size` | Integer | ❌ | 20 | 페이지 크기 |

#### Response (200 OK)

```json
{
  "content": [
    {
      "id": 123,
      "name": "서울 러닝 크루",
      "description": "함께 달리며 건강한 라이프스타일을 추구하는 크루입니다",
      "maxMembers": 20,
      "currentMembers": 10,
      "profileImageUrl": "https://cloudfront.example.com/crews/123/profile.jpg",
      "ownerNickname": "김러너",
      "createdAt": "2025-01-21T10:00:00",
      "canJoin": false
    }
  ],
  "totalElements": 3,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

---

## 프론트엔드 구현 예시

### React Native 예시

#### 1. 크루 생성 (프로필 이미지 포함)

```typescript
// 크루 생성 화면
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface CrewFormData {
  name: string;
  description: string;
  maxMembers: number;
  profileImage?: ImagePicker.ImagePickerAsset;
}

const CreateCrewScreen = () => {
  const [formData, setFormData] = useState<CrewFormData>({
    name: '',
    description: '',
    maxMembers: 50,
  });
  const [loading, setLoading] = useState(false);

  // 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profileImage: result.assets[0] });
    }
  };

  // 크루 생성
  const createCrew = async () => {
    setLoading(true);

    try {
      let profileImageUrl = null;

      // 1. 이미지가 있으면 업로드
      if (formData.profileImage) {
        // 1-1. 임시 크루 생성 (이미지 없이)
        const tempCrewResponse = await api.post('/v1/crews', {
          name: formData.name,
          description: formData.description,
          maxMembers: formData.maxMembers,
        });
        const crewId = tempCrewResponse.data.id;

        // 1-2. Presigned URL 발급
        const presignResponse = await api.post(`/v1/files/presign/crew/${crewId}`, {
          contentType: formData.profileImage.mimeType || 'image/jpeg',
          size: formData.profileImage.fileSize,
        });

        // 1-3. S3에 이미지 업로드
        const imageBlob = await fetch(formData.profileImage.uri).then(r => r.blob());
        await fetch(presignResponse.data.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': formData.profileImage.mimeType || 'image/jpeg',
          },
          body: imageBlob,
        });

        profileImageUrl = presignResponse.data.download_url;

        // 1-4. 크루 정보 업데이트 (이미지 URL 저장)
        await api.put(`/v1/crews/${crewId}`, {
          profileImageUrl,
        });

        // 성공
        Alert.alert('성공', '크루가 생성되었습니다!');
        navigation.navigate('CrewDetail', { crewId });
      } else {
        // 2. 이미지 없이 크루 생성
        const response = await api.post('/v1/crews', {
          name: formData.name,
          description: formData.description,
          maxMembers: formData.maxMembers,
        });

        Alert.alert('성공', '크루가 생성되었습니다!');
        navigation.navigate('CrewDetail', { crewId: response.data.id });
      }
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* 프로필 이미지 */}
      <TouchableOpacity onPress={pickImage}>
        {formData.profileImage ? (
          <Image source={{ uri: formData.profileImage.uri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>프로필 이미지 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 크루 이름 */}
      <TextInput
        placeholder="크루 이름 (최대 50자)"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        maxLength={50}
      />

      {/* 크루 소개 */}
      <TextInput
        placeholder="크루 소개 (최대 500자)"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        maxLength={500}
        multiline
      />

      {/* 최대 인원 */}
      <View>
        <Text>최대 인원: {formData.maxMembers}명</Text>
        <Slider
          minimumValue={2}
          maximumValue={100}
          step={1}
          value={formData.maxMembers}
          onValueChange={(value) => setFormData({ ...formData, maxMembers: value })}
        />
      </View>

      {/* 생성 버튼 */}
      <Button
        title={loading ? '생성 중...' : '크루 생성'}
        onPress={createCrew}
        disabled={loading || !formData.name}
      />
    </ScrollView>
  );
};
```

---

#### 2. 크루 수정

```typescript
// 크루 수정 화면
const EditCrewScreen = ({ route }) => {
  const { crewId } = route.params;
  const [crew, setCrew] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    profileImageUrl: null,
  });
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 크루 정보 로드
  useEffect(() => {
    loadCrew();
  }, []);

  const loadCrew = async () => {
    const response = await api.get(`/v1/crews/${crewId}`);
    setCrew(response.data);
    setFormData({
      name: response.data.name,
      description: response.data.description,
      maxMembers: response.data.maxMembers,
      profileImageUrl: response.data.profileImageUrl,
    });
  };

  // 새 이미지 선택
  const pickNewImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0]);
    }
  };

  // 이미지 삭제
  const deleteImage = async () => {
    try {
      await api.delete(`/v1/files/crew/${crewId}/profile`);
      setFormData({ ...formData, profileImageUrl: null });
      setNewImage(null);
      Alert.alert('성공', '프로필 이미지가 삭제되었습니다.');
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  // 크루 정보 수정
  const updateCrew = async () => {
    setLoading(true);

    try {
      let profileImageUrl = formData.profileImageUrl;

      // 새 이미지가 있으면 업로드
      if (newImage) {
        // 1. Presigned URL 발급
        const presignResponse = await api.post(`/v1/files/presign/crew/${crewId}`, {
          contentType: newImage.mimeType || 'image/jpeg',
          size: newImage.fileSize,
        });

        // 2. S3에 업로드
        const imageBlob = await fetch(newImage.uri).then(r => r.blob());
        await fetch(presignResponse.data.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': newImage.mimeType || 'image/jpeg',
          },
          body: imageBlob,
        });

        profileImageUrl = presignResponse.data.download_url;
      }

      // 3. 크루 정보 업데이트
      await api.put(`/v1/crews/${crewId}`, {
        name: formData.name,
        description: formData.description,
        maxMembers: formData.maxMembers,
        profileImageUrl,
      });

      Alert.alert('성공', '크루 정보가 수정되었습니다!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* 프로필 이미지 */}
      <View>
        {(newImage || formData.profileImageUrl) ? (
          <Image
            source={{ uri: newImage?.uri || formData.profileImageUrl }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>프로필 이미지 없음</Text>
          </View>
        )}

        <Button title="이미지 변경" onPress={pickNewImage} />
        {formData.profileImageUrl && (
          <Button title="이미지 삭제" onPress={deleteImage} color="red" />
        )}
      </View>

      {/* 나머지 폼 필드 */}
      <TextInput
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <Button title="저장" onPress={updateCrew} disabled={loading} />
    </ScrollView>
  );
};
```

---

#### 3. 크루 목록 조회 (무한 스크롤)

```typescript
// 크루 목록 화면
const CrewListScreen = () => {
  const [crews, setCrews] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await api.get('/v1/crews', {
        params: {
          page,
          size: 20,
          sort: 'createdAt',
          direction: 'desc',
        },
      });

      setCrews([...crews, ...response.data.content]);
      setPage(page + 1);
      setHasMore(!response.data.last);
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={crews}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CrewDetail', { crewId: item.id })}
        >
          <View style={styles.crewCard}>
            {item.profileImageUrl && (
              <Image
                source={{ uri: item.profileImageUrl }}
                style={styles.crewImage}
              />
            )}
            <View style={styles.crewInfo}>
              <Text style={styles.crewName}>{item.name}</Text>
              <Text style={styles.crewDescription}>{item.description}</Text>
              <Text style={styles.crewMembers}>
                {item.currentMembers}/{item.maxMembers}명
              </Text>
              <Text style={styles.crewOwner}>크루장: {item.ownerNickname}</Text>
              {item.canJoin && (
                <Text style={styles.canJoinBadge}>가입 가능</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
      onEndReached={loadCrews}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading && <ActivityIndicator />}
    />
  );
};
```

---

## 에러 처리

### 공통 에러 응답

```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

### HTTP 상태 코드

| 코드 | 의미 | 발생 시점 |
|------|------|----------|
| `200` | 성공 | 조회, 수정 성공 |
| `201` | 생성됨 | 크루 생성 성공 |
| `204` | 내용 없음 | 삭제 성공 |
| `400` | 잘못된 요청 | 유효성 검증 실패 (이름 너무 길거나, 파일 크기 초과 등) |
| `401` | 인증 실패 | 토큰 없음 또는 만료 |
| `403` | 권한 없음 | 크루장이 아닌데 수정/삭제 시도 |
| `404` | 찾을 수 없음 | 존재하지 않는 크루 ID |

---

### 에러 처리 예시

```typescript
// API 호출 래퍼
const api = {
  async post(url, data) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || '오류가 발생했습니다');
      }

      return json;
    } catch (error) {
      // 네트워크 오류
      if (error.message === 'Network request failed') {
        throw new Error('네트워크 연결을 확인해주세요');
      }
      throw error;
    }
  },
};

// 사용 예시
try {
  const response = await api.post('/v1/crews', formData);
  Alert.alert('성공', '크루가 생성되었습니다!');
} catch (error) {
  if (error.message.includes('크루 이름')) {
    Alert.alert('오류', '크루 이름이 너무 깁니다 (최대 50자)');
  } else if (error.message.includes('권한')) {
    Alert.alert('오류', '크루장만 수정할 수 있습니다');
  } else {
    Alert.alert('오류', error.message);
  }
}
```

---

## 📝 체크리스트

### 크루 생성 시

- [ ] 크루 이름 입력 (필수, 최대 50자)
- [ ] 크루 소개 입력 (선택, 최대 500자)
- [ ] 최대 인원 설정 (2~100명)
- [ ] 프로필 이미지 선택 (선택)
  - [ ] Presigned URL 발급
  - [ ] S3에 이미지 업로드
  - [ ] 크루 정보 업데이트 (이미지 URL 저장)
- [ ] 생성 완료 후 크루 상세 화면으로 이동

### 크루 수정 시

- [ ] 크루장 권한 확인
- [ ] 기존 정보 로드
- [ ] 수정할 필드만 전송 (나머지는 기존 값 유지)
- [ ] 이미지 변경 시:
  - [ ] 새 Presigned URL 발급
  - [ ] 새 이미지 업로드
  - [ ] 크루 정보 업데이트
- [ ] 이미지 삭제 시:
  - [ ] DELETE 요청으로 S3 + DB 동시 삭제

### 크루 목록 조회 시

- [ ] 페이징 처리 (무한 스크롤 또는 페이지네이션)
- [ ] 로딩 상태 표시
- [ ] `canJoin` 필드로 가입 가능 여부 표시
- [ ] 프로필 이미지 캐싱

---

## 🎯 요약

### 크루 프로필 이미지 업로드 흐름

```
1. POST /v1/files/presign/crew/{crewId}
   → Presigned URL 발급

2. PUT {upload_url}
   → S3에 이미지 업로드

3. PUT /v1/crews/{crewId}
   { "profileImageUrl": "{download_url}" }
   → DB에 URL 저장
```

### 주요 API 엔드포인트

| 기능 | 메서드 | 엔드포인트 | 권한 |
|------|--------|----------|------|
| 크루 생성 | POST | `/v1/crews` | 로그인 |
| 크루 수정 | PUT | `/v1/crews/{crewId}` | 크루장 |
| 크루 삭제 | DELETE | `/v1/crews/{crewId}` | 크루장 |
| 크루 조회 | GET | `/v1/crews/{crewId}` | 모두 |
| 크루 목록 | GET | `/v1/crews` | 모두 |
| 내 크루 | GET | `/v1/crews/my` | 로그인 |
| 이미지 업로드 | POST | `/v1/files/presign/crew/{crewId}` | 크루장 |
| 이미지 삭제 | DELETE | `/v1/files/crew/{crewId}/profile` | 크루장 |

---

**문의사항이 있으시면 백엔드 팀에 연락주세요!** 📧
