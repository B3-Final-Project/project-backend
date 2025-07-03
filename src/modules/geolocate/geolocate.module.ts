import { Module } from '@nestjs/common';
import { GeolocateService } from './geolocate.service';
import { GeolocateController } from './geolocate.controller';

@Module({
  providers: [GeolocateService],
  exports: [GeolocateService],
  controllers: [GeolocateController],
})
export class GeolocateModule {}
