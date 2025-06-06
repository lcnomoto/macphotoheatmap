import { LocationData, HeatmapGeneratorInterface, FileSystemAdapter, LocationDataProcessor } from './interfaces';

export class HeatmapGenerator implements HeatmapGeneratorInterface {
  
  constructor(
    private fileSystemAdapter: FileSystemAdapter,
    private locationProcessor: LocationDataProcessor
  ) {}
  
  async generateHeatmap(locations: LocationData[], outputPath: string, format: string = 'html'): Promise<void> {
    if (format === 'html') {
      await this.generateHTMLHeatmap(locations, outputPath);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async generateHTMLHeatmap(locations: LocationData[], outputPath: string): Promise<void> {
    const center = this.locationProcessor.calculateCenter(locations);
    const heatmapData = this.formatHeatmapData(locations);
    const html = this.generateHTMLTemplate(locations, center, heatmapData);

    this.fileSystemAdapter.writeFile(outputPath, html);
  }

  private formatHeatmapData(locations: LocationData[]): string {
    return locations.map(loc => `[${loc.latitude}, ${loc.longitude}, 1]`).join(',\n        ');
  }

  private generateHTMLTemplate(locations: LocationData[], center: { lat: number; lng: number }, heatmapData: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Photos Location Heatmap</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .info-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="info-panel">
        <h3>Photos Heatmap</h3>
        <p><strong>Total Photos:</strong> ${locations.length}</p>
        <p><strong>Date Range:</strong> ${this.locationProcessor.getDateRange(locations)}</p>
    </div>

    <script>
        // Initialize map
        var map = L.map('map').setView([${center.lat}, ${center.lng}], 10);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Heatmap data
        var heatmapData = [
        ${heatmapData}
        ];

        // Create heatmap layer
        var heat = L.heatLayer(heatmapData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: 'blue',
                0.2: 'cyan',
                0.4: 'lime',
                0.6: 'yellow',
                0.8: 'orange',
                1.0: 'red'
            }
        }).addTo(map);

        // Fit map to show all points
        if (heatmapData.length > 0) {
            var group = new L.featureGroup();
            heatmapData.forEach(function(point) {
                group.addLayer(L.marker([point[0], point[1]]));
            });
            map.fitBounds(group.getBounds().pad(0.1));
        }
    </script>
</body>
</html>`;
  }
}