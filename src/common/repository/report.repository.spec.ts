import { Test, TestingModule } from '@nestjs/testing';

import { Report } from '../entities/report.entity';
import { ReportReason } from '../../modules/profile/dto/report.dto';
import { ReportRepository } from './report.repository';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ReportRepository', () => {
  let repository: ReportRepository;
  let mockRepository: jest.Mocked<Repository<Report>>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportRepository,
        {
          provide: getRepositoryToken(Report),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<ReportRepository>(ReportRepository);
    mockRepository = module.get(getRepositoryToken(Report));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a report', async () => {
      const reportDto = {
        reason: ReportReason.SPAM,
        message: 'Test spam report',
      };
      const reportedProfileId = 1;
      const reporterUserId = 'user123';

      const mockReport = {
        id: 1,
        reported_profile_id: reportedProfileId,
        reporterUserId,
        reason: reportDto.reason,
        message: reportDto.message,
      } as Report;

      mockRepository.create.mockReturnValue(mockReport);
      mockRepository.save.mockResolvedValue(mockReport);

      const result = await repository.create(
        reportedProfileId,
        reporterUserId,
        reportDto,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        reported_profile_id: reportedProfileId,
        reporterUserId,
        reason: reportDto.reason,
        message: reportDto.message,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockReport);
      expect(result).toEqual(mockReport);
    });
  });

  describe('findByProfileId', () => {
    it('should find reports by profile ID', async () => {
      const profileId = 1;
      const mockReports = [
        { id: 1, reported_profile_id: profileId },
        { id: 2, reported_profile_id: profileId },
      ] as Report[];

      mockRepository.find.mockResolvedValue(mockReports);

      const result = await repository.findByProfileId(profileId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { reported_profile_id: profileId },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockReports);
    });
  });

  describe('countByProfileId', () => {
    it('should count reports by profile ID', async () => {
      const profileId = 1;
      const expectedCount = 5;

      mockRepository.count.mockResolvedValue(expectedCount);

      const result = await repository.countByProfileId(profileId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { reported_profile_id: profileId },
      });
      expect(result).toBe(expectedCount);
    });
  });

  describe('findAll', () => {
    it('should find all reports with pagination', async () => {
      const offset = 0;
      const limit = 10;
      const mockReports = [
        { id: 1, reported_profile_id: 1 },
        { id: 2, reported_profile_id: 2 },
      ] as Report[];
      const totalCount = 2;

      mockRepository.findAndCount.mockResolvedValue([mockReports, totalCount]);

      const result = await repository.findAll(offset, limit);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['reportedProfile', 'reportedProfile.userProfile'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
      expect(result).toEqual({ reports: mockReports, total: totalCount });
    });
  });

  describe('deleteById', () => {
    it('should delete a report by ID', async () => {
      const reportId = 1;

      await repository.deleteById(reportId);

      expect(mockRepository.delete).toHaveBeenCalledWith(reportId);
    });
  });

  describe('findById', () => {
    it('should find a report by ID with relations', async () => {
      const reportId = 1;
      const mockReport = { id: reportId, reported_profile_id: 1 } as Report;

      mockRepository.findOne.mockResolvedValue(mockReport);

      const result = await repository.findById(reportId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: reportId },
        relations: ['reportedProfile', 'reportedProfile.userProfile'],
      });
      expect(result).toEqual(mockReport);
    });
  });
});
