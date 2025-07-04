import { Test, TestingModule } from '@nestjs/testing';

import { CreateReportDto } from './dto/create-report.dto';
import { NotFoundException } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { Report } from '../../common/entities/report.entity';
import { ReportReason } from '../profile/dto/report.dto';
import { ReportRepository } from '../../common/repository/report.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: jest.Mocked<ReportRepository>;
  let profileRepository: jest.Mocked<ProfileRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportRepository,
          useValue: {
            create: jest.fn(),
            findByProfileId: jest.fn(),
            countByProfileId: jest.fn(),
            findAllWithFilters: jest.fn(),
            findById: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: ProfileRepository,
          useValue: {
            findByProfileId: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get(ReportRepository);
    profileRepository = module.get(ProfileRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reportUser', () => {
    const reporterUserId = 'user123';
    const createReportDto: CreateReportDto = {
      reportedProfileId: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      details: 'Inappropriate behavior',
    };
    const mockReport = {
      id: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      message: 'Inappropriate behavior',
      reporterUserId: 'user123',
      reported_profile_id: 1,
    } as Report;
    const mockProfile = {
      id: 1,
      reportCount: 0,
    } as Profile;

    it('should successfully report a user', async () => {
      profileRepository.findByProfileId.mockResolvedValue(mockProfile);
      reportRepository.create.mockResolvedValue(mockReport);
      reportRepository.countByProfileId.mockResolvedValue(1);
      profileRepository.save.mockResolvedValue({
        ...mockProfile,
        reportCount: 1,
      });

      const result = await service.reportUser(reporterUserId, createReportDto);

      expect(profileRepository.findByProfileId).toHaveBeenCalledWith(
        createReportDto.reportedProfileId,
      );
      expect(reportRepository.create).toHaveBeenCalledWith(
        createReportDto.reportedProfileId,
        reporterUserId,
        {
          reason: createReportDto.reason,
          message: createReportDto.details || '',
        },
      );
      expect(reportRepository.countByProfileId).toHaveBeenCalledWith(
        createReportDto.reportedProfileId,
      );
      expect(profileRepository.save).toHaveBeenCalledWith({
        ...mockProfile,
        reportCount: 1,
      });
      expect(result).toEqual({
        message: createReportDto.details,
        reportCount: 1,
      });
    });

    it('should throw NotFoundException if reported user profile not found', async () => {
      profileRepository.findByProfileId.mockResolvedValue(null);

      await expect(
        service.reportUser(reporterUserId, createReportDto),
      ).rejects.toThrow(
        new NotFoundException(
          `User with Profile ID ${createReportDto.reportedProfileId} not found`,
        ),
      );
    });
  });

  describe('getAllReports', () => {
    const mockReports = [
      {
        id: 1,
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        message: 'Test report 1',
      },
      {
        id: 2,
        reason: ReportReason.SPAM,
        message: 'Test report 2',
      },
    ] as Report[];

    it('should return all reports with pagination', async () => {
      const filters = {
        offset: 0,
        limit: 10,
      };

      reportRepository.findAllWithFilters.mockResolvedValue({
        reports: mockReports,
        total: 2,
      });

      const result = await service.getAllReports(filters);

      expect(reportRepository.findAllWithFilters).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        reports: mockReports,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        offset: 10,
        limit: 5,
        profileId: 1,
        reporterId: 'user123',
        status: 'pending',
      };

      reportRepository.findAllWithFilters.mockResolvedValue({
        reports: mockReports,
        total: 25,
      });

      const result = await service.getAllReports(filters);

      expect(reportRepository.findAllWithFilters).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        reports: mockReports,
        total: 25,
        page: 3, // (10/5)+1 = 3
        limit: 5,
        totalPages: 5, // Math.ceil(25/5) = 5
      });
    });
  });

  describe('getReportById', () => {
    const mockReport = {
      id: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      message: 'Test report',
    } as Report;

    it('should return a report by its ID', async () => {
      reportRepository.findById.mockResolvedValue(mockReport);

      const result = await service.getReportById(1);

      expect(reportRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findById.mockResolvedValue(null);

      await expect(service.getReportById(999)).rejects.toThrow(
        new NotFoundException('Report with ID 999 not found'),
      );
    });
  });

  describe('deleteReport', () => {
    const mockReport = {
      id: 1,
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      message: 'Test report',
    } as Report;

    it('should delete a report by its ID', async () => {
      reportRepository.findById.mockResolvedValue(mockReport);

      const result = await service.deleteReport(1);

      expect(reportRepository.findById).toHaveBeenCalledWith(1);
      expect(reportRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Report deleted successfully' });
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findById.mockResolvedValue(null);

      await expect(service.deleteReport(999)).rejects.toThrow(
        new NotFoundException('Report with ID 999 not found'),
      );
    });
  });
});
