// assets/apis/getTrends.ts
export const getLocation = async () => {
  return {
    data: [
      {
        latitude: 37.5665,
        longitude: 126.978,
        location: "서울 시청",
        happiestActivity: "자전거 타기",
      },
      {
        latitude: 35.1796,
        longitude: 129.0756,
        location: "부산",
        happiestActivity: "해수욕",
      },
    ],
  };
};
