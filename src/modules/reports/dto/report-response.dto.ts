import { ApiProperty } from '@nestjs/swagger';

export class HateoasLink {
  @ApiProperty({ description: 'The URL for the link' })
  href: string;

  @ApiProperty({ description: 'HTTP method for the link', required: false })
  method?: string;

  @ApiProperty({ description: 'Content type for the link', required: false })
  type?: string;
}

export class HateoasLinks {
  @ApiProperty({ type: HateoasLink, description: 'Link to self' })
  self: HateoasLink;

  @ApiProperty({
    type: HateoasLink,
    description: 'Link to reported profile',
    required: false,
  })
  reportedProfile?: HateoasLink;

  @ApiProperty({
    type: HateoasLink,
    description: 'Link to reporter profile',
    required: false,
  })
  reporter?: HateoasLink;

  @ApiProperty({
    type: HateoasLink,
    description: 'Link to delete report',
    required: false,
  })
  delete?: HateoasLink;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID of the reported profile', example: 123 })
  reportedProfileId: number;

  @ApiProperty({
    description: 'ID of the user who made the report',
    example: 'user-456',
  })
  reporterId: string;

  @ApiProperty({
    description: 'Reason for the report',
    example: 'Inappropriate behavior',
  })
  reason: string;

  @ApiProperty({
    description: 'Additional details about the report',
    example: 'User was sending inappropriate messages',
    required: false,
  })
  details?: string;

  @ApiProperty({ description: 'Report status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Date when the report was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the report was last updated' })
  updatedAt: Date;

  @ApiProperty({ type: HateoasLinks, description: 'HATEOAS navigation links' })
  _links: HateoasLinks;
}

export class ReportsListResponseDto {
  @ApiProperty({ type: [ReportResponseDto], description: 'List of reports' })
  reports: ReportResponseDto[];

  @ApiProperty({ description: 'Total number of reports' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ type: HateoasLinks, description: 'HATEOAS navigation links' })
  _links: {
    self: HateoasLink;
    first?: HateoasLink;
    prev?: HateoasLink;
    next?: HateoasLink;
    last?: HateoasLink;
  };
}
