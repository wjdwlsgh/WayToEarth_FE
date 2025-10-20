// components/Landmark/StoryCard.tsx
// 랜드마크 스토리 카드 컴포넌트

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import type { StoryCard as StoryCardType } from '../../types/landmark';
import { STORY_TYPE_LABELS, STORY_TYPE_COLORS } from '../../types/landmark';

type Props = {
  story: StoryCardType;
  isAdmin?: boolean;
  onUploadImage?: (storyId: number) => void;
};

export default function StoryCard({ story, isAdmin, onUploadImage }: Props) {
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

      {/* 스토리 이미지 */}
      {story.imageUrl && (
        <Image
          source={{ uri: story.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {isAdmin && (
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => onUploadImage?.(story.id)}
          accessibilityLabel="스토리 이미지 업로드"
        >
          <Text style={styles.adminBtnText}>스토리 이미지 업로드</Text>
        </TouchableOpacity>
      )}

      {/* 스토리 내용 */}
      <Text style={styles.content}>{story.content}</Text>
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
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
});
