// components/Landmark/StoryTypeTabs.tsx
// 스토리 타입 필터 탭 컴포넌트

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { StoryType } from '../../types/landmark';
import { STORY_TYPE_LABELS, STORY_TYPE_COLORS } from '../../types/landmark';

type Props = {
  selectedType: StoryType | null;
  onSelectType: (type: StoryType | null) => void;
};

const STORY_TYPES: Array<StoryType | null> = [null, 'HISTORY', 'CULTURE', 'NATURE'];

export default function StoryTypeTabs({ selectedType, onSelectType }: Props) {
  const getTabLabel = (type: StoryType | null): string => {
    if (type === null) return '전체';
    return STORY_TYPE_LABELS[type];
  };

  const getTabColor = (type: StoryType | null): string => {
    if (type === null) return '#6366F1';
    return STORY_TYPE_COLORS[type];
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {STORY_TYPES.map((type) => {
        const isActive = selectedType === type;
        const color = getTabColor(type);
        const label = getTabLabel(type);

        return (
          <TouchableOpacity
            key={type ?? 'all'}
            style={[
              styles.tab,
              isActive && { backgroundColor: color },
              !isActive && styles.tabInactive,
            ]}
            onPress={() => onSelectType(type)}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                !isActive && { color: '#6B7280' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  tabInactive: {
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
});
