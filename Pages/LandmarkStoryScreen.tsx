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
  TextInput,
} from 'react-native';
import SafeLayout from '../components/Layout/SafeLayout';
import StoryCard from '../components/Landmark/StoryCard';
import StoryTypeTabs from '../components/Landmark/StoryTypeTabs';
import GuestbookCreateModal from '../components/Guestbook/GuestbookCreateModal';
import LandmarkStatistics from '../components/Guestbook/LandmarkStatistics';
import { getLandmarkDetail } from '../utils/api/landmarks';
import { getMyProfile } from '../utils/api/users';
import { presignLandmarkImage, presignStoryImage, updateLandmarkImage, updateStoryImage, uploadToS3, guessImageMime, createStoryCard, updateStoryCard, deleteStoryCard } from '../utils/api/admin';
import type { StoryCardCreateRequest } from '../utils/api/admin';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [journeyIdInput, setJourneyIdInput] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryType, setNewStoryType] = useState<StoryType>('HISTORY');

  // 랜드마크 상세 정보 로드
  useEffect(() => {
    loadLandmarkDetail();
  }, [landmarkId, userId]);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        console.log('[LandmarkStory] 사용자 정보:', me);
        console.log('[LandmarkStory] role 값:', me?.role);
        const adminCheck = String(me?.role || '').toUpperCase() === 'ADMIN';
        console.log('[LandmarkStory] isAdmin:', adminCheck);
        setIsAdmin(adminCheck);
      } catch (error) {
        console.log('[LandmarkStory] 권한 확인 실패:', error);
        setIsAdmin(false);
      }
    })();
  }, []);

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

  const pickImage = async (): Promise<{ uri: string; mime: string; size: number } | null> => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.9 });
    if (res.canceled) return null;
    const asset = res.assets[0];
    const uri = asset.uri;
    const info = await FileSystem.getInfoAsync(uri);
    const size = (info as any).size ?? 0;
    const mime = guessImageMime(uri);
    return { uri, mime, size };
  };

  const ensureJourneyId = (): number | null => {
    const n = Number(journeyIdInput);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('여정 ID 필요', '관리자 업로드를 위해 여정 ID를 입력해주세요.');
      return null;
    }
    return n;
  };

  const handleUploadLandmarkImage = async () => {
    try {
      if (!isAdmin) return Alert.alert('권한 없음', '관리자만 업로드할 수 있습니다.');
      const jid = ensureJourneyId();
      if (!jid) return;
      const sel = await pickImage();
      if (!sel) return;
      setUploading(true);
      const presign = await presignLandmarkImage({ journeyId: jid, landmarkId, contentType: sel.mime, size: sel.size });
      await uploadToS3(presign.upload_url, sel.uri, sel.mime);
      await updateLandmarkImage(landmarkId, presign.download_url);
      Alert.alert('완료', '랜드마크 이미지가 업데이트되었습니다.');
      await loadLandmarkDetail();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '업로드에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadStoryImage = async (storyId: number) => {
    try {
      if (!isAdmin) return Alert.alert('권한 없음', '관리자만 업로드할 수 있습니다.');
      const jid = ensureJourneyId();
      if (!jid) return;
      const sel = await pickImage();
      if (!sel) return;
      setUploading(true);
      const presign = await presignStoryImage({ journeyId: jid, landmarkId, storyId, contentType: sel.mime, size: sel.size });
      await uploadToS3(presign.upload_url, sel.uri, sel.mime);
      await updateStoryImage(storyId, presign.download_url);
      Alert.alert('완료', '스토리 이미지가 업데이트되었습니다.');
      await loadLandmarkDetail();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '업로드에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStory = async () => {
    try {
      if (!newStoryTitle.trim() || !newStoryContent.trim()) {
        return Alert.alert('입력 필요', '제목과 내용을 모두 입력해주세요.');
      }
      setUploading(true);
      const orderIndex = landmark?.storyCards.length || 0;
      await createStoryCard({
        landmarkId,
        title: newStoryTitle.trim(),
        content: newStoryContent.trim(),
        type: newStoryType,
        orderIndex,
      });
      Alert.alert('완료', '스토리가 생성되었습니다.');
      setCreateModalVisible(false);
      setNewStoryTitle('');
      setNewStoryContent('');
      setNewStoryType('HISTORY');
      await loadLandmarkDetail();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '스토리 생성에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    Alert.alert(
      '스토리 삭제',
      '정말 이 스토리를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await deleteStoryCard(storyId);
              Alert.alert('완료', '스토리가 삭제되었습니다.');
              await loadLandmarkDetail();
            } catch (e: any) {
              const msg = e?.response?.data?.message || e?.message || '삭제에 실패했습니다.';
              Alert.alert('오류', msg);
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

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

        {isAdmin && (
          <View style={styles.adminPanel}>
            <Text style={styles.adminTitle}>관리자 이미지 업로드</Text>
            <TextInput
              style={styles.adminInput}
              placeholder="여정 ID"
              keyboardType="number-pad"
              value={journeyIdInput}
              onChangeText={setJourneyIdInput}
            />
            <TouchableOpacity style={[styles.adminBtn, uploading && { opacity: 0.6 }]} disabled={uploading} onPress={handleUploadLandmarkImage}>
              <Text style={styles.adminBtnText}>{uploading ? '업로드 중…' : '랜드마크 이미지 업로드'}</Text>
            </TouchableOpacity>
            <Text style={styles.adminHelp}>스토리 이미지는 각 카드의 버튼으로 업로드하세요.</Text>
          </View>
        )}

        {/* 스토리 카드 목록 */}
        <View style={styles.storiesContainer}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.createStoryBtn}
              onPress={() => setCreateModalVisible(true)}
              disabled={uploading}
            >
              <Text style={styles.createStoryBtnText}>+ 새 스토리 추가</Text>
            </TouchableOpacity>
          )}
          {filteredStories.length > 0 ? (
            <>
              <Text style={styles.storiesTitle}>
                {selectedType ? `${filteredStories.length}개의 스토리` : `전체 ${filteredStories.length}개의 스토리`}
              </Text>
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isAdmin={isAdmin}
                  onUploadImage={handleUploadStoryImage}
                  onDelete={handleDeleteStory}
                />
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

      {/* 스토리 생성 모달 */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCreateModalVisible(false)}
        >
          <Pressable style={styles.createModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>새 스토리 추가</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.createModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createModalContent}>
              <Text style={styles.createModalLabel}>제목</Text>
              <TextInput
                style={styles.createModalInput}
                placeholder="스토리 제목을 입력하세요"
                value={newStoryTitle}
                onChangeText={setNewStoryTitle}
                maxLength={100}
              />

              <Text style={styles.createModalLabel}>타입</Text>
              <View style={styles.typeButtons}>
                {(['HISTORY', 'CULTURE', 'NATURE'] as StoryType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newStoryType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewStoryType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        newStoryType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type === 'HISTORY' ? '📘 역사' : type === 'CULTURE' ? '🎭 문화' : '🌿 자연'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.createModalLabel}>내용</Text>
              <TextInput
                style={[styles.createModalInput, styles.createModalTextArea]}
                placeholder="스토리 내용을 입력하세요"
                value={newStoryContent}
                onChangeText={setNewStoryContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={2000}
              />

              <TouchableOpacity
                style={[styles.createModalSubmit, uploading && { opacity: 0.6 }]}
                onPress={handleCreateStory}
                disabled={uploading}
              >
                <Text style={styles.createModalSubmitText}>
                  {uploading ? '생성 중…' : '스토리 생성'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
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
  adminPanel: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  adminTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  adminInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  adminBtn: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  adminBtnText: { color: '#fff', fontWeight: '800' },
  adminHelp: { marginTop: 6, fontSize: 12, color: '#6B7280' },
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
  // 스토리 생성 버튼
  createStoryBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  createStoryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // 스토리 생성 모달
  createModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    marginTop: 'auto',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  createModalClose: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  createModalContent: {
    padding: 20,
  },
  createModalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
  },
  createModalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  createModalTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  createModalSubmit: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  createModalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
