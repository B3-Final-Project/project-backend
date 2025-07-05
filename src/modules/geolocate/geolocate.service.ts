import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ReverseGeocodeResultDto } from './dto/reverse-geocode-result.dto';
import { SearchCityResultDto } from './dto/search-city-result.dto';
import {
  NominatimReverseResponse,
  NominatimSearchResponse,
} from './interfaces/nominatim.interface';

@Injectable()
export class GeolocateService {
  private readonly logger = new Logger(GeolocateService.name);
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly HEADERS = {
    'User-Agent': 'HoloMatch-Backend/1.0',
  };

  async reverseGeocode(
    lat: number,
    lon: number,
  ): Promise<ReverseGeocodeResultDto> {
    try {
      const { data } = await axios.get<NominatimReverseResponse>(
        `${this.NOMINATIM_BASE_URL}/reverse?`,
        {
          params: {
            lat,
            lon,
            format: 'json',
          },
          headers: this.HEADERS,
        },
      );
      const address = data?.address;
      const city =
        address?.city ||
        address?.town ||
        address?.village ||
        address?.municipality;
      return { city: city ?? null };
    } catch (error) {
      this.logger.error(
        `Error during reverse geocode for lat=${lat}, lon=${lon}:`,
        error,
      );
      return { city: null };
    }
  }

  async searchCity(query: string): Promise<SearchCityResultDto[]> {
    try {
      const { data } = await axios.get<NominatimSearchResponse[]>(
        `${this.NOMINATIM_BASE_URL}/search?`,
        {
          params: {
            q: query,
            format: 'json',
            limit: 5,
          },
          headers: this.HEADERS,
        },
      );
      return data.map((result) => ({
        name: result.display_name,
        lon: parseFloat(result.lon),
        lat: parseFloat(result.lat),
      }));
    } catch (error) {
      this.logger.error(
        `Error during city search for query="${query}":`,
        error,
      );
      return [];
    }
  }
}
