import { Controller, Get, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { GeolocateService } from './geolocate.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { SearchCityDto } from './dto/search-city.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt-auth')
@ApiTags('geolocate')
@Controller('geolocate')
export class GeolocateController {
  constructor(private readonly geolocateService: GeolocateService) {}

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to city' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lon', type: Number })
  async reverseGeocode(@Query() query: ReverseGeocodeDto) {
    const { lat, lon } = query;
    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestException('lat and lon must be valid numbers');
    }
    return this.geolocateService.reverseGeocode(lat, lon);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for a city by name' })
  @ApiQuery({ name: 'query', type: String })
  async searchCity(@Query() query: SearchCityDto) {
    if (!query.query) {
      throw new BadRequestException('query parameter is required');
    }
    return this.geolocateService.searchCity(query.query);
  }
}
