import {
  PartialUpdateProfileDto,
  UpdateProfileDto,
} from '../dto/update-profile.dto';
import { Test, TestingModule } from '@nestjs/testing';

import { BadRequestException } from '@nestjs/common';
import { HttpRequestDto } from '../../../common/dto/http-request.dto';
import { InterestRepository } from '../../../common/repository/interest.repository';
import { Profile } from '../../../common/entities/profile.entity';
import { ProfileRepository } from '../../../common/repository/profile.repository';
import { ProfileService } from './profile.service';
import { ProfileUtils } from './profile-utils.service';
import { ReportRepository } from '../../../common/repository/report.repository';
import { S3Service } from './s3.service';
import { User } from '../../../common/entities/user.entity';
import { UserRepository } from '../../../common/repository/user.repository';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: jest.Mocked<ProfileRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let interestRepository: jest.Mocked<InterestRepository>;
  let reportRepository: jest.Mocked<any>;
  let s3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileRepository,
          useValue: {
            save: jest.fn(),
            findByProfileId: jest.fn(),
            findByUserId: jest.fn(),
            saveImageUrl: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findProfileOrThrowByUserId: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: InterestRepository,
          useValue: {
            saveNewInterests: jest.fn(),
          },
        },
        {
          provide: ReportRepository,
          useValue: {
            create: jest.fn(),
            findByProfileId: jest.fn(),
            countByProfileId: jest.fn(),
            findAll: jest.fn(),
            deleteById: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            extractKeyFromUrl: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get(ProfileRepository);
    userRepository = module.get(UserRepository);
    interestRepository = module.get(InterestRepository);
    reportRepository = module.get(ReportRepository);
    s3Service = module.get(S3Service);

    jest
      .spyOn(ProfileUtils, 'mapProfile')
      .mockImplementation(
        (dto, profile) => ({ ...(profile as any), ...(dto as any) }) as any,
      );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('maps then saves updated profile', async () => {
      const dto = {
        personalInfo: {},
        locationWork: {},
        preferenceInfo: {},
        lifestyleInfo: {},
        interestInfo: {},
      } as UpdateProfileDto;
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const prof = { id: 1, interests: [] } as Profile;
      const saved = { ...prof, updated: true } as Profile;

      userRepository.findProfileOrThrowByUserId.mockResolvedValue(prof);
      profileRepository.save.mockResolvedValue(saved);

      const result = await service.updateProfile(dto, req);

      expect(userRepository.findProfileOrThrowByUserId).toHaveBeenCalledWith(
        'u1',
        ['interests'],
      );
      expect(ProfileUtils.mapProfile).toHaveBeenCalledWith(dto, prof);
      expect(profileRepository.save).toHaveBeenCalledWith({ ...prof, ...dto });
      expect(result).toBe(saved);
    });
  });

  describe('updateProfileInterests', () => {
    it('replaces interests correctly', async () => {
      // TODO when interests are implemented
      return;
    });
  });

  describe('getProfile', () => {
    it('retrieves and returns profile and user', async () => {
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const prof = { id: 1, interests: [], userProfile: {} } as any;
      const usr = {} as User;

      userRepository.findProfileOrThrowByUserId.mockResolvedValue(prof);
      userRepository.findById.mockResolvedValue(usr);

      const result = await service.getProfile(req);

      expect(userRepository.findProfileOrThrowByUserId).toHaveBeenCalledWith(
        'u1',
        ['interests'],
      );
      expect(userRepository.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        profile: { ...prof, userProfile: undefined },
        user: usr,
      });
    });
  });

  describe('createProfile', () => {
    const dto = {
      personalInfo: { name: 'N', surname: 'S', gender: 'g', age: 20 },
      locationWork: {},
      preferenceInfo: {},
      lifestyleInfo: {},
      interestInfo: {},
    } as unknown as UpdateProfileDto;
    const req = { user: { userId: 'u1' } } as HttpRequestDto;

    it('creates profile and new user if missing', async () => {
      const savedProf = { id: 5 } as Profile;
      profileRepository.save.mockResolvedValue(savedProf);
      userRepository.findById.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue({} as User);
      userRepository.save.mockResolvedValue({} as User);

      const result = await service.createProfile(dto, req);

      expect(profileRepository.save).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalledWith({
        user_id: 'u1',
        name: 'N',
        surname: 'S',
        gender: 'g',
        age: 20,
        profile: savedProf,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toBe(savedProf);
    });

    it('updates existing user and attaches profile', async () => {
      const savedProf = { id: 6 } as Profile;
      profileRepository.save.mockResolvedValue(savedProf);
      const existingUser = { user_id: 'u1', profile: {} } as any;
      userRepository.findById.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(existingUser);

      const result = await service.createProfile(dto, req);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          name: 'N',
        }),
      );
      expect(result).toBe(savedProf);
    });
  });

  describe('updateProfileField', () => {
    const req = { user: { userId: 'u1' } } as HttpRequestDto;

    it('throws if body empty', async () => {
      await expect(service.updateProfileField({} as any, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if no valid section', async () => {
      await expect(
        service.updateProfileField({ foo: 'bar' } as any, req),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if multiple sections', async () => {
      await expect(
        service.updateProfileField(
          { personalInfo: {}, locationWork: {} } as any,
          req,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('delegates to updatePartialProfile on single section', async () => {
      const spy = jest
        .spyOn(service as any, 'updatePartialProfile')
        .mockResolvedValue({} as Profile);
      const body: PartialUpdateProfileDto = {
        personalInfo: { name: 'A' },
      } as any;
      await service.updateProfileField(body, req);
      expect(spy).toHaveBeenCalledWith('personalInfo', body.personalInfo, req);
    });

    it('handles interestInfo section correctly', async () => {
      const spy = jest
        .spyOn(service as any, 'updatePartialProfile')
        .mockResolvedValue({} as Profile);
      const body: PartialUpdateProfileDto = {
        interestInfo: {
          interests: [{ prompt: 'test', answer: 'test answer' }],
        },
      } as any;
      await service.updateProfileField(body, req);
      expect(spy).toHaveBeenCalledWith('interestInfo', body.interestInfo, req);
    });
  });

  describe('uploadImage', () => {
    it('throws if index is out of bounds', async () => {
      const file = {
        location: 'https://example.com/image.jpg',
      } as Express.MulterS3.File;
      const req = { user: { userId: 'u1' } } as HttpRequestDto;

      await expect(service.uploadImage(file, req, -1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(file, req, 6)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes old image from S3 if it exists', async () => {
      const file = {
        location: 'https://example.com/new-image.jpg',
      } as Express.MulterS3.File;
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const profile = { images: ['https://example.com/old-image.jpg'] } as any;

      jest
        .spyOn(service['profileRepository'], 'findByUserId')
        .mockResolvedValue(profile);
      jest
        .spyOn(service['s3Service'], 'extractKeyFromUrl')
        .mockReturnValue('old-image.jpg');
      jest
        .spyOn(service['s3Service'], 'deleteObject')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service['profileRepository'], 'saveImageUrl')
        .mockResolvedValue({ images: [file.location] });

      const result = await service.uploadImage(file, req, 0);

      expect(service['s3Service'].deleteObject).toHaveBeenCalledWith(
        'old-image.jpg',
      );
      expect(result).toEqual({ images: [file.location] });
    });

    it('saves new image URL if no old image exists', async () => {
      const file = {
        location: 'https://example.com/new-image.jpg',
      } as Express.MulterS3.File;
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const profile = { images: [] } as any;

      jest
        .spyOn(service['profileRepository'], 'findByUserId')
        .mockResolvedValue(profile);
      jest
        .spyOn(service['profileRepository'], 'saveImageUrl')
        .mockResolvedValue({ images: [file.location] });

      const result = await service.uploadImage(file, req, 0);

      expect(service['profileRepository'].saveImageUrl).toHaveBeenCalledWith(
        profile,
        file.location,
        0,
      );
      expect(result).toEqual({ images: [file.location] });
    });
  });

  describe('removeImage', () => {
    it('throws if no image exists at the given index', async () => {
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const profile = { images: [] } as any;

      jest
        .spyOn(service['profileRepository'], 'findByUserId')
        .mockResolvedValue(profile);

      await expect(service.removeImage(req, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes the image from S3 and removes it from the profile', async () => {
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const profile = { images: ['https://example.com/old-image.jpg'] } as any;

      jest
        .spyOn(service['profileRepository'], 'findByUserId')
        .mockResolvedValue(profile);
      jest
        .spyOn(service['s3Service'], 'extractKeyFromUrl')
        .mockReturnValue('old-image.jpg');
      jest
        .spyOn(service['s3Service'], 'deleteObject')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service['profileRepository'], 'save')
        .mockResolvedValue({ images: [] } as Profile);

      const result = await service.removeImage(req, 0);

      expect(service['s3Service'].deleteObject).toHaveBeenCalledWith(
        'old-image.jpg',
      );
      expect(service['profileRepository'].save).toHaveBeenCalledWith(profile);
      expect(result).toEqual({ images: [] });
    });
  });

  describe('reportUser', () => {
    it('should create a report and update profile report count', async () => {
      const reportedProfileId = 1;
      const reporterUserId = 'user123';
      const reportDto = { reason: 0, message: 'Spam content' };

      const mockProfile = {
        id: reportedProfileId,
        reportCount: 0,
        userProfile: { user_id: 'reported123' },
      } as any;

      const mockReport = {
        id: 1,
        reported_profile_id: reportedProfileId,
        reporterUserId,
        reason: reportDto.reason,
        message: reportDto.message,
      } as any;

      profileRepository.findByProfileId.mockResolvedValue(mockProfile);
      reportRepository.create.mockResolvedValue(mockReport);
      reportRepository.countByProfileId.mockResolvedValue(1);
      profileRepository.save.mockResolvedValue({
        ...mockProfile,
        reportCount: 1,
      });

      const result = await service.reportUser(
        reportedProfileId,
        reporterUserId,
        reportDto,
      );

      expect(profileRepository.findByProfileId).toHaveBeenCalledWith(
        reportedProfileId,
      );
      expect(reportRepository.create).toHaveBeenCalledWith(
        reportedProfileId,
        reporterUserId,
        reportDto,
      );
      expect(reportRepository.countByProfileId).toHaveBeenCalledWith(
        reportedProfileId,
      );
      expect(profileRepository.save).toHaveBeenCalledWith({
        ...mockProfile,
        reportCount: 1,
      });
      expect(result).toEqual({
        message: 'User reported successfully',
        reportCount: 1,
      });
    });

    it('should auto-ban user when report count reaches 5', async () => {
      const reportedProfileId = 1;
      const reporterUserId = 'user123';
      const reportDto = { reason: 0, message: 'Inappropriate content' };

      const mockProfile = {
        id: reportedProfileId,
        reportCount: 4,
        userProfile: { user_id: 'reported123' },
      } as any;

      profileRepository.findByProfileId.mockResolvedValue(mockProfile);
      reportRepository.create.mockResolvedValue({} as any);
      reportRepository.countByProfileId.mockResolvedValue(5);
      profileRepository.save.mockResolvedValue({
        ...mockProfile,
        reportCount: 5,
      });

      // Mock the banUser method
      jest.spyOn(service, 'banUser').mockResolvedValue({
        success: true,
        message: 'User banned successfully',
      });

      const result = await service.reportUser(
        reportedProfileId,
        reporterUserId,
        reportDto,
      );

      expect(service.banUser).toHaveBeenCalledWith('reported123');
      expect(result).toEqual({
        message:
          'User reported successfully. User has been automatically banned due to 5 reports.',
        reportCount: 5,
      });
    });

    it('should throw NotFoundException for non-existent profile', async () => {
      const reportedProfileId = 999;
      const reporterUserId = 'user123';
      const reportDto = { reason: 0, message: 'Spam content' };

      profileRepository.findByProfileId.mockResolvedValue(null);

      await expect(
        service.reportUser(reportedProfileId, reporterUserId, reportDto),
      ).rejects.toThrow('User with Profile ID 999 not found');
    });
  });

  describe('getReportsForProfile', () => {
    it('should return reports for a profile', async () => {
      const profileId = 1;
      const mockReports = [
        { id: 1, reported_profile_id: profileId, reason: 0, message: 'Spam' },
        { id: 2, reported_profile_id: profileId, reason: 1, message: 'Fake' },
      ] as any[];

      reportRepository.findByProfileId.mockResolvedValue(mockReports);

      const result = await service.getReportsForProfile(profileId);

      expect(reportRepository.findByProfileId).toHaveBeenCalledWith(profileId);
      expect(result).toEqual(mockReports);
    });
  });

  describe('getAllReports', () => {
    it('should return all reports with pagination', async () => {
      const offset = 0;
      const limit = 10;
      const mockResponse = {
        reports: [
          { id: 1, reported_profile_id: 1 },
          { id: 2, reported_profile_id: 2 },
        ],
        total: 2,
      } as any;

      reportRepository.findAll.mockResolvedValue(mockResponse);

      const result = await service.getAllReports(offset, limit);

      expect(reportRepository.findAll).toHaveBeenCalledWith(offset, limit);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report and update profile report count', async () => {
      const reportId = 1;
      const profileId = 2;
      const mockReport = {
        id: reportId,
        reported_profile_id: profileId,
      } as any;
      const mockProfile = { id: profileId, reportCount: 3 } as any;

      reportRepository.findById.mockResolvedValue(mockReport);
      reportRepository.deleteById.mockResolvedValue(undefined);
      reportRepository.countByProfileId.mockResolvedValue(2);
      profileRepository.findByProfileId.mockResolvedValue(mockProfile);
      profileRepository.save.mockResolvedValue({
        ...mockProfile,
        reportCount: 2,
      });

      const result = await service.deleteReport(reportId);

      expect(reportRepository.findById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.deleteById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.countByProfileId).toHaveBeenCalledWith(profileId);
      expect(profileRepository.save).toHaveBeenCalledWith({
        ...mockProfile,
        reportCount: 2,
      });
      expect(result).toEqual({
        success: true,
        message: 'Report deleted successfully',
        newReportCount: 2,
      });
    });

    it('should throw NotFoundException for non-existent report', async () => {
      const reportId = 999;

      reportRepository.findById.mockResolvedValue(null);

      await expect(service.deleteReport(reportId)).rejects.toThrow(
        'Report with ID 999 not found',
      );
    });
  });
});
