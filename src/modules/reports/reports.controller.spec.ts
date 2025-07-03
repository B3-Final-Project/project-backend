import { Test, TestingModule } from '@nestjs/testing';

import { CreateReportDto } from './dto/create-report.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasService } from '../../common/services/hateoas.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { NotFoundException } from '@nestjs/common';
import { Report } from '../../common/entities/report.entity';
import { ReportReason } from '../profile/dto/report.dto';
import { ReportsController } from './reports.controller';
import { ReportsListResponseDto } from './dto/report-response.dto';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            reportUser: jest.fn(),
            getAllReports: jest.fn(),
            getReportById: jest.fn(),
            deleteReport: jest.fn(),
          },
        },
        {
          provide: HateoasService,
          useValue: {
            registerLinkBuilders: jest.fn(),
            processResource: jest.fn((resource) => resource),
            processCollection: jest.fn((collection) => collection),
          },
        },
      ],
    })
    .overrideInterceptor(HateoasInterceptor)
    .useValue({
      intercept: jest.fn().mockImplementation((_, next) => next.handle()),
    })
    .compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReport', () => {
    const mockRequest: Partial<HttpRequestDto> = {
      user: { userId: 'user123', groups: [] },
    };

    const createReportDto: CreateReportDto = {
      reportedProfileId: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      details: 'Inappropriate content',
    };

    const mockResponse = {
      message: 'Inappropriate content',
      reportCount: 1,
    };

    it('should create a new report', async () => {
      service.reportUser.mockResolvedValue(mockResponse);

      const result = await controller.createReport(
        mockRequest as HttpRequestDto,
        createReportDto,
      );

      expect(service.reportUser).toHaveBeenCalledWith(
        mockRequest.user.userId,
        createReportDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAllReports', () => {
    const mockReports = [
      {
        id: 1,
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        message: 'Report 1',
      },
      {
        id: 2,
        reason: ReportReason.SPAM,
        message: 'Report 2',
      },
    ] as Report[];

    const mockResponse: ReportsListResponseDto = {
      reports: mockReports,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('should return all reports with pagination', async () => {
      service.getAllReports.mockResolvedValue(mockResponse);

      const result = await controller.getAllReports(1, 10);

      expect(service.getAllReports).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should apply filters correctly', async () => {
      service.getAllReports.mockResolvedValue({
        ...mockResponse,
        page: 2,
        limit: 5,
      });

      await controller.getAllReports(
        2,
        5,
        1,
        'user123',
        'pending',
      );

      expect(service.getAllReports).toHaveBeenCalledWith({
        offset: 5, // (2-1)*5 = 5
        limit: 5,
        profileId: 1,
        reporterId: 'user123',
        status: 'pending',
      });
    });
  });

  describe('getReportById', () => {
    const mockReport = {
      id: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      message: 'Test report',
    } as Report;

    it('should return a report by ID', async () => {
      service.getReportById.mockResolvedValue(mockReport);

      const result = await controller.getReportById(1);

      expect(service.getReportById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });

    it('should handle not found exception', async () => {
      service.getReportById.mockRejectedValue(
        new NotFoundException('Report with ID 999 not found'),
      );

      await expect(controller.getReportById(999)).rejects.toThrow(
        new NotFoundException('Report with ID 999 not found'),
      );
    });
  });

  describe('deleteReport', () => {
    const mockResponse = { message: 'Report deleted successfully' };

    it('should delete a report by ID', async () => {
      service.deleteReport.mockResolvedValue(mockResponse);

      const result = await controller.deleteReport(1);

      expect(service.deleteReport).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found exception', async () => {
      service.deleteReport.mockRejectedValue(
        new NotFoundException('Report with ID 999 not found'),
      );

      await expect(controller.deleteReport(999)).rejects.toThrow(
        new NotFoundException('Report with ID 999 not found'),
      );
    });
  });
});
