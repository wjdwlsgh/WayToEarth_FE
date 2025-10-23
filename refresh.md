● 프론트엔드 수정 사항 📱

  1. 로그인 응답 구조 변경 ⭐ 필수

  이전:
  {
    "userId": 12345,
    "jwtToken": "eyJhbG...",
    "isNewUser": false,
    "isOnboardingCompleted": true
  }

  변경 후:
  {
    "userId": 12345,
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "isNewUser": false,
    "isOnboardingCompleted": true
  }

  수정 필요:
  - jwtToken → accessToken + refreshToken 으로 변경
  - 로컬 스토리지/AsyncStorage에 두 개의 토큰 모두 저장

  // Before
  localStorage.setItem('token', response.jwtToken);

  // After
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);

  ---
  2. 토큰 재발급 로직 추가 ⭐ 필수

  새로운 엔드포인트: POST /v1/auth/refresh

  Request:
  {
    "refreshToken": "eyJhbG..."
  }

  Response:
  {
    "accessToken": "eyJhbG...",  // 항상 새로 발급
    "refreshToken": "eyJhbG..."  // 7일 이하 남으면 새로 발급, 아니면 null
  }

  구현 방법 (Axios 인터셉터 예시):
  // API 인터셉터 설정
  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // 401 에러이고, 재시도가 아닌 경우
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');

          // 리프레시 토큰으로 새 액세스 토큰 발급
          const response = await axios.post('/v1/auth/refresh', {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // 새 액세스 토큰 저장
          localStorage.setItem('accessToken', accessToken);

          // 리프레시 토큰도 갱신되었으면 저장
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);

        } catch (refreshError) {
          // 리프레시 실패 → 로그인 페이지로
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  ---
  3. 로그아웃 로직 추가 ⭐ 필수

  새로운 엔드포인트: POST /v1/auth/logout (인증 필요)

  Request: 없음 (Authorization 헤더만 필요)

  구현:
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      // 서버에 로그아웃 요청
      await axios.post('/v1/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      // 로컬 토큰 삭제 (서버 요청 실패해도 삭제)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // 로그인 페이지로 이동
      window.location.href = '/login';
    }
  };

  ---
  4. API 요청 시 헤더 변경

  변경 전:
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }

  변경 후:
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }

  ---
  수정 우선순위

  🔴 필수 (당장 수정 필요)

  1. ✅ 로그인 응답에서 jwtToken → accessToken, refreshToken 분리
  2. ✅ 두 토큰 모두 저장하도록 수정
  3. ✅ API 요청 시 accessToken 사용

  🟡 중요 (빠르게 추가 권장)

  4. ✅ 토큰 재발급 인터셉터 구현
  5. ✅ 로그아웃 API 호출

  🟢 선택 (추후 개선)

  6. 토큰 만료 시간 체크 후 사전 갱신 (UX 개선)
  7. 리프레시 토큰도 만료되면 "세션 만료" 메시지 표시

  ---
  React Native 예시 (AsyncStorage)

  import AsyncStorage from '@react-native-async-storage/async-storage';

  // 로그인
  const handleLogin = async (response) => {
    await AsyncStorage.setItem('accessToken', response.accessToken);
    await AsyncStorage.setItem('refreshToken', response.refreshToken);
  };

  // API 호출
  const accessToken = await AsyncStorage.getItem('accessToken');
  axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

  // 로그아웃
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);