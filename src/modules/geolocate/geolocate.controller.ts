import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Param,
  Body,
} from '@nestjs/common';
import { GeolocateService } from './geolocate.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiBody({
    type: ReverseGeocodeDto,
    description: 'Coordinates to reverse geocode',
  })
  async reverseGeocode(@Body() body: ReverseGeocodeDto) {
    const { lat, lon } = body;
    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestException('lat and lon must be valid numbers');
    }
    return this.geolocateService.reverseGeocode(lat, lon);
  }

  @Get('search/:city')
  @ApiOperation({ summary: 'Search for a city by name' })
  @ApiQuery({ name: 'city', type: String })
  async searchCity(@Param() city: string) {
    return this.geolocateService.searchCity(city);
  }
}
