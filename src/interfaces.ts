export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  filename?: string;
}

export interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  close(): Promise<void>;
}

export interface FileSystemAdapter {
  exists(path: string): boolean;
  writeFile(path: string, content: string): void;
  readDir(path: string): string[];
  stat(path: string): { isDirectory(): boolean };
}

export interface PhotosExtractorOptions {
  dbPath?: string;
  databaseAdapter?: DatabaseAdapter;
  fileSystemAdapter?: FileSystemAdapter;
}

export interface HeatmapGeneratorOptions {
  fileSystemAdapter?: FileSystemAdapter;
}