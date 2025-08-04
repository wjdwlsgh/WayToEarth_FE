import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

const { width, height } = Dimensions.get("window");

interface LocationData {
  latitude: number;
  longitude: number;
  title: string;
}

// 사용자 프로필 아이콘
const ProfileIcon = () => (
  <TouchableOpacity style={styles.profileButton}>
    <View style={styles.profileCircle}>
      <Text style={styles.profileIcon}>👤</Text>
    </View>
  </TouchableOpacity>
);

// 위치 마커들
const LocationMarkers = () => {
  const locations: LocationData[] = [
    { latitude: 37.8813, longitude: 127.7299, title: "한림대학교" },
    { latitude: 37.885, longitude: 127.735, title: "춘천여자고등학교" },
    { latitude: 37.89, longitude: 127.74, title: "박물관" },
  ];

  return (
    <>
      {locations.map((location, index) => (
        <Marker
          key={index}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.title}
        >
          <View style={styles.customMarker}>
            <View style={styles.markerDot} />
            <Text style={styles.markerText}>{location.title}</Text>
          </View>
        </Marker>
      ))}
    </>
  );
};

// 하단 모달 컴포넌트
const RunningModal = ({
  visible,
  onClose,
  onRunningStart,
  onVirtualRunningStart,
}: {
  visible: boolean;
  onClose: () => void;
  onRunningStart: () => void;
  onVirtualRunningStart: () => void;
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalHandle} />

          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={styles.runningOption}
              onPress={onRunningStart}
              activeOpacity={0.8}
            >
              <View style={styles.optionIconContainer}>
                <Text style={styles.optionIcon}>🏃‍♂️</Text>
              </View>
              <Text style={styles.optionText}>러닝</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.virtualRunningOption}
              onPress={onVirtualRunningStart}
              activeOpacity={0.8}
            >
              <View style={styles.optionIconContainer}>
                <Text style={styles.optionIcon}>🎮</Text>
              </View>
              <Text style={styles.optionText}>가상 러닝</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function <MapScreen>() {
  const [showModal, setShowModal] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 37.8813, // 한림대학교 좌표
    longitude: 127.7299,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const handleStartPress = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleRunningStart = () => {
    setShowModal(false);
    console.log("러닝 시작!");
    // 러닝 화면으로 네비게이션
  };

  const handleVirtualRunningStart = () => {
    setShowModal(false);
    console.log("가상 러닝 시작!");
    // 가상 러닝 화면으로 네비게이션
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* 상단 프로필 버튼 */}
      <View style={styles.topBar}>
        <ProfileIcon />
      </View>

      {/* 구글 맵 */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
      >
        <LocationMarkers />
      </MapView>

      {/* 시작 버튼 */}
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPress}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>시작</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 탭바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={styles.tabLabel}>대결</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>👑</Text>
          <Text style={styles.tabLabel}>크루</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Text style={styles.tabIcon}>🏃</Text>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>러닝</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>피드</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>📈</Text>
          <Text style={styles.tabLabel}>기록</Text>
        </TouchableOpacity>
      </View>

      {/* 러닝 옵션 모달 */}
      <RunningModal
        visible={showModal}
        onClose={handleModalClose}
        onRunningStart={handleRunningStart}
        onVirtualRunningStart={handleVirtualRunningStart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topBar: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  profileButton: {
    padding: 8,
  },
  profileCircle: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileIcon: {
    fontSize: 20,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: "center",
  },
  markerDot: {
    width: 12,
    height: 12,
    backgroundColor: "#4A90E2",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  markerText: {
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },
  startButtonContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  activeTab: {
    // 활성 탭 스타일
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: "#666666",
  },
  activeTabLabel: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CCCCCC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  optionContainer: {
    flexDirection: "row",
    gap: 16,
  },
  runningOption: {
    flex: 1,
    backgroundColor: "#333333",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  virtualRunningOption: {
    flex: 1,
    backgroundColor: "#E5E5E5",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconContainer: {
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
});
