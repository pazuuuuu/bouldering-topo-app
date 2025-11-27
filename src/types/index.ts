export interface Problem {
  id: string;
  name: string;
  grade: string;
  description?: string;
  lineCoordinates?: { x: number; y: number }[]; // For drawing lines
}

export interface Boulder {
  id: string;
  name: string;
  imageUrl: string;
  problems: Problem[];
  coordinates?: { lat: number; lng: number };
}

export interface Area {
  id: string;
  name: string;
  description: string;
  boulders: Boulder[];
}
