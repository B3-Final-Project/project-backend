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
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PersonalInfo {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  surname: string;

  @ApiProperty()
  @IsNumber()
  age: number;

  @ApiProperty()
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @ApiProperty()
  @IsEnum(OrientationEnum)
  orientation: OrientationEnum;
}

class LocationWorkInfo {
  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  work: string;

  @IsString({ each: true })
  languages: string[];
}

class PreferenceInfo {
  @ApiProperty()
  @IsNumber()
  min_age: number;

  @ApiProperty()
  @IsNumber()
  max_age: number;

  @ApiProperty()
  @IsNumber()
  max_distance: number;

  @IsEnum(RelationshipTypeEnum)
  relationship_type: RelationshipTypeEnum;
}

class LifestyleInfo {
  @ApiProperty()
  @IsEnum(SmokingEnum)
  smoking: SmokingEnum;

  @ApiProperty()
  @IsEnum(DrinkingEnum)
  drinking: DrinkingEnum;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ReligionEnum)
  religion: ReligionEnum;

  @ApiProperty()
  @IsOptional()
  @IsEnum(PoliticsEnum)
  politics: PoliticsEnum;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ZodiacEnum)
  zodiac: ZodiacEnum;
}

export class UpdateProfileDto {
  @ApiProperty({ type: PersonalInfo })
  @ValidateNested()
  @Type(() => PersonalInfo)
  personalInfo: PersonalInfo;

  @ApiProperty({ type: PreferenceInfo })
  @ValidateNested()
  @Type(() => PreferenceInfo)
  preferenceInfo: PreferenceInfo;

  @ApiProperty({ type: LocationWorkInfo })
  @ValidateNested()
  @Type(() => LocationWorkInfo)
  locationWork: LocationWorkInfo;

  @ApiProperty({ type: LifestyleInfo })
  @ValidateNested()
  @Type(() => LifestyleInfo)
  lifestyleInfo: LifestyleInfo;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString({ each: true })
  interests?: string[];
}

export class PartialUpdateProfileDto extends PartialType(UpdateProfileDto) {}
