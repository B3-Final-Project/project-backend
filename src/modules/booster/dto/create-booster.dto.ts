import { RelationshipTypeEnum } from '../../profile/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoosterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

  @IsEnum(RelationshipTypeEnum)
  @IsNotEmpty()
  type: RelationshipTypeEnum;
}
