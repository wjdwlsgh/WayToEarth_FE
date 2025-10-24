// components/Landmark/GalleryManager.tsx
// 갤러리 이미지 관리 컴포넌트 (업로드, 삭제, 순서 변경)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import type { GalleryImage } from '../../types/landmark';
import {
  presignLandmarkImage,
  presignStoryImage,
  uploadToS3,
  guessImageMime,
  addLandmarkGalleryImage,
  deleteLandmarkGalleryImage,
  reorderLandmarkGalleryImages,
  addStoryGalleryImage,
  deleteStoryGalleryImage,
  reorderStoryGalleryImages,
} from '../../utils/api/admin';

type GalleryManagerProps = {
  type: 'landmark' | 'story';
  targetId: number; // landmarkId or storyId
  journeyId: number;
  landmarkId: number; // presign 시 필요
  images: GalleryImage[];
  onRefresh: () => void; // 갤러리 변경 후 데이터 새로고침
  isAdmin: boolean;
};

export default function GalleryManager({
  type,
  targetId,
  journeyId,
  landmarkId,
  images,
  onRefresh,
  isAdmin,
}: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);

  if (!isAdmin) {
    return null; // 관리자가 아니면 표시하지 않음
  }

  // 이미지 선택 헬퍼
  const pickImage = async (): Promise<{ uri: string; mime: string; size: number } | null> => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled) return null;
    const asset = res.assets[0];
    const uri = asset.uri;
    const info = await FileSystem.getInfoAsync(uri);
    const size = (info as any).size ?? 0;
    const mime = guessImageMime(uri);
    return { uri, mime, size };
  };

  // 갤러리 이미지 추가
  const handleAddImage = async () => {
    try {
      const sel = await pickImage();
      if (!sel) return;

      setUploading(true);

      // 1. Presign 발급
      let presign;
      if (type === 'landmark') {
        presign = await presignLandmarkImage({
          journeyId,
          landmarkId,
          contentType: sel.mime,
          size: sel.size,
        });
      } else {
        presign = await presignStoryImage({
          journeyId,
          landmarkId,
          storyId: targetId,
          contentType: sel.mime,
          size: sel.size,
        });
      }

      // 2. S3 업로드
      await uploadToS3(presign.upload_url, sel.uri, sel.mime);

      // 3. 갤러리에 추가
      if (type === 'landmark') {
        await addLandmarkGalleryImage(targetId, presign.download_url);
      } else {
        await addStoryGalleryImage(targetId, presign.download_url);
      }

      Alert.alert('완료', '갤러리 이미지가 추가되었습니다.');
      onRefresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '이미지 추가에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setUploading(false);
    }
  };

  // 갤러리 이미지 삭제
  const handleDeleteImage = async (imageId: number) => {
    Alert.alert('이미지 삭제', '정말 이 이미지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploading(true);
            if (type === 'landmark') {
              await deleteLandmarkGalleryImage(imageId);
            } else {
              await deleteStoryGalleryImage(imageId);
            }
            Alert.alert('완료', '이미지가 삭제되었습니다.');
            onRefresh();
          } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || '삭제에 실패했습니다.';
            Alert.alert('오류', msg);
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  // 이미지를 한 칸 앞으로 이동
  const moveImageUp = async (index: number) => {
    if (index === 0) return; // 이미 첫 번째면 이동 불가
    try {
      setReordering(true);
      const newOrder = [...images];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      const imageIds = newOrder.map((img) => img.id);

      if (type === 'landmark') {
        await reorderLandmarkGalleryImages(targetId, imageIds);
      } else {
        await reorderStoryGalleryImages(targetId, imageIds);
      }

      onRefresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '순서 변경에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setReordering(false);
    }
  };

  // 이미지를 한 칸 뒤로 이동
  const moveImageDown = async (index: number) => {
    if (index === images.length - 1) return; // 이미 마지막이면 이동 불가
    try {
      setReordering(true);
      const newOrder = [...images];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      const imageIds = newOrder.map((img) => img.id);

      if (type === 'landmark') {
        await reorderLandmarkGalleryImages(targetId, imageIds);
      } else {
        await reorderStoryGalleryImages(targetId, imageIds);
      }

      onRefresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '순서 변경에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setReordering(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>갤러리 이미지 ({images.length})</Text>
        <TouchableOpacity
          style={[styles.addButton, uploading && { opacity: 0.6 }]}
          onPress={handleAddImage}
          disabled={uploading || reordering}
        >
          <Text style={styles.addButtonText}>{uploading ? '업로드 중...' : '+ 이미지 추가'}</Text>
        </TouchableOpacity>
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>갤러리 이미지가 없습니다.</Text>
          <Text style={styles.emptySubText}>이미지를 추가해보세요.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
          {images.map((image, index) => (
            <View key={image.id} style={styles.imageCard}>
              <Image source={{ uri: image.imageUrl }} style={styles.image} resizeMode="cover" />

              {/* 순서 표시 */}
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>

              {/* 컨트롤 버튼 */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.controlButton, index === 0 && { opacity: 0.3 }]}
                  onPress={() => moveImageUp(index)}
                  disabled={uploading || reordering || index === 0}
                >
                  <Text style={styles.controlButtonText}>◀</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, index === images.length - 1 && { opacity: 0.3 }]}
                  onPress={() => moveImageDown(index)}
                  disabled={uploading || reordering || index === images.length - 1}
                >
                  <Text style={styles.controlButtonText}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.deleteButton]}
                  onPress={() => handleDeleteImage(image.id)}
                  disabled={uploading || reordering}
                >
                  <Text style={styles.controlButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {(uploading || reordering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imageList: {
    flexDirection: 'row',
  },
  imageCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  controlButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  controlButtonText: {
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
