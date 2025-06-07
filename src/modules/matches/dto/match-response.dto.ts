export class MatchResponseDto {
  matched: boolean;
  message?: string;
}

export class MatchActionDto {
  success: boolean;
  matched?: boolean;
  message?: string;
}
