# 날씨 API 가이드 (Weather API Guide)

## 개요
WayToEarth 백엔드는 **OpenWeather API**를 통해 날씨 정보를 제공합니다.
프론트엔드에서는 사용자의 GPS 좌표(위도, 경도)를 전달하면 현재 날씨 정보, 온도, 러닝 추천 메시지를 받을 수 있습니다.

---

## API 엔드포인트

### 1. 현재 날씨 조회

**Endpoint:**
```
GET /v1/weather/current
```

**Parameters:**

| 파라미터 | 타입 | 필수 | 범위 | 설명 |
|---------|------|------|------|------|
| `lat` | double | ✅ | -90 ~ 90 | 위도 (Latitude) |
| `lon` | double | ✅ | -180 ~ 180 | 경도 (Longitude) |

**요청 예시:**
```
GET /v1/weather/current?lat=37.5665&lon=126.9780
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "현재 날씨 정보를 성공적으로 조회했습니다.",
  "data": {
    "condition": "CLEAR",
    "iconCode": "01d",
    "emoji": "☀️",
    "temperature": 23.5,
    "fetchedAt": "2025-10-21T14:30:00",
    "recommendation": "맑아요! 모자와 선크림 준비하고 가볍게 달려요."
  }
}
```

---

## 응답 필드 설명

### WeatherCurrentResponse

| 필드 | 타입 | 설명 | 예시 |
|-----|------|------|------|
| `condition` | string (enum) | 날씨 상태 코드 | `"CLEAR"` |
| `iconCode` | string | OpenWeather 아이콘 코드 (옵션) | `"01d"`, `"10d"` |
| `emoji` | string | 날씨 이모지 | `"☀️"`, `"🌧️"` |
| `temperature` | number | 현재 온도 (섭씨, °C) | `23.5` |
| `fetchedAt` | datetime | 조회 시각 (ISO 8601) | `"2025-10-21T14:30:00"` |
| `recommendation` | string | 날씨별 러닝 추천 메시지 | `"맑아요! 모자와 선크림..."` |

---

## 날씨 상태 코드 (WeatherCondition)

| 코드 | 한글명 | 이모지 | 러닝 추천 메시지 |
|------|-------|--------|-----------------|
| `CLEAR` | 맑음 | ☀️ | 맑아요! 모자와 선크림 준비하고 가볍게 달려요. |
| `PARTLY_CLOUDY` | 구름조금 | ⛅ | 구름 조금—달리기 딱 좋아요. |
| `CLOUDY` | 흐림 | ☁️ | 흐려도 컨디션은 굿! 가벼운 바람막이 추천. |
| `RAINY` | 비 | 🌧️ | 비가 와요. 방수 재킷과 미끄럼 주의! |
| `SNOWY` | 눈 | ❄️ | 눈길 조심! 트랙션 좋은 신발을 신어주세요. |
| `FOGGY` | 안개 | 🌫️ | 안개—가시성 주의, 밝은 색 착용 권장. |
| `THUNDERSTORM` | 천둥번개 | ⛈️ | 뇌우—실내 러닝으로 대체하는 게 안전합니다. |
| `UNKNOWN` | 알수없음 | ❓ | 컨디션 파악 중—몸 상태에 맞춰 무리하지 마세요. |

---

## 프론트엔드 구현 가이드

### 1. 사용자 위치 정보 가져오기

```javascript
// 브라우저 Geolocation API 사용
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetchWeather(lat, lon);
  },
  (error) => {
    console.error("위치 정보를 가져올 수 없습니다:", error);
  }
);
```

### 2. 날씨 API 호출

```javascript
async function fetchWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.waytoearth.com/v1/weather/current?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      throw new Error('날씨 정보를 가져오는데 실패했습니다.');
    }

    const result = await response.json();

    if (result.success) {
      const weather = result.data;
      displayWeather(weather);
    }
  } catch (error) {
    console.error('날씨 API 호출 오류:', error);
  }
}
```

### 3. 날씨 정보 표시

```javascript
function displayWeather(weather) {
  // 이모지 표시
  document.getElementById('weather-emoji').textContent = weather.emoji;

  // 온도 표시
  document.getElementById('temperature').textContent =
    weather.temperature ? `${Math.round(weather.temperature)}°C` : '-';

  // 날씨 상태 텍스트 표시
  const conditionText = {
    'CLEAR': '맑음',
    'PARTLY_CLOUDY': '구름조금',
    'CLOUDY': '흐림',
    'RAINY': '비',
    'SNOWY': '눈',
    'FOGGY': '안개',
    'THUNDERSTORM': '천둥번개',
    'UNKNOWN': '알 수 없음'
  };
  document.getElementById('weather-condition').textContent =
    conditionText[weather.condition];

  // 러닝 추천 메시지 표시
  document.getElementById('weather-recommendation').textContent =
    weather.recommendation;
}
```

### 4. React 예시

