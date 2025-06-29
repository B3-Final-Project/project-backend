import { ApiProperty } from '@nestjs/swagger';

export class ReportUserResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Current report count for the user' })
  reportCount: number;
}

export class BanUserResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Indicates if the ban was successful' })
  success: boolean;
}
