import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { PreferenceService } from './preference.service';
import {
  HttpRequestDto,
  UserCredentialsDto,
} from '../common/dto/http-request.dto';
import { Preference } from '../common/entities/preference.entity';
import { Interest } from '../common/entities/interest.entity';

describe('PreferenceService', () => {
  let service: PreferenceService;
  let preferenceRepository: Repository<Preference>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferenceService,
        {
          provide: getRepositoryToken(Preference),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Interest),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PreferenceService>(PreferenceService);
    preferenceRepository = module.get<Repository<Preference>>(
      getRepositoryToken(Preference),
    );
    interestRepository = module.get<Repository<Interest>>(
      getRepositoryToken(Interest),
    );
  });

  it('should throw error if preference not found', async () => {
    jest.spyOn(preferenceRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.updatePreferenceInterests('1', ['interest1', 'interest2']),
    ).rejects.toThrow('Preference for user 1 not found');
  });

  it('should get preferences by user id', async () => {
    const preferences = [new Preference()];
    jest.spyOn(preferenceRepository, 'find').mockResolvedValue(preferences);

    const user: UserCredentialsDto = {
      userId: 'user1',
      username: 'user1',
      roles: [],
    };

    const req = { user } as HttpRequestDto;

    const result = await service.getPreferences(req);
    expect(result).toBe(preferences);
  });

  it('should get all preferences', async () => {
    const preferences = [new Preference()];
    jest.spyOn(preferenceRepository, 'find').mockResolvedValue(preferences);

    const result = await service.getAllPreferences();
    expect(result).toBe(preferences);
  });
});
