import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SearchCityDto {
  @ApiProperty({ type: String })
  @IsString()
  query: string;
}
