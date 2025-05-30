import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../common/entities/profile.entity';
import { OrientationEnum } from './enums';

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
    interests: ['a', 'b'],
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

  describe('updateProfileInterests', () => {
    it('calls service.updateProfileInterests and returns result', async () => {
      jest
        .spyOn(service, 'updateProfileInterests')
        .mockResolvedValue(mockProfile);
      const body = { data: ['x', 'y'] };
      const result = await controller.updateProfileInterests('user1', body);
      expect(result).toBe(mockProfile);
      expect(service.updateProfileInterests).toHaveBeenCalledWith(
        'user1',
        body.data,
      );
    });

    it('throws if service throws', async () => {
      jest
        .spyOn(service, 'updateProfileInterests')
        .mockRejectedValue(new Error('interests fail'));
      await expect(
        controller.updateProfileInterests('user1', { data: [] }),
      ).rejects.toThrow('interests fail');
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
});
