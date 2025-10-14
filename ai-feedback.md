# 🤖 러닝 AI 분석 API 가이드

## 📋 목차
1. [개요](#개요)
2. [API 엔드포인트](#api-엔드포인트)
3. [요청/응답 예시](#요청응답-예시)
4. [에러 처리](#에러-처리)
5. [사용 시나리오](#사용-시나리오)
6. [제약사항](#제약사항)

---

## 개요

### 기능 설명
- OpenAI GPT-3.5-turbo를 활용한 러닝 기록 분석
- 과거 최대 10개의 러닝 기록과 비교하여 성장 패턴 분석
- 구체적인 수치 기반 피드백 제공 (거리, 페이스, 시간 등)
- 개선 목표 제시

### 주요 특징
✅ **데이터 기반 분석**: 단순 칭찬이 아닌 과거 대비 성장률 계산
✅ **비용 최적화**: 한 번 분석된 기록은 캐싱 (재분석 없음)
✅ **사용량 제한**: 사용자당 일일 10회 제한
✅ **친근한 톤**: 반말, 구체적 수치, 격려

---

## API 엔드포인트

### 1. AI 분석 생성 (POST)

**새로운 AI 분석을 생성합니다.**

```http
POST /v1/running/analysis/{runningRecordId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Path Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `runningRecordId` | Long | ✅ | 분석할 러닝 기록 ID |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "AI 분석이 완료되었습니다.",
  "data": {
    "feedbackId": 1,
    "runningRecordId": 123,
    "feedbackContent": "오늘 5.2km를 29분 30초에 완주했네! 이전 평균 4.8km보다 400m 더 달렸고, 평균 페이스는 5:40/km로 지난주 대비 15초 단축됐어. 특히 최장 거리 기록을 경신한 점이 인상적이야. 다음 목표로 6km 도전하면서 페이스 5:30/km를 유지해보는 건 어때? 꾸준히 성장하고 있으니 이 페이스 유지하면 좋겠어!",
    "createdAt": "2025-10-05T14:23:45",
    "modelName": "gpt-3.5-turbo"
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```

---

### 2. AI 분석 조회 (GET)

**이미 생성된 AI 분석을 조회합니다. (캐싱)**

```http
GET /v1/running/analysis/{runningRecordId}
Authorization: Bearer {JWT_TOKEN}
```

#### Path Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `runningRecordId` | Long | ✅ | 조회할 러닝 기록 ID |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "AI 피드백을 조회했습니다.",
  "data": {
    "feedbackId": 1,
    "runningRecordId": 123,
    "feedbackContent": "오늘 5.2km를 29분 30초에 완주했네! ...",
    "createdAt": "2025-10-05T14:23:45",
    "modelName": "gpt-3.5-turbo"
  },
  "timestamp": "2025-10-05T14:25:12Z"
}
```

---

## 요청/응답 예시

### ✅ 성공 케이스

#### 1. 첫 번째 분석 요청 (POST)
```bash
curl -X POST https://api.waytoearth.com/v1/running/analysis/123 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**응답:**
```json
{
  "success": true,
  "message": "AI 분석이 완료되었습니다.",
  "data": {
    "feedbackId": 1,
    "runningRecordId": 123,
    "feedbackContent": "오늘 3.5km를 22분에 완주했네! 평균 페이스 6:17/km로 안정적으로 달렸어. 최근 5회 평균 3.2km보다 300m 더 달렸고, 페이스도 이전보다 10초 빨라졌어. 다음엔 4km 도전해보면 좋겠어!",
    "createdAt": "2025-10-05T14:23:45",
    "modelName": "gpt-3.5-turbo"
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```

#### 2. 분석 조회 (GET)
```bash
curl -X GET https://api.waytoearth.com/v1/running/analysis/123 \
  -H "Authorization: Bearer eyJhbGc..."
```

**응답:** (POST와 동일한 데이터, OpenAI API 호출 없음)

---

## 에러 처리

### 1️⃣ 완료되지 않은 러닝 기록
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "완료된 러닝 기록만 분석할 수 있습니다.",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: `isCompleted: true`인 러닝 기록만 분석 요청

---

### 2️⃣ 최소 기록 수 부족 (5회 미만)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "AI 분석을 위해서는 최소 5회 이상의 완료된 러닝 기록이 필요합니다. (현재: 3회)",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: 완료된 러닝 기록이 5개 이상일 때 분석 기능 활성화

---

### 3️⃣ 일일 분석 횟수 초과
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "일일 AI 분석 횟수를 초과했습니다. (사용: 10회, 내일 다시 시도해주세요)",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: 자정(00:00 KST) 이후 다시 시도 또는 사용자에게 안내

---

### 4️⃣ 이미 분석된 기록 (POST 요청 시)
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_NICKNAME",
    "message": "이미 AI 분석이 완료된 기록입니다. GET 요청으로 조회하세요.",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: GET 요청으로 변경

---

### 5️⃣ 분석 기록 없음 (GET 요청 시)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "AI 분석 기록이 없습니다. POST 요청으로 새로 분석하세요.",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: POST 요청으로 새로 분석 생성

---

### 6️⃣ 권한 없음 (다른 사용자 기록)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "러닝 기록을 찾을 수 없거나 접근 권한이 없습니다.",
    "details": null
  },
  "timestamp": "2025-10-05T14:23:48Z"
}
```
**해결**: 본인의 러닝 기록만 분석 가능

---

## 사용 시나리오

### 시나리오 1: 러닝 완료 후 바로 분석

```javascript
// 1. 러닝 완료 API 호출
const completeResponse = await fetch('/v1/running/complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sessionId, totalDistance, ... })
});

const { data } = await completeResponse.json();
const runningRecordId = data.id;

// 2. 조건 확인
if (data.totalCompletedCount >= 5) {
  // 3. AI 분석 요청
  try {
    const analysisResponse = await fetch(`/v1/running/analysis/${runningRecordId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (analysisResponse.ok) {
      const { data: feedback } = await analysisResponse.json();
      showFeedback(feedback.feedbackContent);
    } else if (analysisResponse.status === 409) {
      // 이미 분석된 기록 -> GET으로 조회
      const getResponse = await fetch(`/v1/running/analysis/${runningRecordId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { data: feedback } = await getResponse.json();
      showFeedback(feedback.feedbackContent);
    }
  } catch (error) {
    console.error('AI 분석 실패:', error);
  }
} else {
  showMessage(`AI 분석은 ${5 - data.totalCompletedCount}회 더 러닝하면 이용 가능해요!`);
}
```

---

### 시나리오 2: 러닝 상세 화면에서 분석 조회

```javascript
// 러닝 상세 화면 진입
async function loadRunningDetail(runningRecordId) {
  // 1. 러닝 기록 조회
  const runningResponse = await fetch(`/v1/running/records/${runningRecordId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const running = await runningResponse.json();

  // 2. AI 분석 존재 여부 확인 (GET 시도)
  const analysisResponse = await fetch(`/v1/running/analysis/${runningRecordId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (analysisResponse.ok) {
    // AI 분석 있음 -> 표시
    const { data: feedback } = await analysisResponse.json();
    showAIFeedback(feedback);
  } else if (analysisResponse.status === 404) {
    // AI 분석 없음 -> "분석하기" 버튼 표시
    showAnalyzeButton(runningRecordId);
  }
}

// "분석하기" 버튼 클릭
async function analyzeRunning(runningRecordId) {
  showLoading(); // 2-5초 소요

  const response = await fetch(`/v1/running/analysis/${runningRecordId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  hideLoading();

  if (response.ok) {
    const { data: feedback } = await response.json();
    showAIFeedback(feedback);
  } else {
    const error = await response.json();
    showError(error.error.message);
  }
}
```

---

### 시나리오 3: 일일 제한 도달 시 UI 처리

```javascript
async function handleAnalysisLimitError(error) {
  if (error.message.includes('일일 AI 분석 횟수를 초과')) {
    showDialog({
      title: '오늘의 AI 분석을 모두 사용했어요',
      message: '내일 00시에 다시 이용 가능합니다.\n더 많은 분석이 필요하시면 문의해주세요!',
      buttons: ['확인']
    });

    // "AI 분석" 버튼 비활성화 + 안내 메시지
    disableAnalysisButton('내일 00시 이후 이용 가능');
  }
}
```

---

## 제약사항

### 📊 분석 요구사항

| 항목 | 조건 | 설명 |
|------|------|------|
| **완료된 기록** | `isCompleted: true` | 미완료 기록은 분석 불가 |
| **최소 기록 수** | 5회 이상 | 통계적 신뢰성 확보 |
| **과거 기록 참조** | 최근 10개 | 평균/최고 기록 계산용 |

### ⏱️ 성능 특성

| 항목 | 값 | 비고 |
|------|------|------|
| **응답 시간 (POST)** | 2-5초 | OpenAI API 호출 포함 |
| **응답 시간 (GET)** | 100-300ms | DB 조회만 (캐싱) |
| **일일 제한** | 10회/사용자 | 자정(KST) 리셋 |
| **토큰 사용량** | ~800 토큰 | 프롬프트 500 + 응답 300 |

### 💰 비용

| 모델 | 비용 (분석당) | 비고 |
|------|------|------|
| **gpt-3.5-turbo** | ~$0.0014 (약 2원) | 기본 모델 |
| **gpt-4** | ~$0.024 (약 30원) | 업그레이드 시 |

---

## 🎨 UI/UX 권장사항

### 1. AI 분석 버튼 노출 조건
```javascript
// ✅ 표시 조건
- 완료된 러닝 기록
- 총 완료 기록 5회 이상
- 일일 분석 횟수 미초과

// ❌ 숨김 조건
- 미완료 기록
- 총 완료 기록 5회 미만
```

### 2. 로딩 상태 처리
```javascript
// POST 요청 시 반드시 로딩 표시
showLoading("AI가 러닝 기록을 분석하고 있어요..."); // 2-5초
```

### 3. 에러 메시지 친화적 변환

| 서버 에러 | 사용자 메시지 |
|-----------|--------------|
| `완료된 러닝 기록만 분석할 수 있습니다` | `러닝 완료 후 분석할 수 있어요!` |
| `최소 5회 이상...` | `${5-현재}회 더 러닝하면 AI 분석을 이용할 수 있어요!` |
| `일일 AI 분석 횟수를 초과...` | `오늘의 AI 분석을 모두 사용했어요. 내일 다시 만나요! 🌙` |
| `이미 AI 분석이 완료된...` | (자동으로 GET 요청 전환) |

### 4. 피드백 표시 디자인
```
┌─────────────────────────────────┐
│  🤖 AI 코치의 피드백             │
├─────────────────────────────────┤
│                                  │
│  오늘 5.2km를 29분 30초에       │
│  완주했네! 이전 평균 4.8km보다  │
│  400m 더 달렸고, 평균 페이스는   │
│  5:40/km로 지난주 대비 15초     │
│  단축됐어. ...                  │
│                                  │
│  🎯 다음 목표: 6km, 5:30/km    │
│                                  │
└─────────────────────────────────┘
       [다시 분석하기] (비활성화)
```

---

## 🔧 테스트 체크리스트

### POST 요청
- [ ] 5회 이상 완료 기록이 있을 때 성공
- [ ] 5회 미만일 때 적절한 에러 메시지
- [ ] 일일 10회 제한 동작 확인
- [ ] 이미 분석된 기록 재요청 시 409 에러
- [ ] 미완료 기록 분석 시 에러
- [ ] 타인의 기록 분석 시 에러

### GET 요청
- [ ] 분석된 기록 조회 성공
- [ ] 분석 안 된 기록 조회 시 404 에러
- [ ] 응답 속도 (100-300ms 이내)

### UI/UX
- [ ] 로딩 상태 표시 (2-5초)
- [ ] 일일 제한 초과 시 버튼 비활성화
- [ ] 에러 메시지 친화적 변환
- [ ] 5회 미만 시 안내 메시지

---

## 📞 문의

궁금한 점이 있으면 백엔드 팀에 문의하세요!

- API 응답 시간이 5초 이상 걸리는 경우
- 일일 제한 10회로 부족한 경우
- 피드백 품질 개선 요청

---

**마지막 업데이트:** 2025-10-05
