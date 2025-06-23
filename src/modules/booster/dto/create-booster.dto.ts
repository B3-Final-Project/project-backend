<<<<<<< HEAD
import { RelationshipTypeEnum } from '../../profile/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoosterDto {
=======
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { RelationshipTypeEnum } from '../../profile/enums';

export class CreateBoosterDto {
  @ApiProperty({ example: 'Super Pack', description: 'Nom du booster' })
>>>>>>> main
  @IsString()
  @IsNotEmpty()
  name: string;

<<<<<<< HEAD
=======
  @ApiProperty({
    example: 'https://example.com/image.png',
    required: false,
    description: "URL de l'image du booster",
  })
>>>>>>> main
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

<<<<<<< HEAD
=======
  @ApiProperty({
    enum: RelationshipTypeEnum,
    description: 'Type de relation du booster',
  })
>>>>>>> main
  @IsEnum(RelationshipTypeEnum)
  @IsNotEmpty()
  type: RelationshipTypeEnum;
}
