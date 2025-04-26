import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { PreferenceService } from './profile.service';
import {
  HttpRequestDto,
  UserCredentialsDto,
} from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';

describe('PreferenceService', () => {
  let service: PreferenceService;
  let preferenceRepository: Repository<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferenceService,
        {
          provide: getRepositoryToken(Profile),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Interest),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PreferenceService>(PreferenceService);
    preferenceRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
  });

  it('should throw error if profile not found', async () => {
    jest.spyOn(preferenceRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.updatePreferenceInterests('1', ['interest1', 'interest2']),
    ).rejects.toThrow('Preference for user 1 not found');
  });

  it('should get profile by user id', async () => {
    const profiles = [new Profile()];
    jest.spyOn(preferenceRepository, 'find').mockResolvedValue(profiles);

    const user: UserCredentialsDto = {
      userId: 'user1',
      username: 'user1',
      roles: [],
    };

    const req = { user } as HttpRequestDto;

    const result = await service.getPreferences(req);
    expect(result).toBe(profiles);
  });

  it('should get all profile', async () => {
    const profiles = [new Profile()];
    jest.spyOn(preferenceRepository, 'find').mockResolvedValue(profiles);

    const result = await service.getAllPreferences();
    expect(result).toBe(profiles);
  });
});
