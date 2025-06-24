import {
  IsArray,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PersonalInfo {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  surname: string;

  @IsNumber()
  @ApiProperty()
  age: number;

  @IsEnum(GenderEnum)
  @ApiProperty()
  gender: GenderEnum;

  @IsEnum(OrientationEnum)
  @ApiProperty()
  orientation: OrientationEnum;
}

class LocationWorkInfo {
  @IsString()
  @ApiProperty()
  city: string;

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
  @IsNumber()
  @ApiProperty()
  min_age: number;

  @IsNumber()
  @ApiProperty()
  max_age: number;

  @IsNumber()
  @ApiProperty()
  max_distance: number;

  @IsEnum(RelationshipTypeEnum)
  relationship_type: RelationshipTypeEnum;
}

class LifestyleInfo {
  @IsEnum(SmokingEnum)
  @ApiProperty()
  smoking: SmokingEnum;

  @IsEnum(DrinkingEnum)
  @ApiProperty()
  drinking: DrinkingEnum;

  @IsOptional()
  @IsEnum(ReligionEnum)
  @ApiProperty()
  religion: ReligionEnum;

  @IsOptional()
  @IsEnum(PoliticsEnum)
  @ApiProperty()
  politics: PoliticsEnum;

  @IsOptional()
  @IsEnum(ZodiacEnum)
  zodiac: ZodiacEnum;
}

export class UpdateProfileDto {
  @ValidateNested()
  @Type(() => PersonalInfo)
  @ApiProperty({ type: PersonalInfo })
  personalInfo: PersonalInfo;

  @ValidateNested()
  @Type(() => PreferenceInfo)
  @ApiProperty({ type: PreferenceInfo })
  preferenceInfo: PreferenceInfo;

  @ValidateNested()
  @Type(() => LocationWorkInfo)
  @ApiProperty({ type: LocationWorkInfo })
  locationWork: LocationWorkInfo;

  @ValidateNested()
  @Type(() => LifestyleInfo)
  @ApiProperty({ type: LifestyleInfo })
  lifestyleInfo: LifestyleInfo;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String], required: false })
  interests?: string[];
}

export class PartialUpdateProfileDto extends PartialType(UpdateProfileDto) {}
