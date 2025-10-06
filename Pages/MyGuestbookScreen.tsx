// Pages/MyGuestbookScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import {
  getMyGuestbooks,
  getGuestbookErrorMessage,
} from "../utils/api/guestbook";
import type { GuestbookResponse } from "../types/guestbook";

interface MyGuestbookScreenProps {
  route: {
    params: {
      userId: number;
    };
  };
  navigation: any;
}

/**
 * 내 방명록 목록 화면
 * - 내가 작성한 모든 방명록 표시 (공개/비공개 모두)
 * - 페이징 없음 (전체 목록)
 * - Pull to Refresh
 * - 공개/비공개 배지 표시
 */
export default function MyGuestbookScreen({
  route,
  navigation,
}: MyGuestbookScreenProps) {
  const { userId } = route.params;

  const [guestbooks, setGuestbooks] = useState<GuestbookResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuestbooks();
  }, []);

  const loadGuestbooks = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getMyGuestbooks(userId);
      setGuestbooks(response);
    } catch (err: any) {
      console.error("[MyGuestbook] 조회 실패:", err);
      setError(getGuestbookErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGuestbooks();
  };

  const handleItemPress = (item: GuestbookResponse) => {
    // 랜드마크별 방명록 화면으로 이동
    navigation.navigate("LandmarkGuestbookScreen", {
      landmarkId: item.landmark.id,
      landmarkName: item.landmark.name,
    });
  };

  const renderGuestbookItem = ({
    item,
  }: {
    item: GuestbookResponse;
  }) => (
    <TouchableOpacity
      style={styles.guestbookItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      {/* 랜드마크 이미지 */}
      {item.landmark.imageUrl && (
        <Image
          source={{ uri: item.landmark.imageUrl }}
          style={styles.landmarkImage}
        />
      )}

      {/* 내용 */}
      <View style={styles.itemContent}>
        {/* 랜드마크 정보 */}
        <View style={styles.landmarkInfo}>
          <Text style={styles.landmarkIcon}>📍</Text>
          <View style={styles.landmarkDetails}>
            <Text style={styles.landmarkName} numberOfLines={1}>
              {item.landmark.name}
            </Text>
            <Text style={styles.landmarkLocation}>
              {item.landmark.cityName}, {item.landmark.countryCode}
            </Text>
          </View>
        </View>

        {/* 메시지 */}
        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>

        {/* 메타 정보 */}
        <View style={styles.meta}>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          {/* 공개/비공개 배지 */}
          <View
            style={[
              styles.badge,
              item.isPublic ? styles.badgePublic : styles.badgePrivate,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate,
              ]}
            >
              {item.isPublic ? "공개" : "비공개"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>방명록을 불러오는 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>😅</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>
          아직 작성한 방명록이 없습니다.
        </Text>
        <Text style={styles.emptySubText}>
          랜드마크를 방문하고 첫 방명록을 남겨보세요!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>내 방명록</Text>
          {guestbooks.length > 0 && (
            <Text style={styles.headerSubtitle}>
              총 {guestbooks.length}개
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* 방명록 목록 */}
      <FlatList
        data={guestbooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGuestbookItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
        contentContainerStyle={
          guestbooks.length === 0 ? styles.emptyListContainer : styles.listContent
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: "#000",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  headerSpacer: {
    width: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  guestbookItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  landmarkImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#e9ecef",
  },
  itemContent: {
    padding: 16,
  },
  landmarkInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  landmarkIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  landmarkDetails: {
    flex: 1,
  },
  landmarkName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  landmarkLocation: {
    fontSize: 13,
    color: "#6b7280",
  },
  message: {
    fontSize: 15,
    color: "#212529",
    lineHeight: 22,
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 13,
    color: "#6b7280",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePublic: {
    backgroundColor: "#000",
  },
  badgePrivate: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextPublic: {
    color: "#fff",
  },
  badgeTextPrivate: {
    color: "#6b7280",
  },
});
