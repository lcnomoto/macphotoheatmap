#!/usr/bin/env node

import { Command } from 'commander';
import { PhotosService } from './services/photos-service';

const program = new Command();
const photosService = new PhotosService();

program
  .name('photos-heatmap')
  .description('Create heatmaps from Photos.app location data')
  .version('1.0.0');

program
  .command('explore')
  .description('Explore Photos.app library structure')
  .action(async () => {
    try {
      await photosService.explorePhotosLibrary();
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
      
      const sampleLocations = photosService.generateSampleLocationData();
      console.log(`Generated ${sampleLocations.length} sample locations`);
      
      await photosService.generateHeatmap(sampleLocations, options.output);
      
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
      
      const photosDbPath = await photosService.findPhotosDatabase(options.photosDb);
      console.log(`Using Photos database: ${photosDbPath}`);
      
      const locations = await photosService.extractLocationData(photosDbPath);
      console.log(`Found ${locations.length} photos with location data`);
      
      if (locations.length === 0) {
        console.log('No location data found in Photos.app');
        return;
      }
      
      console.log('Generating heatmap...');
      await photosService.generateHeatmap(locations, options.output, options.format);
      
      console.log(`Heatmap saved to: ${options.output}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();