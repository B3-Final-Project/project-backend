import { ApiProperty } from '@nestjs/swagger';

export class HateoasLink {
  @ApiProperty({ description: 'The URL for the link' })
  href: string;

  @ApiProperty({ description: 'HTTP method for the link', required: false })
  method?: string;
}

export class ImageResponseDto {
  @ApiProperty({ description: 'Image ID', example: 'img_123' })
  id: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://s3.amazonaws.com/bucket/image.jpg',
  })
  url: string;

  @ApiProperty({ description: 'Image index position', example: 0 })
  index: number;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ description: 'File size in bytes', example: 1024000 })
  size: number;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: 'HATEOAS navigation links' })
  _links: {
    self: HateoasLink;
    profile: HateoasLink;
    replace: HateoasLink;
    delete: HateoasLink;
  };
}

export class ImagesListResponseDto {
  @ApiProperty({
    type: [ImageResponseDto],
    description: 'List of profile images',
  })
  images: ImageResponseDto[];

  @ApiProperty({ description: 'Total number of images' })
  total: number;

  @ApiProperty({ description: 'Profile ID' })
  profileId: number;

  @ApiProperty({ description: 'HATEOAS navigation links' })
  _links: {
    self: HateoasLink;
    profile: HateoasLink;
    upload: HateoasLink;
  };
}
