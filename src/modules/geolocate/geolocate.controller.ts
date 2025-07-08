import {
  Controller,
  Get,
  UseGuards,
  Param,
  Body,
  Put,
  UseInterceptors,
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
import { AuthGuard } from '@nestjs/passport';
import {
  HateoasCollectionOnly,
  HateoasLinks,
} from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt-auth')
@ApiTags('geolocate')
@UseInterceptors(HateoasInterceptor)
@Controller('geolocate')
export class GeolocateController {
  constructor(private readonly geolocateService: GeolocateService) {}

  @Put('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to city' })
  @ApiBody({
    type: ReverseGeocodeDto,
    description: 'Coordinates to reverse geocode',
  })
  @HateoasLinks('geolocate', AppLinkBuilders.geoLocationLinks())
  async reverseGeocode(@Body() body: ReverseGeocodeDto) {
    return this.geolocateService.reverseGeocode(body);
  }

  @Get('search/:city')
  @ApiOperation({ summary: 'Search for a city by name' })
  @ApiQuery({ name: 'city', type: String })
  @HateoasCollectionOnly('geolocate', AppLinkBuilders.geoLocationLinks())
  async searchCity(@Param('city') city: string) {
    return this.geolocateService.searchCity(city);
  }
}
