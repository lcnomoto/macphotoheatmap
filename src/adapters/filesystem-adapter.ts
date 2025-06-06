import * as fs from 'fs';
import { FileSystemAdapter } from '../interfaces';

export class NodeFileSystemAdapter implements FileSystemAdapter {
  exists(path: string): boolean {
    return fs.existsSync(path);
  }

  writeFile(path: string, content: string): void {
    fs.writeFileSync(path, content, 'utf8');
  }

  readFile(path: string): string {
    return fs.readFileSync(path, 'utf8');
  }
}