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
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
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
  @IsOptional()
  @IsEnum(SmokingEnum)
  smoking: SmokingEnum;

  @ApiProperty()
  @IsOptional()
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

export class InterestItem {
  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiProperty()
  @IsString()
  answer: string;
}

export class InterestInfo {
  @ApiProperty({ type: [InterestItem] })
  @ValidateNested({ each: true })
  @Type(() => InterestItem)
  interests: InterestItem[];
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

  @ApiProperty({ type: InterestInfo, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InterestInfo)
  interestInfo?: InterestInfo;
}

export class PartialUpdateProfileDto extends PartialType(UpdateProfileDto) {}