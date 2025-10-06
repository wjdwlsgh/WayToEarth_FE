// Pages/GuestbookScreen.tsx
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
  getRecentGuestbooks,
  getGuestbookErrorMessage,
} from "../utils/api/guestbook";
import type {
  GuestbookResponse,
  PageableResponse,
} from "../types/guestbook";

/**
 * 방명록 피드 화면
 * - 최근 작성된 공개 방명록 목록 표시
 * - 무한 스크롤 페이징
 * - Pull to Refresh
 */
export default function GuestbookScreen() {
  const [guestbooks, setGuestbooks] = useState<GuestbookResponse[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuestbooks();
  }, [page]);

  const loadGuestbooks = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response: PageableResponse<GuestbookResponse> =
        await getRecentGuestbooks(page, 20);

      if (page === 0) {
        setGuestbooks(response.content);
      } else {
        setGuestbooks((prev) => [...prev, ...response.content]);
      }

      setHasMore(!response.last);
    } catch (err: any) {
      console.error("[Guestbook] 조회 실패:", err);
      setError(getGuestbookErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    setGuestbooks([]);
    loadGuestbooks();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const renderGuestbookItem = ({
    item,
  }: {
    item: GuestbookResponse;
  }) => (
    <View style={styles.guestbookItem}>
      {/* 작성자 정보 */}
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.user.profileImageUrl }}
          style={styles.profileImage}
        />
        <View style={styles.userDetails}>
          <Text style={styles.nickname}>{item.user.nickname}</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* 랜드마크 정보 */}
      <View style={styles.landmarkInfo}>
        <Text style={styles.landmarkIcon}>📍</Text>
        <Text style={styles.landmarkName}>{item.landmark.name}</Text>
        <Text style={styles.landmarkLocation}>
          {item.landmark.cityName}, {item.landmark.countryCode}
        </Text>
      </View>

      {/* 메시지 */}
      <Text style={styles.message}>{item.message}</Text>

      {/* 랜드마크 이미지 */}
      {item.landmark.imageUrl && (
        <Image
          source={{ uri: item.landmark.imageUrl }}
          style={styles.landmarkImage}
        />
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading && page === 0) {
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
        <Text style={styles.emptyText}>아직 작성된 방명록이 없습니다.</Text>
        <Text style={styles.emptySubText}>
          랜드마크를 방문하고 첫 방명록을 남겨보세요!
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || page === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000" />
        <Text style={styles.footerText}>더 불러오는 중...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>방명록 피드</Text>
        <Text style={styles.headerSubtitle}>
          다른 러너들의 여행 이야기를 확인해보세요
        </Text>
      </View>

      {/* 방명록 목록 */}
      <FlatList
        data={guestbooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGuestbookItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
        contentContainerStyle={
          guestbooks.length === 0 ? styles.emptyListContainer : undefined
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyListContainer: {
    flexGrow: 1,
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
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#6b7280",
  },
  landmarkInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  landmarkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  landmarkName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },
  landmarkLocation: {
    fontSize: 12,
    color: "#6b7280",
  },
  message: {
    fontSize: 15,
    color: "#212529",
    lineHeight: 22,
    marginBottom: 12,
  },
  landmarkImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#e9ecef",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
});
