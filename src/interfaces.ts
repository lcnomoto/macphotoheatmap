export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  filename?: string;
}

export interface DatabaseAdapter {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

export interface FileSystemAdapter {
  exists(path: string): boolean;
  writeFile(path: string, content: string): void;
  readFile(path: string): string;
}

export interface PhotosExtractorInterface {
  extractLocations(): Promise<LocationData[]>;
  getPhotosLibraryPath(): Promise<string>;
}

export interface HeatmapGeneratorInterface {
  generateHeatmap(locations: LocationData[], outputPath: string, format?: string): Promise<void>;
}

export interface LocationDataProcessor {
  calculateCenter(locations: LocationData[]): { lat: number; lng: number };
  getDateRange(locations: LocationData[]): string;
  validateLocation(location: LocationData): boolean;
}