
export interface Place {
  id: number;
  name: string;
  coords: [number, number];
  images: string[];
  description: string;
  category: "tribal" | "popular";
}

export interface Coords {
  from: [number, number] | null;
  to: [number, number] | null;
}

export interface SearchHistoryItem {
    from: string;
    to: string;
    timestamp: string;
}
