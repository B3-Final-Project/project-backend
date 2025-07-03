import { ApiProperty } from '@nestjs/swagger';
import { Report } from '../../../common/entities/report.entity';

export class ReportsListResponseDto {
  @ApiProperty({ type: [Report], description: 'List of reports' })
  reports: Report[];

  @ApiProperty({ description: 'Total number of reports' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
