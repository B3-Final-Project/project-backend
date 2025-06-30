import {
  HateoasCollection,
  HateoasLink,
  HateoasResponse,
} from '../interfaces/hateoas.interface';

import { ApiProperty } from '@nestjs/swagger';

/**
 * Example DTO showing how HATEOAS responses will look
 */
export class HateoasLinkDto implements HateoasLink {
  @ApiProperty({ description: 'The relationship type', example: 'self' })
  rel: string;

  @ApiProperty({
    description: 'The URL for this link',
    example: 'https://api.example.com/users/123',
  })
  href: string;

  @ApiProperty({ description: 'HTTP method', example: 'GET', required: false })
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  @ApiProperty({
    description: 'Content type',
    example: 'application/json',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Human readable title',
    example: 'View user details',
    required: false,
  })
  title?: string;
}

export class HateoasUserResponseDto implements HateoasResponse {
  @ApiProperty({
    description: 'The user data',
    example: {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    },
  })
  data: any;

  @ApiProperty({
    description: 'HATEOAS links',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HateoasLinkDto' },
    example: {
      self: {
        rel: 'self',
        href: 'https://api.example.com/users/123',
        method: 'GET',
      },
      edit: {
        rel: 'edit',
        href: 'https://api.example.com/users/123',
        method: 'PUT',
        title: 'Update this user',
      },
      delete: {
        rel: 'delete',
        href: 'https://api.example.com/users/123',
        method: 'DELETE',
        title: 'Delete this user',
      },
    },
  })
  _links: Record<string, HateoasLink>;
}

export class HateoasCollectionMetaDto {
  @ApiProperty({ description: 'Number of items in this response', example: 10 })
  count: number;

  @ApiProperty({
    description: 'Total number of items available',
    example: 100,
    required: false,
  })
  total?: number;

  @ApiProperty({
    description: 'Offset for pagination',
    example: 0,
    required: false,
  })
  offset?: number;

  @ApiProperty({
    description: 'Limit for pagination',
    example: 10,
    required: false,
  })
  limit?: number;
}

export class HateoasUserCollectionResponseDto implements HateoasCollection {
  @ApiProperty({
    description: 'Array of user resources with HATEOAS links',
    type: [HateoasUserResponseDto],
  })
  data: HateoasUserResponseDto[];

  @ApiProperty({
    description: 'Collection-level HATEOAS links',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HateoasLinkDto' },
    example: {
      self: {
        rel: 'self',
        href: 'https://api.example.com/users?offset=0&limit=10',
        method: 'GET',
      },
      first: {
        rel: 'first',
        href: 'https://api.example.com/users?offset=0&limit=10',
        method: 'GET',
      },
      next: {
        rel: 'next',
        href: 'https://api.example.com/users?offset=10&limit=10',
        method: 'GET',
      },
      last: {
        rel: 'last',
        href: 'https://api.example.com/users?offset=90&limit=10',
        method: 'GET',
      },
    },
  })
  _links: Record<string, HateoasLink>;

  @ApiProperty({
    description: 'Collection metadata',
    type: HateoasCollectionMetaDto,
  })
  _meta?: HateoasCollectionMetaDto;
}
