import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { RelationshipTypeEnum } from '../../profile/enums';

export class CreateBoosterDto {
  @ApiProperty({ example: 'Super Pack', description: 'Nom du booster' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'https://example.com/image.png',
    required: false,
    description: "URL de l'image du booster",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

  @ApiProperty({
    enum: RelationshipTypeEnum,
    description: 'Type de relation du booster',
  })
  @IsEnum(RelationshipTypeEnum)
  @IsNotEmpty()
  type: RelationshipTypeEnum;
}
