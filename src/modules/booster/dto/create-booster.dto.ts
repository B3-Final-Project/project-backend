import { RelationshipTypeEnum } from '../../profile/enums';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateBoosterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsEnum(RelationshipTypeEnum)
  @IsNotEmpty()
  type: RelationshipTypeEnum;
}
