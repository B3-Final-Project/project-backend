import { Test, TestingModule } from '@nestjs/testing';
import { PreferenceController } from './preference.controller';
import { PreferenceService } from './preference.service';
import { APP_GUARD } from '@nestjs/core';
import { Preference } from '../common/entities/preference.entity';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
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

  it('should return all preferences', async () => {
    const preferences: Preference[] = [{ id: 1, user_id: '1', max_age: 30 }];
    jest.spyOn(service, 'getAllPreferences').mockResolvedValue(preferences);

    const result = await controller.getAllPreferences();
    expect(result).toBe(preferences);
  });

  it('should return preferences for a user', async () => {
    const preferences: Preference[] = [
      { id: 1, user_id: 'user1', min_age: 20 },
    ];
    jest.spyOn(service, 'getPreferences').mockResolvedValue(preferences);

    const req = { user: { userId: 'user1' } } as HttpRequestDto;
    const result = await controller.getPreferences(req);
    expect(result).toBe(preferences);
  });

  it('should update preferences', async () => {
    const updatedPreference: Preference = {
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

  it('should throw error if update preferences fails', async () => {
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
