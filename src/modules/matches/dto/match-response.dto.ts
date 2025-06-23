<<<<<<< HEAD
import { Profile } from '../../../common/entities/profile.entity';

export interface GetMatchesResponse {
  matches: Profile[];
}

export interface GetPendingMatchesResponse {
  matches: Profile[];
}

export interface GetSentMatchesResponse {
  matches: Profile[];
}

export interface MatchActionResponseDto {
=======
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../../common/entities/profile.entity';

export class GetMatchesResponse {
  @ApiProperty({ type: [Profile] })
  matches: Profile[];
}

export class GetPendingMatchesResponse {
  @ApiProperty({ type: [Profile] })
  matches: Profile[];
}

export class GetSentMatchesResponse {
  @ApiProperty({ type: [Profile] })
  matches: Profile[];
}

export class MatchActionResponseDto {
  @ApiProperty({ example: true, description: 'Indique si un match a eu lieu' })
>>>>>>> main
  matched: boolean;
}
