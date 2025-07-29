import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

type Coord = { latitude: number; longitude: number };

export default function RunTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const mapRef = useRef<MapView>(null);

  const startRunning = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("위치 권한이 필요합니다.");
      return;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newCoord = { latitude, longitude };

        setRouteCoords((prev) => [...prev, newCoord]);

        if (!region) {
          setRegion({
            ...newCoord,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // 지도 위치 갱신
        mapRef.current?.animateToRegion({
          ...newCoord,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    );

    setSubscription(sub);
    setIsRunning(true);
  };

  const stopRunning = () => {
    subscription?.remove();
    setSubscription(null);
    setIsRunning(false);
  };

  const zoomIn = () => {
    if (region) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion);
    }
  };

  const zoomOut = () => {
    if (region) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {region ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation
        >
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="#007AFF" // 원하는 단색
            />
          )}
          {routeCoords.length > 0 && (
            <>
              <Marker coordinate={routeCoords[0]} title="출발 지점" />
              <Marker
                coordinate={routeCoords[routeCoords.length - 1]}
                title="현재 위치"
              />
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.placeholder}>
          <Text>위치 정보를 불러오는 중...</Text>
        </View>
      )}

      {/* 확대/축소 버튼 */}
      <View style={styles.zoomButtons}>
        <TouchableOpacity onPress={zoomIn} style={styles.zoomBtn}>
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={zoomOut} style={styles.zoomBtn}>
          <Text style={styles.zoomText}>－</Text>
        </TouchableOpacity>
      </View>

      {/* 시작/정지 버튼 */}
      <View style={styles.controlButton}>
        {!isRunning ? (
          <TouchableOpacity onPress={startRunning} style={styles.startBtn}>
            <Text style={styles.buttonText}>🏃 러닝 시작</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stopRunning} style={styles.stopBtn}>
            <Text style={styles.buttonText}>🛑 정지</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  startBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  stopBtn: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  zoomButtons: {
    position: "absolute",
    right: 20,
    top: 100,
    gap: 12,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  zoomText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