```jsx
import { useState, useEffect } from 'react';

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.waytoearth.com/v1/weather/current?lat=${latitude}&lon=${longitude}`
          );
          const result = await response.json();

          if (result.success) {
            setWeather(result.data);
          } else {
            setError('날씨 정보를 가져올 수 없습니다.');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('위치 정보를 가져올 수 없습니다.');
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <div>날씨 정보를 불러오는 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!weather) return null;

  return (
    <div className="weather-widget">
      <div className="weather-emoji">{weather.emoji}</div>
      <div className="temperature">
        {weather.temperature ? `${Math.round(weather.temperature)}°C` : '-'}
      </div>
      <div className="weather-recommendation">
        {weather.recommendation}
      </div>
    </div>
  );
}
```

---

## OpenWeather 아이콘 코드 활용

OpenWeather API의 아이콘 코드(`iconCode`)를 사용하여 더 상세한 날씨 아이콘을 표시할 수 있습니다.

**아이콘 URL 형식:**
```
https://openweathermap.org/img/wn/{iconCode}@2x.png
```

**예시:**
```html
<img
  src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
  alt="날씨 아이콘"
/>
```

**주요 아이콘 코드:**
- `01d` / `01n`: 맑음 (낮/밤)
- `02d` / `02n`: 구름 조금 (낮/밤)
- `03d` / `03n`: 흐림
- `04d` / `04n`: 구름 많음
- `09d` / `09n`: 소나기
- `10d` / `10n`: 비
- `11d` / `11n`: 천둥번개
- `13d` / `13n`: 눈
- `50d` / `50n`: 안개

> **참고:** `d`는 낮(day), `n`은 밤(night)을 의미합니다.

---

## 에러 처리

### API 키 미설정 시
백엔드에 OpenWeather API 키가 설정되지 않은 경우, 다음과 같은 기본 응답을 반환합니다:

```json
{
  "success": true,
  "message": "현재 날씨 정보를 성공적으로 조회했습니다.",
  "data": {
    "condition": "UNKNOWN",
    "iconCode": null,
    "emoji": "❓",
    "temperature": null,
    "fetchedAt": "2025-10-21T14:30:00",
    "recommendation": "컨디션 파악 중—몸 상태에 맞춰 무리하지 마세요."
  }
}
```

### 외부 API 호출 실패 시
OpenWeather API 호출이 실패하더라도 백엔드는 안전한 기본값을 반환하므로, 프론트엔드에서는 항상 정상 응답을 받을 수 있습니다.

### 유효성 검증 실패 시
위도/경도 값이 유효 범위를 벗어나는 경우 `400 Bad Request` 응답을 받습니다.

---

## 온도 정보 활용 예시

### 온도에 따른 UI 스타일링
```javascript
function getTemperatureColor(temp) {
  if (temp === null) return '#999';
  if (temp >= 30) return '#ff4444';  // 매우 더움 (빨강)
  if (temp >= 25) return '#ff8800';  // 더움 (주황)
  if (temp >= 20) return '#ffcc00';  // 따뜻함 (노랑)
  if (temp >= 15) return '#88cc00';  // 선선함 (연두)
  if (temp >= 10) return '#00aaff';  // 시원함 (하늘)
  if (temp >= 5) return '#0066cc';   // 추움 (파랑)
  return '#0044aa';                  // 매우 추움 (진한 파랑)
}
```

### 온도별 러닝 복장 추천
```javascript
function getClothingRecommendation(temp) {
  if (temp === null) return null;
  if (temp >= 25) return '반팔 + 반바지';
  if (temp >= 20) return '반팔 + 반바지/긴바지';
  if (temp >= 15) return '긴팔 + 긴바지';
  if (temp >= 10) return '긴팔 + 긴바지 + 얇은 바람막이';
  if (temp >= 5) return '긴팔 + 긴바지 + 바람막이';
  return '긴팔 + 긴바지 + 방한 재킷';
}
```

---

## 테스트 좌표

### 서울
```
lat=37.5665&lon=126.9780
```

### 부산
```
lat=35.1796&lon=129.0756
```

### 제주
```
lat=33.4996&lon=126.5312
```

---

## Swagger 문서

API의 더 자세한 정보는 Swagger UI에서 확인할 수 있습니다:

```
http://localhost:8080/swagger-ui.html
```

**그룹:** `07. 날씨 API`

---

## 추가 정보

- **인증:** 현재 날씨 API는 별도의 인증이 필요하지 않습니다.
- **Rate Limiting:** 백엔드에서 OpenWeather API를 호출하므로, OpenWeather의 무료 플랜 제한(분당 60회)을 고려하여 사용하세요.
- **캐싱:** 현재 캐싱이 구현되어 있지 않으므로, 프론트엔드에서 적절한 캐싱 전략을 고려하세요.
- **온도 단위:** 모든 온도 값은 섭씨(°C) 단위입니다.

---

## 문의

API 사용 중 문제가 발생하거나 추가 기능이 필요한 경우, 백엔드 팀에 문의해주세요.
