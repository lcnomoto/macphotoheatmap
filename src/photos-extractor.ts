import * as path from 'path';
import { LocationData, PhotosExtractorInterface, DatabaseAdapter, FileSystemAdapter } from './interfaces';
import { LocationDataProcessorImpl } from './utils/location-data-processor';

export class PhotosExtractor implements PhotosExtractorInterface {
  private dbPath: string;
  private locationProcessor: LocationDataProcessorImpl;

  constructor(
    dbPath: string,
    private databaseAdapter: DatabaseAdapter,
    private fileSystemAdapter: FileSystemAdapter
  ) {
    this.dbPath = dbPath;
    this.locationProcessor = new LocationDataProcessorImpl();
  }

  async extractLocations(): Promise<LocationData[]> {
    if (!this.fileSystemAdapter.exists(this.dbPath)) {
      throw new Error(`Photos database not found at: ${this.dbPath}`);
    }

    try {
      const query = `
        SELECT 
          ZASSET.ZLATITUDE as latitude,
          ZASSET.ZLONGITUDE as longitude,
          ZASSET.ZDATECREATED as timestamp,
          ZASSET.ZFILENAME as filename
        FROM ZASSET 
        WHERE ZASSET.ZLATITUDE IS NOT NULL 
          AND ZASSET.ZLONGITUDE IS NOT NULL
          AND ZASSET.ZLATITUDE != 0 
          AND ZASSET.ZLONGITUDE != 0
          AND ZASSET.ZLATITUDE != -180.0 
          AND ZASSET.ZLONGITUDE != -180.0
          AND ZASSET.ZLATITUDE BETWEEN -90 AND 90 
          AND ZASSET.ZLONGITUDE BETWEEN -180 AND 180
        ORDER BY ZASSET.ZDATECREATED DESC
      `;

      const rows = await this.databaseAdapter.query(query);
      
      const locations: LocationData[] = rows
        .map(row => ({
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp ? new Date((row.timestamp + 978307200) * 1000) : undefined,
          filename: row.filename
        }))
        .filter(location => this.locationProcessor.validateLocation(location));

      await this.databaseAdapter.close();
      return locations;
    } catch (error) {
      await this.databaseAdapter.close();
      throw error;
    }
  }

  async getPhotosLibraryPath(): Promise<string> {
    const defaultPath = path.join(process.env.HOME || '', 'Pictures', 'Photos Library.photoslibrary');
    
    if (this.fileSystemAdapter.exists(defaultPath)) {
      return path.join(defaultPath, 'database', 'Photos.sqlite');
    }
    
    throw new Error('Photos Library not found in default location');
  }
}