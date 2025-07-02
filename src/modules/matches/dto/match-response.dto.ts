import { ApiProperty } from '@nestjs/swagger';

export class MatchActionResponseDto {
  @ApiProperty({ example: true, description: 'Indique si un match a eu lieu' })
  matched: boolean;
}
