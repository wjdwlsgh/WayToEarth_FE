import React, { useEffect, useRef, useState } from "react";
import MapView, {
  Marker,
  Polyline,
  LatLng as RNLatLng,
} from "react-native-maps";
import { StyleSheet, View, Text } from "react-native";
import type { LatLng } from "../../types/types";

type JourneyLandmark = {
  id: string;
  name: string;
  position: LatLng;
  distance: string;
  reached: boolean;
};

type Props = {
  // 여정 경로 (미리 정의된 전체 경로)
  journeyRoute: LatLng[];
  // 랜드마크 목록
  landmarks: JourneyLandmark[];
  // 사용자 현재 러닝 경로
  userRoute: LatLng[];
  // 현재 위치
  currentLocation: LatLng | null;
  // 진행률 (0~100)
  progressPercent: number;
  // 지도 준비 완료 콜백
  onMapReady?: () => void;
  // 스냅샷 바인딩
  onBindSnapshot?: (fn: () => Promise<string | null>) => void;
};

export default function JourneyMapRoute({
  journeyRoute,
  landmarks,
  userRoute,
  currentLocation,
  progressPercent,
  onMapReady,
  onBindSnapshot,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // 초기 지도 중심 설정 (여정 시작 지점)
  const initialCenter: RNLatLng =
    journeyRoute[0] || { latitude: 37.5665, longitude: 126.978 };

  // 지도 준비 완료 시 전체 경로가 보이도록 fitToCoordinates
  useEffect(() => {
    if (!mapReady || journeyRoute.length === 0) return;

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(journeyRoute as RNLatLng[], {
        edgePadding: { top: 120, right: 80, bottom: 200, left: 80 },
        animated: true,
      });
    }, 300);
  }, [mapReady, journeyRoute]);

  // 스냅샷 바인딩
  useEffect(() => {
    if (!onBindSnapshot) return;
    onBindSnapshot(async () => {
      if (!mapRef.current) return null;
      try {
        const uri = await (mapRef.current as any).takeSnapshot?.({
          width: 700,
          height: 360,
          format: "png",
          result: "file",
          quality: 1,
        });
        return (uri as string) ?? null;
      } catch (e) {
        console.warn("스냅샷 실패:", e);
        return null;
      }
    });
  }, [onBindSnapshot]);

  const handleMapReady = () => {
    setMapReady(true);
    onMapReady?.();
  };

  // 진행률에 따라 완료된 경로 구간 계산
  const completedRouteLength = Math.floor(
    (journeyRoute.length * progressPercent) / 100
  );
  const completedRoute = journeyRoute.slice(0, Math.max(1, completedRouteLength));
  const remainingRoute = journeyRoute.slice(Math.max(0, completedRouteLength - 1));

  console.log("[JourneyMapRoute] 전체 경로:", journeyRoute.length);
  console.log("[JourneyMapRoute] 완료 경로:", completedRoute.length);
  console.log("[JourneyMapRoute] 남은 경로:", remainingRoute.length);
  console.log("[JourneyMapRoute] 랜드마크:", landmarks.length);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: initialCenter.latitude,
        longitude: initialCenter.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      showsMyLocationButton
      onMapReady={handleMapReady}
      loadingEnabled
      loadingIndicatorColor="#6366F1"
      loadingBackgroundColor="#f9fafb"
    >
      {/* 완료된 여정 경로 (초록색) */}
      {completedRoute.length > 1 && (
        <Polyline
          coordinates={completedRoute as RNLatLng[]}
          strokeWidth={6}
          strokeColor="#10B981"
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* 남은 여정 경로 (회색 점선) */}
      {remainingRoute.length > 1 && (
        <Polyline
          coordinates={remainingRoute as RNLatLng[]}
          strokeWidth={5}
          strokeColor="#94A3B8"
          lineDashPattern={[10, 5]}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* 사용자 실제 러닝 경로 (파란색) */}
      {userRoute.length > 1 && (
        <Polyline
          coordinates={userRoute as RNLatLng[]}
          strokeWidth={5}
          strokeColor="#3B82F6"
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* 랜드마크 마커 */}
      {landmarks.map((landmark, index) => (
        <Marker
          key={landmark.id}
          coordinate={landmark.position as RNLatLng}
          title={landmark.name}
          description={landmark.distance}
        >
          <View
            style={[
              styles.landmarkMarker,
              landmark.reached
                ? styles.landmarkMarkerReached
                : styles.landmarkMarkerPending,
            ]}
          >
            {landmark.reached ? (
              <Text style={styles.landmarkIconReached}>✓</Text>
            ) : (
              <Text style={styles.landmarkIconPending}>{index + 1}</Text>
            )}
          </View>
        </Marker>
      ))}

      {/* 현재 위치 마커 */}
      {currentLocation && (
        <Marker
          coordinate={currentLocation as RNLatLng}
          title="현재 위치"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.currentLocationMarker}>
            <View style={styles.currentLocationDot} />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  landmarkMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  landmarkMarkerReached: {
    backgroundColor: "#10B981",
  },
  landmarkMarkerPending: {
    backgroundColor: "#6366F1",
  },
  landmarkIconReached: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  landmarkIconPending: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
