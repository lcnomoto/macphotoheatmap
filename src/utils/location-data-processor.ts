import { LocationData, LocationDataProcessor } from '../interfaces';

export class LocationDataProcessorImpl implements LocationDataProcessor {
  calculateCenter(locations: LocationData[]): { lat: number; lng: number } {
    if (locations.length === 0) {
      return { lat: 35.6762, lng: 139.6503 }; // Tokyo default
    }

    const sum = locations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.latitude,
        lng: acc.lng + loc.longitude
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / locations.length,
      lng: sum.lng / locations.length
    };
  }

  getDateRange(locations: LocationData[]): string {
    const dates = locations
      .map(loc => loc.timestamp)
      .filter(date => date)
      .sort();

    if (dates.length === 0) {
      return 'Unknown';
    }

    const earliest = dates[0]!.toLocaleDateString();
    const latest = dates[dates.length - 1]!.toLocaleDateString();

    return earliest === latest ? earliest : `${earliest} - ${latest}`;
  }

  validateLocation(location: LocationData): boolean {
    return (
      location.latitude !== null &&
      location.longitude !== null &&
      location.latitude !== 0 &&
      location.longitude !== 0 &&
      location.latitude !== -180.0 &&
      location.longitude !== -180.0 &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  }
}