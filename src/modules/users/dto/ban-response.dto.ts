import { ApiProperty } from '@nestjs/swagger';

export class HateoasLink {
  @ApiProperty({ description: 'The URL for the link' })
  href: string;

  @ApiProperty({ description: 'HTTP method for the link', required: false })
  method?: string;
}

export class BanResponseDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  userId: string;

  @ApiProperty({ description: 'Ban status', example: true })
  isBanned: boolean;

  @ApiProperty({ description: 'Date when the ban was created or removed' })
  timestamp: Date;

  @ApiProperty({ description: 'Reason for the ban', required: false })
  reason?: string;

  @ApiProperty({ description: 'HATEOAS navigation links' })
  _links: {
    self: HateoasLink;
    user: HateoasLink;
    unban?: HateoasLink;
    ban?: HateoasLink;
  };
}

export class BanStatusResponseDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  userId: string;

  @ApiProperty({
    description: 'Whether the user is currently banned',
    example: false,
  })
  isBanned: boolean;

  @ApiProperty({
    description: 'Date when the ban was created',
    required: false,
  })
  bannedAt?: Date;

  @ApiProperty({ description: 'Reason for the ban', required: false })
  reason?: string;

  @ApiProperty({ description: 'HATEOAS navigation links' })
  _links: {
    self: HateoasLink;
    user: HateoasLink;
    ban?: HateoasLink;
    unban?: HateoasLink;
  };
}
