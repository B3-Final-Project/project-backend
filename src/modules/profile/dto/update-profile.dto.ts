
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class PersonalInfo {
  @ApiProperty()
  @IsString()
  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsString()
  @ApiProperty()
  surname: string;

  @ApiProperty()
  @IsNumber()
  @ApiProperty()
  age: number;

  @ApiProperty()
  @IsEnum(GenderEnum)
  @ApiProperty()
  gender: GenderEnum;

  @ApiProperty()
  @IsEnum(OrientationEnum)
  @ApiProperty()
  orientation: OrientationEnum;
}

class LocationWorkInfo {
  @ApiProperty()
  @IsString()
  @ApiProperty()
  city: string;

  @ApiProperty()
  @IsString()
  @ApiProperty()
  work: string;

  @IsString({ each: true })
  languages: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({
    description: 'Geolocation coordinates [longitude, latitude]',
    type: [Number],
    example: [2.3522, 48.8566],
  })
  coordinates?: [number, number];
}

class PreferenceInfo {
  @ApiProperty()
  @IsNumber()
  @ApiProperty()
  min_age: number;

  @ApiProperty()
  @IsNumber()
  @ApiProperty()
  max_age: number;

  @ApiProperty()
  @IsNumber()
  @ApiProperty()
  max_distance: number;

  @IsEnum(RelationshipTypeEnum)
  relationship_type: RelationshipTypeEnum;
}

class LifestyleInfo {
  @ApiProperty()
  @IsEnum(SmokingEnum)
  @ApiProperty()
  smoking: SmokingEnum;

  @ApiProperty()
  @IsEnum(DrinkingEnum)
  @ApiProperty()
  drinking: DrinkingEnum;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ReligionEnum)
  @ApiProperty()
  religion: ReligionEnum;

  @ApiProperty()
  @IsOptional()
  @IsEnum(PoliticsEnum)
  @ApiProperty()
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
  @ApiProperty({ type: PersonalInfo })
  personalInfo: PersonalInfo;

  @ApiProperty({ type: PreferenceInfo })
  @ValidateNested()
  @Type(() => PreferenceInfo)
  @ApiProperty({ type: PreferenceInfo })
  preferenceInfo: PreferenceInfo;

  @ApiProperty({ type: LocationWorkInfo })
  @ValidateNested()
  @Type(() => LocationWorkInfo)
  @ApiProperty({ type: LocationWorkInfo })
  locationWork: LocationWorkInfo;

  @ApiProperty({ type: LifestyleInfo })
  @ValidateNested()
  @Type(() => LifestyleInfo)
  @ApiProperty({ type: LifestyleInfo })
  lifestyleInfo: LifestyleInfo;

  @ApiProperty({ type: InterestInfo, required: false })
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String], required: false })
  interests?: string[];
}

export class PartialUpdateProfileDto extends PartialType(UpdateProfileDto) {}
