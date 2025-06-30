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
            save: jest.fn(),
            findReportsBy: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get(ProfileRepository);
    userRepository = module.get(UserRepository);

    jest
      .spyOn(ProfileUtils, 'mapProfile')
      .mockImplementation((dto, profile) => ({ ...profile, ...dto }));
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
});
