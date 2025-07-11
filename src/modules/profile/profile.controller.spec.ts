import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuard } from '@nestjs/passport';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasService } from '../../common/services/hateoas.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { OrientationEnum } from './enums';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './services/profile.service';
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
        HateoasInterceptor,
        {
          provide: HateoasService,
          useValue: {
            wrapCollection: jest.fn(),
            wrapCollectionWithItemLinks: jest.fn(),
            wrapResource: jest.fn(),
            registerLinkBuilders: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
            getAllAndMerge: jest.fn(),
          },
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
});
