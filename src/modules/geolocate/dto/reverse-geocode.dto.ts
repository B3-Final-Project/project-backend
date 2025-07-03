import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({ type: Number })
  @IsLatitude()
  lat: number;

  @ApiProperty({ type: Number })
  @IsLongitude()
  lon: number;
}
