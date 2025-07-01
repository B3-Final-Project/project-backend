import { ApiProperty } from '@nestjs/swagger';

export class UserCredentialsDto {
  @ApiProperty({ description: 'Identifiant unique de l’utilisateur' })
  userId: string;

  @ApiProperty({
    type: [String],
    description: 'Groupes ou rôles de l’utilisateur',
  })
  groups: string[];
}

export class HttpRequestDto extends Request {
  @ApiProperty({ type: UserCredentialsDto })
  user: UserCredentialsDto;
}
