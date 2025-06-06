import * as sqlite3 from 'sqlite3';
import { DatabaseAdapter } from '../interfaces';

export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: sqlite3.Database | null = null;
  
  constructor(private dbPath: string) {}

  async query(sql: string): Promise<any[]> {
    if (!this.db) {
      await this.connect();
    }
    
    return new Promise((resolve, reject) => {
      this.db!.all(sql, (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }
        resolve(rows || []);
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Cannot open Photos database: ${err.message}\n\nThis usually means:\n1. Full Disk Access permission is not granted to your terminal\n2. Photos.app is currently running (try closing it)\n3. The database is locked by another process\n\nPlease:\n- Go to System Settings > Privacy & Security > Full Disk Access\n- Add your terminal application to the list\n- Close Photos.app if it's running\n- Try again`));
          return;
        }
        resolve();
      });
    });
  }
}