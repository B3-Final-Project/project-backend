import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReportResponseDto,
  ReportsListResponseDto,
} from './dto/report-response.dto';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportRepository } from '../../common/repository/report.repository';

interface GetReportsFilters {
  offset: number;
  limit: number;
  profileId?: number;
  reporterId?: string;
  status?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async createReport(
    reporterId: string,
    createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    const report = await this.reportRepository.create(
      createReportDto.reportedProfileId,
      reporterId,
      {
        reason: createReportDto.reason,
        message: createReportDto.details || '',
      },
    );

    return this.mapToReportResponseDto(report);
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
      reports: reports.map((report) => this.mapToReportResponseDto(report)),
      total,
      page,
      limit,
      totalPages,
      _links: this.generateListLinks(page, totalPages, limit, filters),
    };
  }

  async getReportById(reportId: number): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return this.mapToReportResponseDto(report);
  }

  async deleteReport(reportId: number): Promise<{ message: string }> {
    const report = await this.reportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await this.reportRepository.deleteById(reportId);

    return { message: 'Report deleted successfully' };
  }

  private mapToReportResponseDto(report: any): ReportResponseDto {
    return {
      id: report.id,
      reportedProfileId: report.reportedProfileId,
      reporterId: report.reporterId,
      reason: report.reason,
      details: report.details,
      status: report.status ?? 'pending',
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      _links: {
        self: { href: `/reports/${report.id}` },
        reportedProfile: { href: `/profiles/${report.reportedProfileId}` },
        reporter: { href: `/users/${report.reporterId}` },
        delete: {
          href: `/reports/${report.id}`,
          method: 'DELETE',
        },
      },
    };
  }

  private generateListLinks(
    page: number,
    totalPages: number,
    limit: number,
    filters: GetReportsFilters,
  ) {
    const baseUrl = '/reports';
    const queryParams = this.buildQueryParams(filters);

    const links: any = {
      self: { href: `${baseUrl}?page=${page}&limit=${limit}${queryParams}` },
    };

    if (page > 1) {
      links.first = { href: `${baseUrl}?page=1&limit=${limit}${queryParams}` };
      links.prev = {
        href: `${baseUrl}?page=${page - 1}&limit=${limit}${queryParams}`,
      };
    }

    if (page < totalPages) {
      links.next = {
        href: `${baseUrl}?page=${page + 1}&limit=${limit}${queryParams}`,
      };
      links.last = {
        href: `${baseUrl}?page=${totalPages}&limit=${limit}${queryParams}`,
      };
    }

    return links;
  }

  private buildQueryParams(filters: GetReportsFilters): string {
    const params = [];

    if (filters.profileId) params.push(`profileId=${filters.profileId}`);
    if (filters.reporterId) params.push(`reporterId=${filters.reporterId}`);
    if (filters.status) params.push(`status=${filters.status}`);

    return params.length > 0 ? `&${params.join('&')}` : '';
  }
}
