import * as sqlite3 from 'sqlite3';
import { DatabaseAdapter } from '../interfaces';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database | null = null;

  constructor(private dbPath: string, private mode: number = sqlite3.OPEN_READONLY) {}

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this.db = new sqlite3.Database(this.dbPath, this.mode, (err) => {
          if (err) {
            reject(new Error(`Cannot open database: ${err.message}`));
            return;
          }
        });
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }
        resolve(rows || []);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}