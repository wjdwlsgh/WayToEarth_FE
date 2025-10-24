// components/Landmark/StoryCard.tsx
// 랜드마크 스토리 카드 컴포넌트

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import type { StoryCard as StoryCardType } from '../../types/landmark';
import { STORY_TYPE_LABELS, STORY_TYPE_COLORS } from '../../types/landmark';
import GalleryManager from './GalleryManager';

type Props = {
  story: StoryCardType;
  isAdmin?: boolean;
  journeyId?: number; // 갤러리 관리를 위한 journeyId
  landmarkId?: number; // 갤러리 관리를 위한 landmarkId
  onUploadImage?: (storyId: number) => void;
  onDelete?: (storyId: number) => void;
  onRefresh?: () => void; // 갤러리 변경 후 새로고침
};

export default function StoryCard({
  story,
  isAdmin,
  journeyId,
  landmarkId,
  onUploadImage,
  onDelete,
  onRefresh,
}: Props) {
  const typeColor = STORY_TYPE_COLORS[story.type];
  const typeLabel = STORY_TYPE_LABELS[story.type];

  return (
    <View style={styles.container}>
      {/* 스토리 타입 뱃지 */}
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
      </View>

      {/* 스토리 제목 */}
      <Text style={styles.title}>{story.title}</Text>

      {/* 스토리 커버 이미지 */}
      {story.imageUrl && (
        <Image
          source={{ uri: story.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {isAdmin && (
        <View style={styles.adminButtons}>
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => onUploadImage?.(story.id)}
            accessibilityLabel="스토리 커버 이미지 업로드"
          >
            <Text style={styles.adminBtnText}>📷 커버 이미지 업로드</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, styles.adminBtnDelete]}
            onPress={() => onDelete?.(story.id)}
            accessibilityLabel="스토리 삭제"
          >
            <Text style={styles.adminBtnText}>🗑️ 삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 스토리 내용 */}
      <Text style={styles.content}>{story.content}</Text>

      {/* 스토리 갤러리 관리 */}
      {isAdmin && journeyId && landmarkId && (
        <GalleryManager
          type="story"
          targetId={story.id}
          journeyId={journeyId}
          landmarkId={landmarkId}
          images={story.images || []}
          onRefresh={() => onRefresh?.()}
          isAdmin={isAdmin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 28,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  adminButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  adminBtn: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminBtnDelete: {
    backgroundColor: '#EF4444',
  },
  adminBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
});
