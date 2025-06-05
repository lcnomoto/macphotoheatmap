import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  filename?: string;
}

export class PhotosExtractor {
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async extractLocations(): Promise<LocationData[]> {
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Photos database not found at: ${this.dbPath}`);
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Cannot open Photos database: ${err.message}\n\nThis usually means:\n1. Full Disk Access permission is not granted to your terminal\n2. Photos.app is currently running (try closing it)\n3. The database is locked by another process\n\nPlease:\n- Go to System Settings > Privacy & Security > Full Disk Access\n- Add your terminal application to the list\n- Close Photos.app if it's running\n- Try again`));
          return;
        }
      });
      
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

      db.all(query, (err, rows: any[]) => {
        if (err) {
          db.close();
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }

        const locations: LocationData[] = rows.map(row => ({
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp ? new Date((row.timestamp + 978307200) * 1000) : undefined,
          filename: row.filename
        }));

        db.close();
        resolve(locations);
      });
    });
  }

  async getPhotosLibraryPath(): Promise<string> {
    const defaultPath = path.join(process.env.HOME || '', 'Pictures', 'Photos Library.photoslibrary');
    
    if (fs.existsSync(defaultPath)) {
      return path.join(defaultPath, 'database', 'Photos.sqlite');
    }
    
    throw new Error('Photos Library not found in default location');
  }
}