import React, { useEffect, useRef, useState, useCallback } from "react";
import MapView, {
  Marker,
  Polyline,
  LatLng as RNLatLng,
} from "react-native-maps";
import { StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import type { LatLng } from "../../types/types";

type Props = {
  route: LatLng[];
  last: LatLng | null;
  liveMode?: boolean;
  onBindCenter?: (fn: (p: LatLng) => void) => void;
  onBindSnapshot?: (fn: () => Promise<string | null>) => void;
  useCurrentLocationOnMount?: boolean;
  onMapReady?: () => void;
};

export default function MapRoute({
  route,
  last,
  liveMode = true,
  onBindCenter,
  onBindSnapshot,
  useCurrentLocationOnMount = true,
  onMapReady,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const [initial, setInitial] = useState<RNLatLng | null>(null);
  const [locationLoading, setLocationLoading] = useState(
    useCurrentLocationOnMount
  );

  // 🔒 초기 줌 1회만
  const didInitCamera = useRef(false);
  // 👣 사용자 제스처 시 팔로우 해제
  const followCenter = useRef(true);
  const followResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopFollowingTemporarily = useCallback((ms = 4000) => {
    followCenter.current = false;
    if (followResumeTimer.current) clearTimeout(followResumeTimer.current);
    followResumeTimer.current = setTimeout(() => {
      followCenter.current = true;
    }, ms);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      if (!useCurrentLocationOnMount) {
        const defaultCenter = (last as RNLatLng) || {
          latitude: 37.5665,
          longitude: 126.978,
        };
        setInitial(defaultCenter);
        setLocationLoading(false);
        onMapReady?.();
        return;
      }

      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("위치 권한이 필요합니다.");
          const defaultCenter = (last as RNLatLng) || {
            latitude: 37.5665,
            longitude: 126.978,
          };
          setInitial(defaultCenter);
          setLocationLoading(false);
          onMapReady?.();
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        if (!mounted) return;

        const center = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setInitial(center);
        setLocationLoading(false);
        onMapReady?.();

        setTimeout(() => {
          if (mounted && mapRef.current) {
            mapRef.current.animateCamera(
              { center, zoom: 16 },
              { duration: 500 }
            );
            didInitCamera.current = true; // 이후로 줌은 건드리지 않음
          }
        }, 100);
      } catch (e) {
        console.warn("위치 가져오기 실패:", e);
        const defaultCenter = (last as RNLatLng) || {
          latitude: 37.5665,
          longitude: 126.978,
        };
        setInitial(defaultCenter);
        setLocationLoading(false);
        onMapReady?.();
      }
    };

    initializeLocation();
    return () => {
      mounted = false;
      if (followResumeTimer.current) clearTimeout(followResumeTimer.current);
    };
  }, [useCurrentLocationOnMount, last, onMapReady]);

  // 부모에서 카메라 이동 요청: 센터만 이동(줌 보존)
  useEffect(() => {
    if (!onBindCenter) return;
    onBindCenter((p) => {
      if (!mapRef.current) return;
      if (!followCenter.current) return;
      mapRef.current.animateCamera(
        didInitCamera.current
          ? { center: p as RNLatLng }
          : { center: p as RNLatLng, zoom: 16 },
        { duration: 300 }
      );
      didInitCamera.current = true;
    });
  }, [onBindCenter]);

  // 스냅샷 바인딩(요약용)
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
    if (!locationLoading && !useCurrentLocationOnMount) {
      onMapReady?.();
    }
  };

  const init = initial ||
    (last as RNLatLng) || { latitude: 37.5665, longitude: 126.978 };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: init.latitude,
        longitude: init.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation
      showsMyLocationButton
      onMapReady={handleMapReady}
      loadingEnabled
      loadingIndicatorColor="#3B82F6"
      loadingBackgroundColor="#f9fafb"
      zoomEnabled
      scrollEnabled
      rotateEnabled={false}
      // 🖐️ 사용자 제스처 시 팔로우 해제 → 줌/프레이밍 유지
      onPanDrag={() => stopFollowingTemporarily()}
      onTouchStart={() => stopFollowingTemporarily()}
    >
      {/* 라이브 모드에서는 마커 숨김 (showsUserLocation의 파란 마커만 사용) */}
      {!liveMode && last && (
        <Marker
          coordinate={last as RNLatLng}
          title="위치"
        />
      )}
      {route.length > 1 && (
        <Polyline
          coordinates={route as RNLatLng[]}
          strokeWidth={5}
          strokeColor="#2563eb"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
