import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  DrinkingEnum,
  GenderEnum,
  OrientationEnum,
  PoliticsEnum,
  RelationshipTypeEnum,
  ReligionEnum,
  SmokingEnum,
  ZodiacEnum,
} from '../enums';

class PersonalInfo {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsNumber()
  age: number;

  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @IsEnum(OrientationEnum)
  orientation: OrientationEnum;
}

class LocationWorkInfo {
  @IsString()
  city: string;

  @IsString()
  work: string;

  @IsString({ each: true })
  languages: string[];
}

class PreferenceInfo {
  @IsNumber()
  min_age: number;

  @IsNumber()
  max_age: number;

  @IsNumber()
  max_distance: number;

  @IsEnum(RelationshipTypeEnum)
  relationship_type: RelationshipTypeEnum;
}

class LifestyleInfo {
  @IsEnum(SmokingEnum)
  smoking: SmokingEnum;

  @IsEnum(DrinkingEnum)
  drinking: DrinkingEnum;

  @IsOptional()
  @IsEnum(ReligionEnum)
  religion: ReligionEnum;

  @IsOptional()
  @IsEnum(PoliticsEnum)
  politics: PoliticsEnum;

  @IsOptional()
  @IsEnum(ZodiacEnum)
  zodiac: ZodiacEnum;
}

export class UpdateProfileDto {
  @ValidateNested()
  personalInfo: PersonalInfo;

  @ValidateNested()
  preferenceInfo: PreferenceInfo;

  @ValidateNested()
  locationWork: LocationWorkInfo;

  @ValidateNested()
  lifestyleInfo: LifestyleInfo;

  @IsOptional()
  @IsString()
  interests?: string[];
}

export class PartialUpdateProfileDto extends PartialType(UpdateProfileDto) {}
