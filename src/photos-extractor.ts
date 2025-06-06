import * as path from 'path';
import { LocationData, DatabaseAdapter, FileSystemAdapter, PhotosExtractorOptions } from './interfaces';
import { SQLiteAdapter } from './adapters/sqlite-adapter';
import { NodeFileSystemAdapter } from './adapters/filesystem-adapter';

export { LocationData };

export class PhotosExtractor {
  private dbPath: string;
  private databaseAdapter: DatabaseAdapter;
  private fileSystemAdapter: FileSystemAdapter;

  constructor(dbPathOrOptions: string | PhotosExtractorOptions) {
    if (typeof dbPathOrOptions === 'string') {
      this.dbPath = dbPathOrOptions;
      this.databaseAdapter = new SQLiteAdapter(this.dbPath);
      this.fileSystemAdapter = new NodeFileSystemAdapter();
    } else {
      const options = dbPathOrOptions;
      this.dbPath = options.dbPath || '';
      this.databaseAdapter = options.databaseAdapter || new SQLiteAdapter(this.dbPath);
      this.fileSystemAdapter = options.fileSystemAdapter || new NodeFileSystemAdapter();
    }
  }

  async extractLocations(): Promise<LocationData[]> {
    if (this.dbPath && !this.fileSystemAdapter.exists(this.dbPath)) {
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
      
      const locations: LocationData[] = rows.map(row => ({
        latitude: row.latitude,
        longitude: row.longitude,
        timestamp: row.timestamp ? new Date((row.timestamp + 978307200) * 1000) : undefined,
        filename: row.filename
      }));

      await this.databaseAdapter.close();
      return locations;
    } catch (error) {
      await this.databaseAdapter.close();
      if (error instanceof Error) {
        throw new Error(`Cannot access Photos database: ${error.message}\n\nThis usually means:\n1. Full Disk Access permission is not granted to your terminal\n2. Photos.app is currently running (try closing it)\n3. The database is locked by another process\n\nPlease:\n- Go to System Settings > Privacy & Security > Full Disk Access\n- Add your terminal application to the list\n- Close Photos.app if it's running\n- Try again`);
      }
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