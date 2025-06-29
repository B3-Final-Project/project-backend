import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { ReportReason } from '../../profile/dto/report.dto';

export class CreateReportDto {
  @ApiProperty({
    description: 'ID of the profile being reported',
    example: 123,
  })
  @IsNumber()
  @IsNotEmpty()
  reportedProfileId: number;

  @ApiProperty({
    description: 'Reason for the report',
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE_CONTENT,
  })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ApiProperty({
    description: 'Additional details about the report',
    example: 'User was sending inappropriate messages',
    required: false,
  })
  @IsString()
  @IsOptional()
  details?: string;
}
