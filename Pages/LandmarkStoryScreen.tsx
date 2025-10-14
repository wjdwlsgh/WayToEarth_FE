// Pages/LandmarkStoryScreen.tsx
// 랜드마크 스토리 상세 페이지

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import SafeLayout from '../components/Layout/SafeLayout';
import StoryCard from '../components/Landmark/StoryCard';
import StoryTypeTabs from '../components/Landmark/StoryTypeTabs';
import GuestbookCreateModal from '../components/Guestbook/GuestbookCreateModal';
import LandmarkStatistics from '../components/Guestbook/LandmarkStatistics';
import { getLandmarkDetail } from '../utils/api/landmarks';
import type { LandmarkDetail, StoryType } from '../types/landmark';
import type { LandmarkSummary } from '../types/guestbook';

type RouteParams = {
  route: {
    params?: {
      landmarkId: number;
      userId?: number;
    };
  };
  navigation: any;
};

export default function LandmarkStoryScreen({ route, navigation }: RouteParams) {
  const params = route.params || {};
  const landmarkId = params.landmarkId;
  const userId = params.userId;

  const [loading, setLoading] = useState(true);
  const [landmark, setLandmark] = useState<LandmarkDetail | null>(null);
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestbookModalVisible, setGuestbookModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // 랜드마크 상세 정보 로드
  useEffect(() => {
    loadLandmarkDetail();
  }, [landmarkId, userId]);

  const loadLandmarkDetail = async () => {
    if (!landmarkId) {
      setError('랜드마크 ID가 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getLandmarkDetail(landmarkId, userId);
      setLandmark(data);
    } catch (err: any) {
      console.error('[LandmarkStoryScreen] 랜드마크 로드 실패:', err);
      setError(err?.response?.data?.message || '랜드마크 정보를 불러올 수 없습니다.');
      Alert.alert('오류', '랜드마크 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 스토리 타입 필터링
  const filteredStories = landmark?.storyCards.filter((story) => {
    if (selectedType === null) return true;
    return story.type === selectedType;
  }) || [];

  // 로딩 중 표시
  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 발생 시
  if (error || !landmark) {
    return (
      <SafeLayout>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || '랜드마크를 찾을 수 없습니다.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLandmarkDetail}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    );
  }

  // 방명록 작성 모달 열기
  const handleOpenGuestbook = () => {
    setBottomSheetVisible(false);
    setGuestbookModalVisible(true);
  };

  // 방명록 목록 보기
  const handleViewGuestbooks = () => {
    setBottomSheetVisible(false);
    navigation.navigate('LandmarkGuestbookScreen', {
      landmarkId: landmarkId,
      landmarkName: landmark?.name || '',
    });
  };

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 랜드마크 헤더 */}
        <View style={styles.header}>
          {/* 뒤로가기 버튼 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          {/* 메뉴 버튼 (방명록, 통계) */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setBottomSheetVisible(true)}
          >
            <Text style={styles.menuButtonText}>⋯</Text>
          </TouchableOpacity>

          {/* 랜드마크 이미지 */}
          {landmark.imageUrl ? (
            <Image
              source={{ uri: landmark.imageUrl }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.headerImage, styles.headerImagePlaceholder]}>
              <Text style={styles.headerImagePlaceholderText}>🏛️</Text>
            </View>
          )}

          {/* 랜드마크 기본 정보 */}
          <View style={styles.headerInfo}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>{landmark.name}</Text>
              {landmark.hasStamp && (
                <View style={styles.stampBadge}>
                  <Text style={styles.stampBadgeText}>✓ 스탬프 획득</Text>
                </View>
              )}
            </View>

            <Text style={styles.headerDescription}>{landmark.description}</Text>

            <View style={styles.headerDetails}>
              <View style={styles.headerDetailItem}>
                <Text style={styles.headerDetailLabel}>위치</Text>
                <Text style={styles.headerDetailValue}>
                  {landmark.cityName}, {landmark.countryCode}
                </Text>
              </View>
              <View style={styles.headerDetailItem}>
                <Text style={styles.headerDetailLabel}>거리</Text>
                <Text style={styles.headerDetailValue}>
                  {(landmark.distanceFromStart / 1000).toFixed(1)} km 지점
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 스토리 타입 필터 탭 */}
        <StoryTypeTabs
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />

        {/* 스토리 카드 목록 */}
        <View style={styles.storiesContainer}>
          {filteredStories.length > 0 ? (
            <>
              <Text style={styles.storiesTitle}>
                {selectedType ? `${filteredStories.length}개의 스토리` : `전체 ${filteredStories.length}개의 스토리`}
              </Text>
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>
                {selectedType ? '해당 타입의 스토리가 없습니다.' : '스토리가 없습니다.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 방명록 작성 모달 */}
      {landmark && (
        <GuestbookCreateModal
          visible={guestbookModalVisible}
          onClose={() => setGuestbookModalVisible(false)}
          landmark={{
            id: landmark.id,
            name: landmark.name,
            cityName: landmark.cityName,
            countryCode: landmark.countryCode,
            imageUrl: landmark.imageUrl || '',
          }}
          userId={userId || 1}
          onSuccess={() => {
            console.log('[LandmarkStoryScreen] 방명록 작성 완료');
            setGuestbookModalVisible(false);
          }}
        />
      )}

      {/* 바텀시트 (통계 및 메뉴) */}
      <Modal
        visible={bottomSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBottomSheetVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBottomSheetVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />

            {landmark && (
              <>
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>{landmark.name}</Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    {(landmark.distanceFromStart / 1000).toFixed(1)}km 지점
                  </Text>
                </View>

                {/* 랜드마크 통계 */}
                <View style={styles.statisticsContainer}>
                  <LandmarkStatistics landmarkId={landmark.id} />
                </View>

                {/* 메뉴 옵션 */}
                <View style={styles.menuOptions}>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={handleOpenGuestbook}
                  >
                    <Text style={styles.menuOptionIcon}>✍️</Text>
                    <Text style={styles.menuOptionText}>방명록 작성</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={handleViewGuestbooks}
                  >
                    <Text style={styles.menuOptionIcon}>📖</Text>
                    <Text style={styles.menuOptionText}>방명록 보기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuOption, styles.menuOptionCancel]}
                    onPress={() => setBottomSheetVisible(false)}
                  >
                    <Text style={styles.menuOptionText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  backButtonText: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '700',
    marginTop: -2,
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '700',
  },
  headerImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  headerImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImagePlaceholderText: {
    fontSize: 64,
  },
  headerInfo: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    flex: 1,
  },
  stampBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  stampBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 16,
  },
  headerDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  headerDetailItem: {
    flex: 1,
  },
  headerDetailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  headerDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  storiesContainer: {
    padding: 16,
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // 바텀시트 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    minHeight: 400,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statisticsContainer: {
    marginBottom: 20,
  },
  menuOptions: {
    gap: 12,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuOptionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuOptionCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
});
