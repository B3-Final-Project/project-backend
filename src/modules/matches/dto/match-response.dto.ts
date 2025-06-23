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
  matched: boolean;
}
