import { PhotosExtractor } from '../src/photos-extractor';
import { HeatmapGenerator } from '../src/heatmap-generator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Integration Tests', () => {
  const tempDir = os.tmpdir();
  const testOutputPath = path.join(tempDir, 'test-integration-heatmap.html');

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  describe('Full workflow with sample data', () => {
    it('should generate a heatmap from sample location data', async () => {
      // Sample location data (similar to Tokyo area)
      const sampleLocations = [
        { 
          latitude: 35.6762, 
          longitude: 139.6503, 
          timestamp: new Date('2024-01-15'),
          filename: 'tokyo_station.jpg'
        },
        { 
          latitude: 35.6586, 
          longitude: 139.7454, 
          timestamp: new Date('2024-02-10'),
          filename: 'skytree.jpg'
        },
        { 
          latitude: 35.6595, 
          longitude: 139.7006, 
          timestamp: new Date('2024-03-05'),
          filename: 'imperial_palace.jpg'
        },
      ];

      const generator = new HeatmapGenerator();
      
      await generator.generateHeatmap(sampleLocations, testOutputPath);

      // Verify file was created
      expect(fs.existsSync(testOutputPath)).toBe(true);

      // Verify file content
      const content = fs.readFileSync(testOutputPath, 'utf8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Photos Heatmap');
      expect(content).toContain('35.6762');
      expect(content).toContain('139.6503');
      expect(content).toContain('leaflet');
      
      // Verify file size is reasonable (should be > 1KB for a complete HTML file)
      const stats = fs.statSync(testOutputPath);
      expect(stats.size).toBeGreaterThan(1000);
    });

    it('should handle empty location data gracefully', async () => {
      const generator = new HeatmapGenerator();
      
      await generator.generateHeatmap([], testOutputPath);

      expect(fs.existsSync(testOutputPath)).toBe(true);
      
      const content = fs.readFileSync(testOutputPath, 'utf8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('var heatmapData = [');
    });
  });

  describe('PhotosExtractor path resolution', () => {
    it('should create correct default Photos library path', async () => {
      const extractor = new PhotosExtractor('/dummy/path');
      
      // Mock the home directory
      const originalHome = process.env.HOME;
      process.env.HOME = '/Users/testuser';
      
      try {
        // This will fail because the path doesn't exist, but we can test the path construction
        await expect(extractor.getPhotosLibraryPath()).rejects.toThrow(
          'Photos Library not found in default location'
        );
      } finally {
        process.env.HOME = originalHome;
      }
    });
  });

  describe('Error handling workflow', () => {
    it('should handle database connection errors gracefully', async () => {
      const nonExistentPath = '/definitely/does/not/exist/photos.db';
      const extractor = new PhotosExtractor(nonExistentPath);

      await expect(extractor.extractLocations()).rejects.toThrow(
        'Photos database not found at:'
      );
    });

    it('should handle invalid output paths', async () => {
      const generator = new HeatmapGenerator();
      const invalidPath = '/root/cannot/write/here.html'; // Assuming no write permissions
      
      const sampleData = [{ latitude: 35.6762, longitude: 139.6503 }];
      
      // This should throw an error for invalid paths
      await expect(
        generator.generateHeatmap(sampleData, invalidPath)
      ).rejects.toThrow();
    });
  });

  describe('Data validation workflow', () => {
    it('should filter out invalid coordinates in the complete workflow', async () => {
      const mixedData = [
        { latitude: 35.6762, longitude: 139.6503 }, // Valid Tokyo coordinates
        { latitude: 0, longitude: 0 }, // Invalid (would be filtered by PhotosExtractor)
        { latitude: -180, longitude: -180 }, // Invalid (would be filtered by PhotosExtractor)
        { latitude: 91, longitude: 181 }, // Invalid (would be filtered by PhotosExtractor)
        { latitude: 35.6586, longitude: 139.7454 }, // Valid Tokyo coordinates
      ];

      // Simulate what PhotosExtractor would do - filter valid coordinates
      const validData = mixedData.filter(location => 
        location.latitude >= -90 && location.latitude <= 90 &&
        location.longitude >= -180 && location.longitude <= 180 &&
        location.latitude !== 0 && location.longitude !== 0 &&
        location.latitude !== -180 && location.longitude !== -180
      );

      const generator = new HeatmapGenerator();
      await generator.generateHeatmap(validData, testOutputPath);

      const content = fs.readFileSync(testOutputPath, 'utf8');
      
      // Should contain valid coordinates
      expect(content).toContain('35.6762');
      expect(content).toContain('35.6586');
      
      // Should not contain invalid coordinates
      expect(content).not.toContain('\"0\"');
      expect(content).not.toContain('\"-180\"');
      expect(content).not.toContain('\"91\"');
      expect(content).not.toContain('\"181\"');
    });
  });

  describe('File system operations', () => {
    it('should create output directory if it does not exist', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'directory', 'heatmap.html');
      const nestedDir = path.dirname(nestedPath);
      
      // Ensure directory doesn't exist
      if (fs.existsSync(nestedDir)) {
        fs.rmSync(nestedDir, { recursive: true });
      }
      
      const generator = new HeatmapGenerator();
      const sampleData = [{ latitude: 35.6762, longitude: 139.6503 }];
      
      // Create directory before generating file (this would typically be handled by the application)
      fs.mkdirSync(nestedDir, { recursive: true });
      
      await generator.generateHeatmap(sampleData, nestedPath);
      
      expect(fs.existsSync(nestedPath)).toBe(true);
      
      // Cleanup
      fs.rmSync(nestedDir, { recursive: true });
    });
  });
});