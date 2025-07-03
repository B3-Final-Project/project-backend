import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReportsListResponseDto } from './dto/report-response.dto';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportRepository } from '../../common/repository/report.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { Report } from '../../common/entities/report.entity';

interface GetReportsFilters {
  offset: number;
  limit: number;
  profileId?: number;
  reporterId?: string;
  status?: string;
}

@Injectable()
export class ReportsService {
  private logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async reportUser(reporterUserId: string, body: CreateReportDto) {
    // Find the reported user's profile
    const reportedProfile = await this.profileRepository.findByProfileId(
      body.reportedProfileId,
    );

    if (!reportedProfile) {
      throw new NotFoundException(
        `User with Profile ID ${body.reportedProfileId} not found`,
      );
    }

    // Create the report record
    await this.createReport(reporterUserId, body);

    // Update the report count by counting actual reports
    const reportCount = await this.reportRepository.countByProfileId(
      body.reportedProfileId,
    );

    // Update the profile's report count
    reportedProfile.reportCount = reportCount;
    await this.profileRepository.save(reportedProfile);

    this.logger.log(`User reported`, {
      reportedProfileId: body.reportedProfileId,
      reporterUserId,
      newReportCount: reportCount,
      reason: body.reason,
      message: body.details,
    });

    return {
      message: body.details,
      reportCount,
    };
  }

  private async createReport(
    reporterId: string,
    createReportDto: CreateReportDto,
  ): Promise<Report> {
    const report = await this.reportRepository.create(
      createReportDto.reportedProfileId,
      reporterId,
      {
        reason: createReportDto.reason,
        message: createReportDto.details || '',
      },
    );

    return report;
  }

  async getAllReports(
    filters: GetReportsFilters,
  ): Promise<ReportsListResponseDto> {
    const { offset, limit, profileId, reporterId, status } = filters;

    // This would need to be implemented in the repository
    const { reports, total } = await this.reportRepository.findAllWithFilters({
      offset,
      limit,
      profileId,
      reporterId,
      status,
    });

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      reports,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getReportById(reportId: number): Promise<Report> {
    const report = await this.reportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return report;
  }

  async deleteReport(reportId: number): Promise<{ message: string }> {
    const report = await this.reportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await this.reportRepository.deleteById(reportId);

    return { message: 'Report deleted successfully' };
  }
}
