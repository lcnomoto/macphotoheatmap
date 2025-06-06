import * as path from 'path';
import * as os from 'os';
import { PhotosExtractor } from '../photos-extractor';
import { HeatmapGenerator } from '../heatmap-generator';
import { LocationData, PhotosExtractorOptions, HeatmapGeneratorOptions } from '../interfaces';
import { NodeFileSystemAdapter } from '../adapters/filesystem-adapter';

export interface PhotosServiceOptions {
  photosExtractorOptions?: PhotosExtractorOptions;
  heatmapGeneratorOptions?: HeatmapGeneratorOptions;
}

export class PhotosService {
  private photosExtractor: PhotosExtractor;
  private heatmapGenerator: HeatmapGenerator;
  private fileSystemAdapter: NodeFileSystemAdapter;

  constructor(options: PhotosServiceOptions = {}) {
    this.fileSystemAdapter = new NodeFileSystemAdapter();
    this.photosExtractor = new PhotosExtractor(options.photosExtractorOptions || {});
    this.heatmapGenerator = new HeatmapGenerator(options.heatmapGeneratorOptions || {});
  }

  async findPhotosDatabase(customPath?: string): Promise<string> {
    if (customPath) {
      if (!this.fileSystemAdapter.exists(customPath)) {
        throw new Error(`Custom database path not found: ${customPath}`);
      }
      return customPath;
    }

    const photosLibPath = path.join(os.homedir(), 'Pictures', 'Photos Library.photoslibrary');
    
    const possiblePaths = [
      path.join(photosLibPath, 'database', 'Photos.sqlite'),
      path.join(photosLibPath, 'database', 'photos.db'),
      path.join(photosLibPath, 'Photos.sqlite'),
      path.join(photosLibPath, 'database', 'Photos.db'),
      path.join(photosLibPath, 'database', 'search', 'psi.sqlite')
    ];
    
    const foundPath = possiblePaths.find(p => {
      try {
        return this.fileSystemAdapter.exists(p);
      } catch {
        return false;
      }
    });
    
    if (!foundPath) {
      const errorMessage = [
        'Could not find Photos database. Tried:',
        ...possiblePaths.map(p => `  - ${p}`),
        '',
        'This app requires Full Disk Access permission.',
        'Please go to System Settings > Privacy & Security > Full Disk Access',
        'and add your terminal application to the list.',
        '',
        'Alternatively, you can specify a custom database path with:',
        '  --photos-db "/path/to/Photos Library.photoslibrary/database/photos.db"'
      ].join('\n');
      throw new Error(errorMessage);
    }
    
    return foundPath;
  }

  async extractLocationData(dbPath: string): Promise<LocationData[]> {
    const extractor = new PhotosExtractor(dbPath);
    return await extractor.extractLocations();
  }

  async generateHeatmap(locations: LocationData[], outputPath: string, format: string = 'html'): Promise<void> {
    await this.heatmapGenerator.generateHeatmap(locations, outputPath, format);
  }

  async explorePhotosLibrary(): Promise<void> {
    const photosLibPath = path.join(os.homedir(), 'Pictures', 'Photos Library.photoslibrary');
    
    if (!this.fileSystemAdapter.exists(photosLibPath)) {
      throw new Error('Photos Library not found');
    }
    
    this.exploreDirectory(photosLibPath, 0);
  }

  private exploreDirectory(dir: string, depth: number = 0): void {
    if (depth > 2) return;
    
    try {
      const items = this.fileSystemAdapter.readDir(dir);
      items.forEach((item: string) => {
        const fullPath = path.join(dir, item);
        const indent = '  '.repeat(depth);
        
        try {
          const stats = this.fileSystemAdapter.stat(fullPath);
          if (stats.isDirectory()) {
            console.log(`${indent}📁 ${item}/`);
            this.exploreDirectory(fullPath, depth + 1);
          } else {
            console.log(`${indent}📄 ${item}`);
          }
        } catch (e) {
          console.log(`${indent}❌ ${item} (permission denied)`);
        }
      });
    } catch (e) {
      console.log(`${' '.repeat(depth * 2)}❌ Cannot read directory`);
    }
  }

  generateSampleLocationData(): LocationData[] {
    return [
      { latitude: 35.6762, longitude: 139.6503, timestamp: new Date('2024-01-15') },
      { latitude: 35.6586, longitude: 139.7454, timestamp: new Date('2024-02-10') },
      { latitude: 35.6595, longitude: 139.7006, timestamp: new Date('2024-03-05') },
      { latitude: 35.6684, longitude: 139.7647, timestamp: new Date('2024-04-12') },
      { latitude: 35.6598, longitude: 139.7030, timestamp: new Date('2024-05-20') },
      { latitude: 35.6938, longitude: 139.7035, timestamp: new Date('2024-06-01') },
    ];
  }
}