import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { APP_GUARD } from '@nestjs/core';
import { Profile } from '../common/entities/profile.entity';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  DrinkingEnum,
  GenderEnum,
  OrientationEnum,
  PoliticsEnum,
  RelationshipTypeEnum,
  ReligionEnum,
  SmokingEnum,
  ZodiacEnum,
} from './enums';

describe('PreferenceController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockedUpdateDto: UpdateProfileDto = {
    lifestyleInfo: {
      smoking: SmokingEnum.NEVER,
      drinking: DrinkingEnum.NEVER,
      religion: ReligionEnum.ATHEIST,
      politics: PoliticsEnum.LIBERAL,
      zodiac: ZodiacEnum.ARIES,
    },
    locationWork: {
      city: '',
      work: '',
      languages: [],
    },
    personalInfo: {
      name: '',
      surname: '',
      gender: GenderEnum.MALE,
      orientation: OrientationEnum.STRAIGHT,
    },
    preferenceInfo: {
      min_age: 0,
      max_age: 0,
      max_distance: 0,
      relationship_type: RelationshipTypeEnum.CASUAL,
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
            getProfiles: jest.fn(),
            updateProfileInterests: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
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

  it('should return all profile', async () => {
    const profiles: Profile[] = [{ id: 1, user_id: '1', max_age: 30 }];
    jest.spyOn(service, 'getAllProfiles').mockResolvedValue(profiles);

    const result = await controller.getAllProfiles();
    expect(result).toBe(profiles);
  });

  it('should return profile for a user', async () => {
    const profiles: Profile = { id: 1, user_id: 'user1', min_age: 20 };
    jest.spyOn(service, 'getProfiles').mockResolvedValue(profiles);

    const req = { user: { userId: 'user1' } } as HttpRequestDto;
    const result = await controller.getProfiles(req);
    expect(result).toBe(profiles);
  });

  it('should update profile', async () => {
    const updatedPreference: Profile = {
      id: 1,
      user_id: '1',
      max_distance: 15.4,
    };
    jest.spyOn(service, 'updateProfile').mockResolvedValue(updatedPreference);

    const updateDto: UpdateProfileDto = {
      ...mockedUpdateDto,
      userId: '1',
      interests: ['interest1', 'interest2'],
    };

    const req: HttpRequestDto = {
      user: {
        userId: '1',
      },
    } as HttpRequestDto;

    const result = await controller.updateProfile(req, updateDto);
    expect(result).toBe(updatedPreference);
  });

  it('should throw error if update profile fails', async () => {
    jest
      .spyOn(service, 'updateProfile')
      .mockRejectedValue(new Error('Update failed'));

    const updateDto: UpdateProfileDto = {
      ...mockedUpdateDto,
      userId: '1',
      interests: ['interest1', 'interest2'],
    };

    const req: HttpRequestDto = {
      user: {
        userId: '1',
      },
    } as HttpRequestDto;

    await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
      'Update failed',
    );
  });
});
