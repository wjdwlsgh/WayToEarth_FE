// components/Journey/JourneyProgressCard.tsx
// 여정 진행률 표시 카드

import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  progressPercent: number;
  currentDistanceKm: number;
  totalDistanceKm: number;
  nextLandmark: {
    name: string;
    distanceKm: number;
  } | null;
};

export default function JourneyProgressCard({
  progressPercent,
  currentDistanceKm,
  totalDistanceKm,
  nextLandmark,
}: Props) {
  const remainingKm = Math.max(0, totalDistanceKm - currentDistanceKm);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>여정 진행률</Text>
        <Text style={styles.percent}>{progressPercent.toFixed(1)}%</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, progressPercent)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>완주</Text>
          <Text style={styles.statValue}>{currentDistanceKm.toFixed(2)} km</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>남은 거리</Text>
          <Text style={styles.statValue}>{remainingKm.toFixed(2)} km</Text>
        </View>
      </View>

      {nextLandmark && (
        <View style={styles.nextLandmark}>
          <Text style={styles.nextLandmarkLabel}>다음 랜드마크</Text>
          <Text style={styles.nextLandmarkName}>{nextLandmark.name}</Text>
          <Text style={styles.nextLandmarkDistance}>
            {(nextLandmark.distanceKm - currentDistanceKm).toFixed(2)} km 남음
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  percent: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6366F1",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  nextLandmark: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  nextLandmarkLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  nextLandmarkName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 2,
  },
  nextLandmarkDistance: {
    fontSize: 13,
    color: "#4B5563",
  },
});
