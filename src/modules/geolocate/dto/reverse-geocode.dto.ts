import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  lat: number;

  @ApiProperty({ type: Number })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  lon: number;
} 