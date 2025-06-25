import { Test, TestingModule } from '@nestjs/testing';

import { BoosterPack } from '../../common/entities/booster.entity';
import { BoosterUsage } from '../../common/entities/booster-usage.entity';
import { RelationshipTypeEnum } from '../profile/enums';
import { Repository } from 'typeorm';
import { StatsService } from './stats.service';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('StatsService', () => {
  let service: StatsService;
  let userRepository: Repository<User>;
  let userMatchesRepository: Repository<UserMatches>;
  let boosterPackRepository: Repository<BoosterPack>;
  let boosterUsageRepository: Repository<BoosterUsage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserMatches),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BoosterPack),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BoosterUsage),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userMatchesRepository = module.get<Repository<UserMatches>>(
      getRepositoryToken(UserMatches),
    );
    boosterPackRepository = module.get<Repository<BoosterPack>>(
      getRepositoryToken(BoosterPack),
    );
    boosterUsageRepository = module.get<Repository<BoosterUsage>>(
      getRepositoryToken(BoosterUsage),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAppStats', () => {
    it('should return application statistics', async () => {
      // Mock repository methods
      jest.spyOn(userRepository, 'count').mockResolvedValue(100);
      jest
        .spyOn(userMatchesRepository, 'count')
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
    it('should return booster statistics', async () => {
      const mockBoosterPacks = [
        {
          id: 1,
          name: 'Casual Pack',
          type: RelationshipTypeEnum.CASUAL,
          imageUrl: 'test.jpg',
        },
        {
          id: 2,
          name: 'Long Term Pack',
          type: RelationshipTypeEnum.LONG_TERM,
          imageUrl: 'test2.jpg',
        },
      ];

      jest
        .spyOn(boosterPackRepository, 'find')
        .mockResolvedValue(mockBoosterPacks);
      jest
        .spyOn(boosterUsageRepository, 'count')
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(35);

      const result = await service.getBoosterStats();

      expect(result).toEqual([
        {
          boosterId: 1,
          boosterName: 'Casual Pack',
          boosterType: 'CASUAL',
          timesOpened: 25,
        },
        {
          boosterId: 2,
          boosterName: 'Long Term Pack',
          boosterType: 'LONG_TERM',
          timesOpened: 35,
        },
      ]);
    });
  });
});
