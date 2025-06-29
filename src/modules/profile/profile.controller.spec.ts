import { Test, TestingModule } from '@nestjs/testing';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { OrientationEnum } from './enums';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './services/profile.service';
import { Report } from '../../common/entities/report.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfile: Profile = {
    id: 1,
    created_at: undefined,
    updated_at: undefined,
    userProfile: undefined,
  } as Profile;
  const mockUserRequest: HttpRequestDto = {
    user: { userId: 'user1' },
  } as HttpRequestDto;
  const updateDto: UpdateProfileDto = {
    personalInfo: {
      name: 'John',
      surname: 'Doe',
      gender: undefined,
      age: 30,
      orientation: OrientationEnum.GAY,
    },
    locationWork: { city: 'City', work: 'Work', languages: [] },
    preferenceInfo: {
      min_age: 18,
      max_age: 40,
      max_distance: 50,
      relationship_type: undefined,
    },
    lifestyleInfo: {
      smoking: undefined,
      drinking: undefined,
      religion: undefined,
      politics: undefined,
      zodiac: undefined,
    },
    interestInfo: {
      interests: [
        {
          prompt: 'What do you enjoy doing in your free time?',
          answer: 'Reading books',
        },
        { prompt: 'What is your favorite hobby?', answer: 'Cooking' },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            getAllProfiles: jest.fn(),
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            updateProfileInterests: jest.fn(),
            createProfile: jest.fn(),
            updateProfileField: jest.fn(),
            reportUser: jest.fn(),
            getAllReports: jest.fn(),
            getReportsForProfile: jest.fn(),
            deleteReport: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useValue: { canActivate: () => true },
        },
        {
          provide: AuthGuard('jwt'),
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('returns profile and user', async () => {
      const returnValue = { profile: mockProfile, user: { user_id: 'u1' } };
      jest.spyOn(service, 'getProfile').mockResolvedValue(returnValue as any);
      const result = await controller.getProfile(mockUserRequest);
      expect(result).toBe(returnValue);
      expect(service.getProfile).toHaveBeenCalledWith(mockUserRequest);
    });
  });

  describe('updateProfile', () => {
    it('calls service.updateProfile and returns result', async () => {
      jest.spyOn(service, 'updateProfile').mockResolvedValue(mockProfile);
      const result = await controller.updateProfile(mockUserRequest, updateDto);
      expect(result).toBe(mockProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(
        updateDto,
        mockUserRequest,
      );
    });

    it('throws if service throws', async () => {
      jest.spyOn(service, 'updateProfile').mockRejectedValue(new Error('fail'));
      await expect(
        controller.updateProfile(mockUserRequest, updateDto),
      ).rejects.toThrow('fail');
    });
  });

  describe('updateProfileField with interests', () => {
    it('calls service.updateProfileField and returns result for interest updates', async () => {
      jest.spyOn(service, 'updateProfileField').mockResolvedValue(mockProfile);
      const req = { user: { userId: 'user1' } } as HttpRequestDto;
      const body = {
        interestInfo: {
          interests: [
            { prompt: 'Hiking', answer: 'I love hiking' },
            { prompt: 'Cooking', answer: 'I enjoy cooking' },
          ],
        },
      };
      const result = await controller.updateProfileField(body, req);
      expect(result).toBe(mockProfile);
      expect(service.updateProfileField).toHaveBeenCalledWith(body, req);
    });

    it('throws if service throws for interest updates', async () => {
      jest
        .spyOn(service, 'updateProfileField')
        .mockRejectedValue(new Error('interests fail'));
      const req = { user: { userId: 'user1' } } as HttpRequestDto;
      const body = {
        interestInfo: {
          interests: [],
        },
      } as Partial<UpdateProfileDto>;
      await expect(controller.updateProfileField(body, req)).rejects.toThrow(
        'interests fail',
      );
    });
  });

  describe('createProfile', () => {
    it('calls service.createProfile and returns result', async () => {
      jest.spyOn(service, 'createProfile').mockResolvedValue(mockProfile);
      const result = await controller.createProfile(mockUserRequest, updateDto);
      expect(result).toBe(mockProfile);
      expect(service.createProfile).toHaveBeenCalledWith(
        updateDto,
        mockUserRequest,
      );
    });

    it('throws if service throws', async () => {
      jest
        .spyOn(service, 'createProfile')
        .mockRejectedValue(new Error('create fail'));
      await expect(
        controller.createProfile(mockUserRequest, updateDto),
      ).rejects.toThrow('create fail');
    });
  });

  describe('updateProfileField', () => {
    it('calls service.updateProfileField with body and request', async () => {
      const partial = {
        personalInfo: { name: 'A' },
      } as Partial<UpdateProfileDto>;
      jest.spyOn(service, 'updateProfileField').mockResolvedValue(mockProfile);
      const result = await controller.updateProfileField(
        partial,
        mockUserRequest,
      );
      expect(result).toBe(mockProfile);
      expect(service.updateProfileField).toHaveBeenCalledWith(
        partial,
        mockUserRequest,
      );
    });

    it('throws if service throws', async () => {
      jest
        .spyOn(service, 'updateProfileField')
        .mockRejectedValue(new Error('patch fail'));
      await expect(
        controller.updateProfileField({}, mockUserRequest),
      ).rejects.toThrow('patch fail');
    });
  });

  describe('reportUserByUser', () => {
    it('calls service.reportUser and returns result', async () => {
      const reportDto = { reason: 1, message: 'spam content' };
      const profileId = 123;
      const expectedResult = {
        message: 'User reported successfully',
        reportCount: 1,
      };
      jest.spyOn(service, 'reportUser').mockResolvedValue(expectedResult);

      const result = await controller.reportUserByUser(
        profileId,
        mockUserRequest,
        reportDto,
      );

      expect(result).toBe(expectedResult);
      expect(service.reportUser).toHaveBeenCalledWith(
        profileId,
        mockUserRequest.user.userId,
        reportDto,
      );
    });

    it('throws if service throws', async () => {
      const reportDto = { reason: 1, message: 'spam content' };
      const profileId = 123;
      jest
        .spyOn(service, 'reportUser')
        .mockRejectedValue(new Error('report fail'));

      await expect(
        controller.reportUserByUser(profileId, mockUserRequest, reportDto),
      ).rejects.toThrow('report fail');
    });
  });

  describe('getAllReports', () => {
    it('calls service.getAllReports and returns result', async () => {
      const mockReport1 = {
        id: 1,
        reason: 1,
        message: 'spam content',
        reporterUserId: 'user1',
        reported_profile_id: 123,
        reportedProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as Report;

      const mockReport2 = {
        id: 2,
        reason: 2,
        message: 'inappropriate content',
        reporterUserId: 'user2',
        reported_profile_id: 124,
        reportedProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as Report;

      const expectedReports = {
        reports: [mockReport1, mockReport2],
        total: 2,
      };
      jest.spyOn(service, 'getAllReports').mockResolvedValue(expectedReports);

      const result = await controller.getAllReports(0, 10);

      expect(result).toBe(expectedReports);
      expect(service.getAllReports).toHaveBeenCalledWith(0, 10);
    });

    it('throws if service throws', async () => {
      jest
        .spyOn(service, 'getAllReports')
        .mockRejectedValue(new Error('get reports fail'));

      await expect(controller.getAllReports(0, 10)).rejects.toThrow(
        'get reports fail',
      );
    });
  });

  describe('getReportsForProfile', () => {
    it('calls service.getReportsForProfile and returns result', async () => {
      const profileId = 123;
      const mockReport1 = {
        id: 1,
        reason: 1,
        message: 'spam content',
        reporterUserId: 'user1',
        reported_profile_id: profileId,
        reportedProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as Report;

      const mockReport2 = {
        id: 3,
        reason: 3,
        message: 'fake profile',
        reporterUserId: 'user3',
        reported_profile_id: profileId,
        reportedProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as Report;

      const expectedReports = [mockReport1, mockReport2];
      jest
        .spyOn(service, 'getReportsForProfile')
        .mockResolvedValue(expectedReports);

      const result = await controller.getReportsForProfile(profileId);

      expect(result).toBe(expectedReports);
      expect(service.getReportsForProfile).toHaveBeenCalledWith(profileId);
    });

    it('throws if service throws', async () => {
      const profileId = 123;
      jest
        .spyOn(service, 'getReportsForProfile')
        .mockRejectedValue(new Error('get profile reports fail'));

      await expect(controller.getReportsForProfile(profileId)).rejects.toThrow(
        'get profile reports fail',
      );
    });
  });

  describe('deleteReport', () => {
    it('calls service.deleteReport', async () => {
      const reportId = 1;
      jest.spyOn(service, 'deleteReport').mockResolvedValue(undefined);

      await controller.deleteReport(reportId);

      expect(service.deleteReport).toHaveBeenCalledWith(reportId);
    });

    it('throws if service throws', async () => {
      const reportId = 1;
      jest
        .spyOn(service, 'deleteReport')
        .mockRejectedValue(new Error('delete report fail'));

      await expect(controller.deleteReport(reportId)).rejects.toThrow(
        'delete report fail',
      );
    });
  });
});
