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
} from "react-native";
import BottomNavigation from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";
import { listFeeds, toggleFeedLike, FeedItem } from "../utils/api/feeds";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function FeedScreen({ navigation, route }: any) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeTab, onTabPress } = useBottomNav("feed");

  const fetchFeeds = useCallback(async () => {
    try {
      setError(null);
      const data = await listFeeds(0, 4);
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

  const FeedCard = ({
    feed,
    style,
    imageStyle,
    isMain = false,
  }: {
    feed?: FeedItem;
    style: any;
    imageStyle: any;
    isMain?: boolean;
  }) => {
    if (!feed) return <View style={[style, styles.emptyCard]} />;

    return (
      <TouchableOpacity
        style={style}
        onPress={() => navigation.navigate("FeedDetail", { feed })}
        activeOpacity={0.9}
      >
        {feed.imageUrl ? (
          <Image source={{ uri: feed.imageUrl }} style={imageStyle} />
        ) : (
          <View style={[imageStyle, styles.placeholderImage]} />
        )}

        <TouchableOpacity
          style={styles.likeButton}
          onPress={(e) => {
            e.stopPropagation();
            like(feed.id, feed.liked);
          }}
        >
          <Text style={styles.likeCount}>{feed.likeCount || 0}</Text>
          <View style={[styles.likeIcon, feed.liked && styles.likedIcon]} />
        </TouchableOpacity>

        <Text
          style={isMain ? styles.feedContent : styles.feedContentSmall}
          numberOfLines={2}
        >
          {feed.content || ""}
        </Text>
        <Text style={isMain ? styles.authorName : styles.authorNameSmall}>
          {feed.nickname || ""}
        </Text>
        <Text style={isMain ? styles.distance : styles.distanceSmall}>
          {feed.distance ? `${feed.distance}KM` : ""}
        </Text>
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
      <View style={styles.statusBarContainer}>
        <View style={styles.statusBar}>
          <Text style={styles.timeText}>9:41</Text>
          <View style={styles.batteryIndicator} />
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>피드</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.feedsLayout}>
          <FeedCard
            feed={feeds[0]}
            style={styles.mainFeedCard}
            imageStyle={styles.mainFeedImage}
            isMain
          />
          <FeedCard
            feed={feeds[1]}
            style={styles.secondaryFeedCard}
            imageStyle={styles.secondaryFeedImage}
          />
          <FeedCard
            feed={feeds[2]}
            style={styles.thirdFeedCard}
            imageStyle={styles.thirdFeedImage}
          />
          <FeedCard
            feed={feeds[3]}
            style={styles.fourthFeedCard}
            imageStyle={styles.fourthFeedImage}
          />
        </View>
      </ScrollView>

      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  // 로딩/에러
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
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
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // 상단 상태바 UI
  statusBarContainer: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 24,
  },
  timeText: { color: "#000000", fontSize: 17, fontWeight: "600" },
  batteryIndicator: {
    width: 24,
    height: 12,
    backgroundColor: "#000",
    borderRadius: 2,
    opacity: 0.8,
  },

  // 제목
  titleContainer: { alignItems: "center", marginVertical: 20 },
  titleText: { color: "#000000", fontSize: 20, fontWeight: "600" },

  // 스크롤 및 컨텐츠
  scrollContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 10 },
  feedsLayout: { height: 750, position: "relative" },

  // 공통 피드 카드
  emptyCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholderImage: {
    backgroundColor: "#ad8888",
    width: "100%",
    height: "100%",
  },
  likeButton: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  likeCount: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
    marginRight: 4,
  },
  likeIcon: { width: 10, height: 10, backgroundColor: "#fff", borderRadius: 4 },
  likedIcon: { backgroundColor: "#ff4757" },

  // 메인 카드
  mainFeedCard: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "#ad8888",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#000000",
    width: 180,
    height: 350,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  mainFeedImage: { width: "100%", height: "100%", resizeMode: "cover" },
  feedContent: {
    position: "absolute",
    bottom: 40,
    left: 12,
    right: 12,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "400",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  authorName: {
    position: "absolute",
    top: 10,
    left: 12,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  distance: {
    position: "absolute",
    bottom: 55,
    left: 12,
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // 보조 카드
  feedContentSmall: {
    position: "absolute",
    bottom: 35,
    left: 8,
    right: 8,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "400",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authorNameSmall: {
    position: "absolute",
    top: 8,
    left: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  distanceSmall: {
    position: "absolute",
    bottom: 45,
    left: 8,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  secondaryFeedCard: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#000000",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#000000",
    width: 180,
    height: 290,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  secondaryFeedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  thirdFeedCard: {
    position: "absolute",
    right: 0,
    top: 300,
    backgroundColor: "#000000",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#000000",
    width: 180,
    height: 380,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  thirdFeedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  fourthFeedCard: {
    position: "absolute",
    left: 0,
    top: 360,
    bottom: 0,
    backgroundColor: "#1f1f1f",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#000000",
    width: 180,
    height: 365,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  fourthFeedImage: { width: "100%", height: "100%", resizeMode: "cover" },
});
