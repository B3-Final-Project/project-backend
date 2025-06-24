import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  // Coordinates -> City
  async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const response = await axios.get(`${this.NOMINATIM_URL}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json',
        },
        headers: {
          'User-Agent': 'HoloMatch',
        },
      });

      const city =
        response.data.address?.city ||
        response.data.address?.town ||
        response.data.address?.village ||
        response.data.address?.municipality;

      return city ?? null;
    } catch (error) {
      this.logger.error(`Reverse geocoding failed:`, error);
      return null;
    }
  }

  // City-> Coordinates
  async geocode(city: string): Promise<[number, number] | null> {
    try {
      const response = await axios.get(`${this.NOMINATIM_URL}/search`, {
        params: {
          q: city,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'HoloMatch',
        },
      });

      if (response.data.length === 0) return null;

      const result = response.data[0];
      return [parseFloat(result.lon), parseFloat(result.lat)];
    } catch (error) {
      this.logger.error(`Geocoding failed:`, error);
      return null;
    }
  }
}
