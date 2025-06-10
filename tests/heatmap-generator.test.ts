import { HeatmapGenerator } from '../src/heatmap-generator';
import { LocationData } from '../src/photos-extractor';
import * as fs from 'fs';

jest.mock('fs');

describe('HeatmapGenerator', () => {
  let generator: HeatmapGenerator;
  const mockWriteFileSync = fs.writeFileSync as jest.Mock;

  beforeEach(() => {
    generator = new HeatmapGenerator();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(generator).toBeInstanceOf(HeatmapGenerator);
    });
  });

  describe('generateHeatmap', () => {
    const sampleLocations: LocationData[] = [
      {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2024-01-15'),
        filename: 'IMG_0001.jpg'
      },
      {
        latitude: 35.6586,
        longitude: 139.7454,
        timestamp: new Date('2024-02-10'),
        filename: 'IMG_0002.jpg'
      },
      {
        latitude: 35.6595,
        longitude: 139.7006,
        timestamp: new Date('2024-03-05'),
        filename: 'IMG_0003.jpg'
      }
    ];

    it('should generate HTML heatmap by default', async () => {
      const outputPath = './test-heatmap.html';

      await generator.generateHeatmap(sampleLocations, outputPath);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );

      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      expect(htmlContent).toContain('leaflet.css');
      expect(htmlContent).toContain('leaflet.js');
      expect(htmlContent).toContain('leaflet-heat.js');
      expect(htmlContent).toContain('Photos Heatmap');
    });

    it('should include location data in the generated HTML', async () => {
      const outputPath = './test-heatmap.html';

      await generator.generateHeatmap(sampleLocations, outputPath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      expect(htmlContent).toContain('35.6762');
      expect(htmlContent).toContain('139.6503');
      expect(htmlContent).toContain('35.6586');
      expect(htmlContent).toContain('139.7454');
    });

    it('should handle empty location array', async () => {
      const outputPath = './empty-heatmap.html';

      await generator.generateHeatmap([], outputPath);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('var heatmapData = [');
    });

    it('should handle locations without timestamps', async () => {
      const locationsWithoutTimestamp: LocationData[] = [
        {
          latitude: 35.6762,
          longitude: 139.6503
        },
        {
          latitude: 35.6586,
          longitude: 139.7454,
          filename: 'IMG_0002.jpg'
        }
      ];

      const outputPath = './no-timestamp-heatmap.html';

      await generator.generateHeatmap(locationsWithoutTimestamp, outputPath);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      expect(htmlContent).toContain('35.6762');
      expect(htmlContent).toContain('139.6503');
    });

    it('should calculate correct map center from location data', async () => {
      const outputPath = './centered-heatmap.html';

      await generator.generateHeatmap(sampleLocations, outputPath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      
      // Calculate expected center
      const avgLat = (35.6762 + 35.6586 + 35.6595) / 3;
      const avgLng = (139.6503 + 139.7454 + 139.7006) / 3;
      
      expect(htmlContent).toContain(`setView([${avgLat}, ${avgLng}]`);
    });

    it('should use default center when no locations provided', async () => {
      const outputPath = './default-center-heatmap.html';

      await generator.generateHeatmap([], outputPath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      expect(htmlContent).toContain('setView([35.6762, 139.6503]'); // Tokyo Station default
    });

    it('should handle different output formats', async () => {
      const outputPath = './test-heatmap.html';

      // Test HTML format explicitly
      await generator.generateHeatmap(sampleLocations, outputPath, 'html');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );
    });

    it('should include proper HTML structure and dependencies', async () => {
      const outputPath = './structure-test.html';

      await generator.generateHeatmap(sampleLocations, outputPath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1];
      
      // Check HTML structure
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('<div id="map">');
      
      // Check dependencies
      expect(htmlContent).toContain('unpkg.com/leaflet');
      expect(htmlContent).toContain('unpkg.com/leaflet.heat');
      
      // Check JavaScript initialization
      expect(htmlContent).toContain('L.map(');
      expect(htmlContent).toContain('L.heatLayer(');
      expect(htmlContent).toContain('addTo(map)');
    });

    it('should handle special characters in filenames', async () => {
      const locationsWithSpecialChars: LocationData[] = [
        {
          latitude: 35.6762,
          longitude: 139.6503,
          filename: 'IMG_with_"quotes"_&_ampersand.jpg'
        }
      ];

      const outputPath = './special-chars-heatmap.html';

      await expect(generator.generateHeatmap(locationsWithSpecialChars, outputPath))
        .resolves.not.toThrow();

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });
  });
});