#!/usr/bin/env node

import { Command } from 'commander';
import { PhotosExtractor } from './photos-extractor';
import { HeatmapGenerator } from './heatmap-generator';
import * as path from 'path';
import * as os from 'os';

const program = new Command();

program
  .name('photos-heatmap')
  .description('Create heatmaps from Photos.app location data')
  .version('1.0.0');

program
  .command('explore')
  .description('Explore Photos.app library structure')
  .action(async () => {
    try {
      const photosLibPath = path.join(os.homedir(), 'Pictures', 'Photos Library.photoslibrary');
      console.log(`Photos Library path: ${photosLibPath}`);
      
      if (!require('fs').existsSync(photosLibPath)) {
        console.error('Photos Library not found');
        return;
      }
      
      function exploreDirectory(dir: string, depth: number = 0): void {
        if (depth > 2) return;
        
        try {
          const items = require('fs').readdirSync(dir);
          items.forEach((item: string) => {
            const fullPath = path.join(dir, item);
            const indent = '  '.repeat(depth);
            
            try {
              const stats = require('fs').statSync(fullPath);
              if (stats.isDirectory()) {
                console.log(`${indent}📁 ${item}/`);
                exploreDirectory(fullPath, depth + 1);
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
      
      exploreDirectory(photosLibPath);
      
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
    }
  });

program
  .command('test')
  .description('Generate test heatmap with sample data')
  .option('-o, --output <path>', 'Output file path', './test-heatmap.html')
  .action(async (options) => {
    try {
      console.log('Generating test heatmap with sample data...');
      
      // Generate sample location data around Tokyo
      const sampleLocations = [
        { latitude: 35.6762, longitude: 139.6503, timestamp: new Date('2024-01-15') }, // Tokyo Station
        { latitude: 35.6586, longitude: 139.7454, timestamp: new Date('2024-02-10') }, // Tokyo Skytree
        { latitude: 35.6595, longitude: 139.7006, timestamp: new Date('2024-03-05') }, // Imperial Palace
        { latitude: 35.6684, longitude: 139.7647, timestamp: new Date('2024-04-12') }, // Asakusa
        { latitude: 35.6598, longitude: 139.7030, timestamp: new Date('2024-05-20') }, // Ginza
        { latitude: 35.6938, longitude: 139.7035, timestamp: new Date('2024-06-01') }, // Ueno
      ];
      
      console.log(`Generated ${sampleLocations.length} sample locations`);
      
      const generator = new HeatmapGenerator();
      await generator.generateHeatmap(sampleLocations, options.output);
      
      console.log(`Test heatmap saved to: ${options.output}`);
      console.log('Open the HTML file in a web browser to view the heatmap.');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate heatmap from Photos.app location data')
  .option('-o, --output <path>', 'Output file path', './heatmap.html')
  .option('-f, --format <format>', 'Output format (html, png)', 'html')
  .option('--photos-db <path>', 'Custom Photos database path')
  .action(async (options) => {
    try {
      console.log('Extracting location data from Photos.app...');
      
      let photosDbPath = options.photosDb;
      
      if (!photosDbPath) {
        const photosLibPath = path.join(os.homedir(), 'Pictures', 'Photos Library.photoslibrary');
        
        // Try different possible database paths
        const possiblePaths = [
          path.join(photosLibPath, 'database', 'Photos.sqlite'),
          path.join(photosLibPath, 'database', 'photos.db'),
          path.join(photosLibPath, 'Photos.sqlite'),
          path.join(photosLibPath, 'database', 'Photos.db'),
          path.join(photosLibPath, 'database', 'search', 'psi.sqlite')
        ];
        
        photosDbPath = possiblePaths.find(p => {
          try {
            return require('fs').existsSync(p);
          } catch {
            return false;
          }
        });
        
        if (!photosDbPath) {
          console.error('Could not find Photos database. Tried:');
          possiblePaths.forEach(p => console.error(`  - ${p}`));
          console.error('\nThis app requires Full Disk Access permission.');
          console.error('Please go to System Settings > Privacy & Security > Full Disk Access');
          console.error('and add your terminal application to the list.');
          console.error('\nAlternatively, you can specify a custom database path with:');
          console.error('  --photos-db "/path/to/Photos Library.photoslibrary/database/photos.db"');
          process.exit(1);
        }
        
        console.log(`Using Photos database: ${photosDbPath}`);
      }
      
      const extractor = new PhotosExtractor(photosDbPath);
      const locations = await extractor.extractLocations();
      
      console.log(`Found ${locations.length} photos with location data`);
      
      if (locations.length === 0) {
        console.log('No location data found in Photos.app');
        return;
      }
      
      console.log('Generating heatmap...');
      const generator = new HeatmapGenerator();
      await generator.generateHeatmap(locations, options.output, options.format);
      
      console.log(`Heatmap saved to: ${options.output}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();