import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { ProfileService } from './profile.service';
import { ProfileUtils } from './profile-utils.service';
import { Profile } from '../common/entities/profile.entity';
import { User } from '../common/entities/user.entity';
import { Interest } from '../common/entities/interest.entity';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import {
  UpdateProfileDto,
  PartialUpdateProfileDto,
} from './dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let interestRepository: jest.Mocked<Repository<Interest>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Interest),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get(getRepositoryToken(Profile));
    userRepository = module.get(getRepositoryToken(User));
    interestRepository = module.get(getRepositoryToken(Interest));

    // Mock ProfileUtils.mapProfile
    jest.spyOn(ProfileUtils, 'mapProfile').mockImplementation(
      (dto, profile) =>
        ({
          ...profile,
          ...dto,
        }) as any,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProfileOrThrowByUserId', () => {
    it('throws NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(undefined);
      await expect(service['findProfileOrThrowByUserId']('u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when profile missing', async () => {
      userRepository.findOne.mockResolvedValue({
        user_id: 'u1',
        profile: undefined,
      } as any);
      await expect(service['findProfileOrThrowByUserId']('u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns profile without relations when none requested', async () => {
      const prof = { id: 1 } as Profile;
      userRepository.findOne.mockResolvedValue({
        user_id: 'u1',
        profile: prof,
      } as any);
      const result = await service['findProfileOrThrowByUserId']('u1');
      expect(result).toBe(prof);
    });

    it('returns profile with relations when requested', async () => {
      const userObj = { user_id: 'u1', profile: { id: 2 } } as any;
      const profRel = { id: 2, interests: [] } as Profile;
      userRepository.findOne.mockResolvedValue(userObj);
      profileRepository.findOne.mockResolvedValue(profRel);

      const result = await service['findProfileOrThrowByUserId']('u1', [
        'interests',
      ]);
      expect(profileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
        relations: ['interests'],
      });
      expect(result).toBe(profRel);
    });

    it('throws if profile disappears', async () => {
      const userObj = { user_id: 'u1', profile: { id: 3 } } as any;
      userRepository.findOne.mockResolvedValue(userObj);
      profileRepository.findOne.mockResolvedValue(undefined);
      await expect(
        service['findProfileOrThrowByUserId']('u1', ['interests']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('maps then saves updated profile', async () => {
      const dto = {
        personalInfo: {},
        locationWork: {},
        preferenceInfo: {},
        lifestyleInfo: {},
      } as UpdateProfileDto;
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const prof = { id: 1, interests: [] } as Profile;
      const saved = { ...prof, updated: true } as Profile;

      jest
        .spyOn(service as any, 'findProfileOrThrowByUserId')
        .mockResolvedValue(prof);
      profileRepository.save.mockResolvedValue(saved);

      const result = await service.updateProfile(dto, req);
      expect(ProfileUtils.mapProfile).toHaveBeenCalledWith(dto, prof);
      expect(profileRepository.save).toHaveBeenCalledWith({ ...prof, ...dto });
      expect(result).toBe(saved);
    });
  });

  describe('updateProfileInterests', () => {
    it('replaces interests correctly', async () => {
      const userId = 'u1';
      const descs = ['a', 'b', 'c'];
      const prof = { interests: [] } as Profile;
      jest
        .spyOn(service as any, 'findProfileOrThrowByUserId')
        .mockResolvedValue(prof);

      const existing = [{ description: 'a' } as Interest];
      interestRepository.find.mockResolvedValue(existing);
      interestRepository.create.mockImplementation((d) => d as Interest);
      const created = [
        { description: 'b' },
        { description: 'c' },
      ] as Interest[];
      interestRepository.save.mockResolvedValue(created as any);
      profileRepository.save.mockResolvedValue({
        ...prof,
        interests: [...existing, ...created],
      } as Profile);

      const result = await service.updateProfileInterests(userId, descs);
      expect(interestRepository.find).toHaveBeenCalledWith({
        where: { description: In(descs) },
      });
      expect(interestRepository.create).toHaveBeenCalledTimes(2);
      expect(interestRepository.save).toHaveBeenCalledWith(created);
      expect(profileRepository.save).toHaveBeenCalledWith({
        ...prof,
        interests: [...existing, ...created],
      });
      expect(result.interests).toEqual([...existing, ...created]);
    });
  });

  describe('getProfile', () => {
    it('retrieves and returns profile and user', async () => {
      const req = { user: { userId: 'u1' } } as HttpRequestDto;
      const prof = { id: 1, interests: [], userProfile: {} } as any;
      const usr = {} as User;

      jest
        .spyOn(service as any, 'findProfileOrThrowByUserId')
        .mockResolvedValue(prof);
      userRepository.findOne.mockResolvedValue(usr);

      const result = await service.getProfile(req);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 'u1' },
      });
      expect(result).toEqual({
        profile: { ...prof, userProfile: undefined },
        user: usr,
      });
    });
  });

  describe('getAllProfiles', () => {
    it('returns all profiles with relations', async () => {
      const arr = [{} as Profile];
      profileRepository.find.mockResolvedValue(arr);
      const result = await service.getAllProfiles();
      expect(profileRepository.find).toHaveBeenCalledWith({
        relations: ['interests', 'userProfile'],
      });
      expect(result).toBe(arr);
    });
  });

  describe('createProfile', () => {
    const dto = {
      personalInfo: { name: 'N', surname: 'S', gender: 'g', age: 20 },
      locationWork: {},
      preferenceInfo: {},
      lifestyleInfo: {},
    } as unknown as UpdateProfileDto;
    const req = { user: { userId: 'u1' } } as HttpRequestDto;

    it('creates profile and new user if missing', async () => {
      const savedProf = { id: 5 } as Profile;
      profileRepository.save.mockResolvedValue(savedProf);
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue({} as User);
      userRepository.save.mockResolvedValue({} as User);

      const result = await service.createProfile(dto, req);
      expect(profileRepository.save).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalledWith({
        user_id: 'u1',
        name: dto.personalInfo.name,
        surname: dto.personalInfo.surname,
        gender: dto.personalInfo.gender,
        age: dto.personalInfo.age,
        profile: savedProf,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toBe(savedProf);
    });

    it('updates existing user and attaches profile', async () => {
      const savedProf = { id: 6 } as Profile;
      profileRepository.save.mockResolvedValue(savedProf);
      const existingUser = { user_id: 'u1', profile: {} } as any;
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(existingUser);

      const result = await service.createProfile(dto, req);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          name: dto.personalInfo.name,
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
  });
});
