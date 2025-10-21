export interface CrewListItem {
  id: string;
  name: string;
  description: string;
  progress: string; // e.g., "1/50"
}

export interface TopCrewItemData {
  id: string;
  rank: string; // e.g., "1위 크루"
  name: string;
  distance: string; // e.g., "1150km"
  imageUrl?: string | null;
}

