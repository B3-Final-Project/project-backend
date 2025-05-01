import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import {
  HttpRequestDto,
  UserCredentialsDto,
} from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: Repository<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
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

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
  });

  it('should throw error if profile not found', async () => {
    jest.spyOn(profileRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.updateProfileInterests('1', ['interest1', 'interest2']),
    ).rejects.toThrow('Profile for user 1 not found');
  });

  it('should get profile by user id', async () => {
    const profiles = new Profile();
    jest.spyOn(profileRepository, 'findOne').mockResolvedValue(profiles);

    const user: UserCredentialsDto = {
      userId: 'user1',
      groups: [],
    };

    const req = { user } as HttpRequestDto;

    const result = await service.getProfiles(req);
    expect(result).toBe(profiles);
  });

  it('should get all profile', async () => {
    const profiles = [new Profile()];
    jest.spyOn(profileRepository, 'find').mockResolvedValue(profiles);

    const result = await service.getAllProfiles();
    expect(result).toBe(profiles);
  });
});
