import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('sqlite3', () => ({
  OPEN_READONLY: 1,
  Database: jest.fn()
}));
jest.mock('fs');

import { PhotosExtractor, LocationData } from '../src/photos-extractor';

describe('PhotosExtractor', () => {
  let extractor: PhotosExtractor;
  const mockDbPath = '/mock/path/to/photos.db';

  beforeEach(() => {
    extractor = new PhotosExtractor(mockDbPath);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with the provided database path', () => {
      expect(extractor).toBeInstanceOf(PhotosExtractor);
    });
  });

  describe('getPhotosLibraryPath', () => {
    const mockHomedir = '/Users/testuser';
    const expectedPath = path.join(mockHomedir, 'Pictures', 'Photos Library.photoslibrary', 'database', 'Photos.sqlite');
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.HOME;
      process.env.HOME = mockHomedir;
    });

    afterEach(() => {
      process.env.HOME = originalEnv;
    });

    it('should return the correct Photos database path when library exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await extractor.getPhotosLibraryPath();

      expect(result).toBe(expectedPath);
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join(mockHomedir, 'Pictures', 'Photos Library.photoslibrary')
      );
    });

    it('should throw an error when Photos library is not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(extractor.getPhotosLibraryPath()).rejects.toThrow(
        'Photos Library not found in default location'
      );
    });
  });

  describe('extractLocations', () => {
    const mockSqlite3 = require('sqlite3');
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        all: jest.fn(),
        close: jest.fn(),
      };
      mockSqlite3.Database = jest.fn().mockImplementation((dbPath, mode, callback) => {
        if (callback) callback(null);
        return mockDb;
      });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('should throw an error if database file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(extractor.extractLocations()).rejects.toThrow(
        'Photos database not found at: /mock/path/to/photos.db'
      );
    });

    it('should throw an error if database cannot be opened', async () => {
      const dbError = new Error('Cannot open database');
      mockSqlite3.Database = jest.fn().mockImplementation((dbPath, mode, callback) => {
        if (callback) callback(dbError);
        return mockDb;
      });

      await expect(extractor.extractLocations()).rejects.toThrow(
        'Cannot open Photos database: Cannot open database'
      );
    });

    it('should return location data when query is successful', async () => {
      const mockRows = [
        {
          latitude: 35.6762,
          longitude: 139.6503,
          timestamp: 725817600, // 2024-01-01 in Apple Core Data format
          filename: 'IMG_0001.jpg'
        },
        {
          latitude: 35.6586,
          longitude: 139.7454,
          timestamp: 725904000, // 2024-01-02 in Apple Core Data format
          filename: 'IMG_0002.jpg'
        }
      ];

      mockDb.all.mockImplementation((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        callback(null, mockRows);
      });

      const result = await extractor.extractLocations();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date((725817600 + 978307200) * 1000),
        filename: 'IMG_0001.jpg'
      });
      expect(result[1]).toEqual({
        latitude: 35.6586,
        longitude: 139.7454,
        timestamp: new Date((725904000 + 978307200) * 1000),
        filename: 'IMG_0002.jpg'
      });
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle photos without timestamp', async () => {
      const mockRows = [
        {
          latitude: 35.6762,
          longitude: 139.6503,
          timestamp: null,
          filename: 'IMG_0001.jpg'
        }
      ];

      mockDb.all.mockImplementation((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        callback(null, mockRows);
      });

      const result = await extractor.extractLocations();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: undefined,
        filename: 'IMG_0001.jpg'
      });
    });

    it('should reject when database query fails', async () => {
      const queryError = new Error('SQLITE_ERROR: no such table: ZASSET');
      mockDb.all.mockImplementation((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        callback(queryError, []);
      });

      await expect(extractor.extractLocations()).rejects.toThrow(
        'Database query failed: SQLITE_ERROR: no such table: ZASSET'
      );
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should use the correct SQL query with proper filters', async () => {
      mockDb.all.mockImplementation((query: string, callback: (err: Error | null, rows: any[]) => void) => {
        callback(null, []);
      });

      await extractor.extractLocations();

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('FROM ZASSET'),
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ZLATITUDE IS NOT NULL'),
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ZLONGITUDE IS NOT NULL'),
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ZLATITUDE != -180.0'),
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ZLONGITUDE != -180.0'),
        expect.any(Function)
      );
    });
  });
});