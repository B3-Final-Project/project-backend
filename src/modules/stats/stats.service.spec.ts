import { Test, TestingModule } from '@nestjs/testing';

import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterUsageRepository } from '../../common/repository/booster-usage.repository';
import { MatchRepository } from '../../common/repository/matches.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { RelationshipTypeEnum } from '../profile/enums';
import { StatsService } from './stats.service';
import { UserRepository } from '../../common/repository/user.repository';

describe('StatsService', () => {
  let service: StatsService;
  let userRepository: jest.Mocked<UserRepository>;
  let matchRepository: jest.Mocked<MatchRepository>;
  let profileRepository: jest.Mocked<ProfileRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: UserRepository,
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            getBoosterUsageByRelationshipType: jest.fn(),
            getAverageAge: jest.fn(),
            getAgeDistribution: jest.fn(),
            getProfilesCountWithRelationshipType: jest.fn(),
            getRelationshipTypeDistribution: jest.fn(),
          },
        },
        {
          provide: MatchRepository,
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            getActiveUsersCount: jest.fn(),
          },
        },
        {
          provide: BoosterRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: BoosterUsageRepository,
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: ProfileRepository,
          useValue: {
            getLocations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    userRepository = module.get(UserRepository);
    matchRepository = module.get(MatchRepository);
    profileRepository = module.get(ProfileRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAppStats', () => {
    it('should return application statistics', async () => {
      // Mock repository methods
      userRepository.count.mockResolvedValue(100);
      matchRepository.count
        .mockResolvedValueOnce(50) // matches
        .mockResolvedValueOnce(200) // passes
        .mockResolvedValueOnce(150); // likes

      const result = await service.getAppStats();

      expect(result).toEqual({
        totalUsers: 100,
        totalMatches: 50,
        totalPasses: 200,
        totalLikes: 150,
      });
    });
  });

  describe('getBoosterStats', () => {
    it('should return booster statistics by relationship type', async () => {
      const mockRelationshipStats = [
        { type: RelationshipTypeEnum.CASUAL.toString(), timesOpened: '25' },
        { type: RelationshipTypeEnum.LONG_TERM.toString(), timesOpened: '35' },
      ];

      userRepository.getBoosterUsageByRelationshipType.mockResolvedValue(
        mockRelationshipStats,
      );

      const result = await service.getBoosterStats();

      expect(result).toEqual([
        {
          boosterId: RelationshipTypeEnum.CASUAL,
          boosterName: 'CASUAL',
          boosterType: 'CASUAL',
          timesOpened: 25,
        },
        {
          boosterId: RelationshipTypeEnum.LONG_TERM,
          boosterName: 'LONG_TERM',
          boosterType: 'LONG_TERM',
          timesOpened: 35,
        },
        {
          boosterId: RelationshipTypeEnum.MARRIAGE,
          boosterName: 'MARRIAGE',
          boosterType: 'MARRIAGE',
          timesOpened: 0,
        },
        {
          boosterId: RelationshipTypeEnum.FRIENDSHIP,
          boosterName: 'FRIENDSHIP',
          boosterType: 'FRIENDSHIP',
          timesOpened: 0,
        },
        {
          boosterId: RelationshipTypeEnum.UNSURE,
          boosterName: 'UNSURE',
          boosterType: 'UNSURE',
          timesOpened: 0,
        },
      ]);
    });
  });

  describe('getGeographicStats', () => {
    it('should return geographic statistics', async () => {
      const mockLocationData = [
        { city: 'Paris', count: '450' },
        { city: 'Lyon', count: '320' },
      ];

      profileRepository.getLocations.mockResolvedValue(mockLocationData);

      const result = await service.getGeographicStats();

      expect(result).toEqual({
        topCity: 'Paris',
        topCityUserCount: 450,
        topCities: [
          { city: 'Paris', count: 450 },
          { city: 'Lyon', count: 320 },
        ],
      });
    });

    it('should return default values when no location data available', async () => {
      profileRepository.getLocations.mockResolvedValue([]);

      const result = await service.getGeographicStats();

      expect(result).toEqual({
        topCity: 'Data not available',
        topCityUserCount: 0,
        topCities: [],
      });
    });
  });
});
