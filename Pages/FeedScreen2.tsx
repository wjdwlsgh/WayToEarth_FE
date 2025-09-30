// screens/FeedScreen.tsx (or .jsx)
// screens/FeedScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView,
  FlatList,
} from "react-native";
import BottomNavigation from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";
import { listFeeds, toggleFeedLike, FeedItem } from "../utils/api/feeds";
import { getMyProfile } from "../utils/api/users";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function FeedScreen({ navigation, route }: any) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  const { activeTab, onTabPress } = useBottomNav("feed");

  const fetchFeeds = useCallback(async () => {
    try {
      setError(null);
      const [data, me] = await Promise.all([
        listFeeds(0, 20),
        getMyProfile().catch(() => null),
      ]);
      if (me) {
        const nk = (me as any)?.nickname ?? null;
        const url =
          (me as any)?.profile_image_url ??
          (me as any)?.profileImageUrl ??
          null;
        setMyNickname(nk);
        setMyAvatarUrl(url);
      }
      setFeeds(data);
    } catch (err) {
      console.error("피드 불러오기 실패:", err);
      setError("피드를 불러오는데 실패했습니다.");
      setFeeds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeeds();
  }, [fetchFeeds]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // 화면 복귀 시 최신 데이터 재조회(삭제/수정 반영)
  useFocusEffect(
    useCallback(() => {
      fetchFeeds();
    }, [fetchFeeds])
  );

  // 삭제 반영(선택): 파라미터로 넘어온 경우 즉시 반영
  useEffect(() => {
    if (route?.params?.deletedId) {
      const deletedId = route.params.deletedId;
      setFeeds((prev) => prev.filter((f) => f.id !== deletedId));
    }
  }, [route?.params?.deletedId]);

  const like = async (feedId: number, currentLiked: boolean) => {
    try {
      const { likeCount, liked } = await toggleFeedLike(feedId);
      setFeeds((prev) =>
        prev.map((f) => (f.id === feedId ? { ...f, likeCount, liked } : f))
      );
    } catch (err) {
      console.error("좋아요 실패:", err);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  const getProfileColor = (index: number) => {
    const colors = [
      "#6366F1", // 보라
      "#10B981", // 초록
      "#F59E0B", // 주황
      "#EF4444", // 빨강
      "#8B5CF6", // 자주
      "#06B6D4", // 청록
      "#84CC16", // 라임
      "#F97316", // 오렌지
    ];
    return colors[index % colors.length];
  };

  const renderFeedItem = ({
    item,
    index,
  }: {
    item: FeedItem;
    index: number;
  }) => {
    const displayName =
      (item as any)?.nickname || (item as any)?.author?.nickname || "사용자";
    const avatarUrl =
      (item as any)?.profile_image_url ||
      (item as any)?.profileImageUrl ||
      (item as any)?.author?.profile_image_url ||
      (item as any)?.author?.profileImageUrl ||
      null;
    const selfAvatar =
      myNickname && displayName === myNickname && myAvatarUrl
        ? myAvatarUrl
        : null;
    const finalUrl = avatarUrl || selfAvatar;

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() => navigation.navigate("FeedDetail", { feed: item })}
        activeOpacity={0.7}
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          {finalUrl ? (
            <Image
              source={{ uri: finalUrl }}
              style={styles.profileAvatarImage}
            />
          ) : (
            <View
              style={[
                styles.profileAvatar,
                { backgroundColor: getProfileColor(index) },
              ]}
            >
              <Text style={styles.profileInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileTime}>
              {item.distance ? `${item.distance}km` : ""}
            </Text>
          </View>
        </View>

        {/* 컨텐츠 */}
        <Text style={styles.feedContent} numberOfLines={4}>
          {item.content || ""}
        </Text>

        {/* 이미지가 있는 경우 표시 */}
        {item.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.feedImage} />
          </View>
        )}

        {/* 액션 버튼들 */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              like(item.id, item.liked);
            }}
          >
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionCount}>{item.likeCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>피드를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFeeds}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>피드</Text>
      </View>

      {/* 피드 리스트 */}
      <FlatList
        data={feeds}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // 로딩/에러
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // 헤더
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 60, // 상태바 공간
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  headerTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  activeTab: {
    backgroundColor: "#6366F1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#ffffff",
  },

  // 리스트
  listContainer: {
    paddingBottom: 100,
  },
  separator: {
    height: 8,
    backgroundColor: "#f8f9fa",
  },

  // 피드 아이템
  feedItem: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // 프로필 섹션
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  profileInitial: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  profileTime: {
    fontSize: 13,
    color: "#666666",
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },

  // 컨텐츠
  feedContent: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000000",
    marginBottom: 12,
  },

  // 이미지
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  feedImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    resizeMode: "cover",
  },

  // 액션 섹션
  actionSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionCount: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
});
