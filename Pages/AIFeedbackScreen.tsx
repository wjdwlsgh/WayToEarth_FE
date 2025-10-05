import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import {
  getOrCreateAIFeedback,
  getFriendlyErrorMessage,
  AIFeedback,
} from "../utils/api/aiFeedback";

type AIFeedbackScreenProps = {
  route: {
    params: {
      runningRecordId: number;
      completedCount?: number; // 완료된 러닝 기록 수 (에러 메시지용)
    };
  };
  navigation: any;
};

/**
 * AI 피드백 화면
 * - 러닝 기록에 대한 AI 분석 결과를 표시
 * - GET으로 조회 시도 후 없으면 POST로 새로 생성
 * - 로딩 상태 표시 (POST는 2-5초 소요)
 */
const AIFeedbackScreen: React.FC<AIFeedbackScreenProps> = ({
  route,
  navigation,
}) => {
  const { runningRecordId, completedCount } = route.params;

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasCreated, setWasCreated] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [runningRecordId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOrCreateAIFeedback(runningRecordId, (loading) => {
        setLoading(loading);
      });

      setFeedback(result.feedback);
      setWasCreated(result.wasCreated);
    } catch (err: any) {
      console.error("[AI Feedback Error]", err);
      const friendlyMessage = getFriendlyErrorMessage(err, completedCount);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    loadFeedback();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>
            AI가 러닝 기록을 분석하고 있어요...
          </Text>
          <Text style={styles.loadingSubText}>2-5초 정도 소요돼요</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>😅</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 코치의 피드백</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Feedback Card */}
        <View style={styles.feedbackCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.robotIcon}>🤖</Text>
          </View>

          <Text style={styles.feedbackContent}>{feedback?.feedbackContent}</Text>

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>
              {new Date(feedback?.createdAt ?? "").toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{feedback?.modelName}</Text>
          </View>

          {wasCreated && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>새로 생성됨</Text>
            </View>
          )}
        </View>

        {/* Goal Card */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>🎯 다음 목표</Text>
          <Text style={styles.goalText}>
            꾸준히 성장하고 있으니 이 페이스를 유지하세요!
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 AI 분석은 과거 최대 10개의 러닝 기록과 비교하여 성장 패턴을
            분석해요.
          </Text>
          <Text style={styles.infoText}>
            📊 하루에 최대 10번까지 분석할 수 있어요.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    fontSize: 28,
    color: "#000",
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 24,
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
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
    marginBottom: 12,
    minWidth: 200,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 200,
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: "relative",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  robotIcon: {
    fontSize: 48,
  },
  feedbackContent: {
    fontSize: 16,
    fontWeight: "400",
    color: "#212529",
    lineHeight: 26,
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
  newBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#000",
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  goalText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#495057",
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: "#e9ecef",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#495057",
    lineHeight: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  closeButton: {
    backgroundColor: "#000",
    borderRadius: 25,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default AIFeedbackScreen;
