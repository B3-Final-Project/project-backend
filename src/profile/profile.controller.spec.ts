import { Test, TestingModule } from '@nestjs/testing';
import { PreferenceController } from './profile.controller';
import { PreferenceService } from './profile.service';
import { APP_GUARD } from '@nestjs/core';
import { Profile } from '../common/entities/profile.entity';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdatePreferenceDto } from './dto/update-profile.dto';
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
  let controller: PreferenceController;
  let service: PreferenceService;

  const mockedUpdateDto: UpdatePreferenceDto = {
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
      controllers: [PreferenceController],
      providers: [
        {
          provide: PreferenceService,
          useValue: {
            getAllPreferences: jest.fn(),
            getPreferences: jest.fn(),
            updatePreferenceInterests: jest.fn(),
            updatePreference: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    controller = module.get<PreferenceController>(PreferenceController);
    service = module.get<PreferenceService>(PreferenceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all profile', async () => {
    const profiles: Profile[] = [{ id: 1, user_id: '1', max_age: 30 }];
    jest.spyOn(service, 'getAllPreferences').mockResolvedValue(profiles);

    const result = await controller.getAllPreferences();
    expect(result).toBe(profiles);
  });

  it('should return profile for a user', async () => {
    const profiles: Profile[] = [{ id: 1, user_id: 'user1', min_age: 20 }];
    jest.spyOn(service, 'getPreferences').mockResolvedValue(profiles);

    const req = { user: { userId: 'user1' } } as HttpRequestDto;
    const result = await controller.getPreferences(req);
    expect(result).toBe(profiles);
  });

  it('should update profile', async () => {
    const updatedPreference: Profile = {
      id: 1,
      user_id: '1',
      max_distance: 15.4,
    };
    jest
      .spyOn(service, 'updatePreference')
      .mockResolvedValue(updatedPreference);

    const updateDto: UpdatePreferenceDto = {
      ...mockedUpdateDto,
      userId: '1',
      interests: ['interest1', 'interest2'],
    };
    const result = await controller.updatePreference('1', updateDto);
    expect(result).toBe(updatedPreference);
  });

  it('should throw error if update profile fails', async () => {
    jest
      .spyOn(service, 'updatePreference')
      .mockRejectedValue(new Error('Update failed'));

    const updateDto: UpdatePreferenceDto = {
      ...mockedUpdateDto,
      userId: '1',
      interests: ['interest1', 'interest2'],
    };
    await expect(controller.updatePreference('1', updateDto)).rejects.toThrow(
      'Update failed',
    );
  });
});
