import { Test, TestingModule } from '@nestjs/testing';

import { AnalyticsService } from '../stats/analytics.service';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterService } from './booster.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchService } from './match.service';
import { NotFoundException } from '@nestjs/common';
import { RarityEnum } from '../profile/enums/rarity.enum';
import { UserCardDto } from '../../common/dto/user-card.dto';
import { UserRepository } from '../../common/repository/user.repository';

describe('BoosterService', () => {
  let boosterService: BoosterService;
  let matchService: jest.Mocked<MatchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MatchService,
          useValue: {
            findMatchesForUser: jest.fn(),
            findBroadMatches: jest.fn(),
            createMatches: jest.fn(),
          },
        },
        {
          provide: BoosterRepository,
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackBoosterUsage: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findUserWithProfile: jest.fn(),
          },
        },
        BoosterService,
      ],
    }).compile();

    boosterService = module.get(BoosterService);
    matchService = module.get(MatchService);
  });

  describe('getBooster', () => {
    it('throws if there is no user in the request', async () => {
      const amount = 5;
      const request = { user: null } as unknown as HttpRequestDto;
      await expect(boosterService.openBooster(amount, request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the exact matches when there are enough', async () => {
      const amount = 3;
      const parsedAmount = 3;
      const userId = 'user-1';
      const request = { user: { userId } } as HttpRequestDto;
      const matches = [
        {
          id: 1,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.COMMON,
          city: '',
          work: '',
          languages: [],
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          smoking: undefined,
          drinking: undefined,
          religion: undefined,
          politics: undefined,
          zodiac: undefined,
          images: [],
          avatarUrl: undefined,
          interests: [],
          reportCount: 0,
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.UNCOMMON,
          city: '',
          work: '',
          languages: [],
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          smoking: undefined,
          drinking: undefined,
          religion: undefined,
          politics: undefined,
          zodiac: undefined,
          images: [],
          avatarUrl: undefined,
          interests: [],
          reportCount: 0,
        },
        {
          id: 3,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.RARE,
          city: '',
          work: '',
          languages: [],
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          smoking: undefined,
          drinking: undefined,
          religion: undefined,
          politics: undefined,
          zodiac: undefined,
          images: [],
          avatarUrl: undefined,
          interests: [],
          reportCount: 0,
        },
      ];

      matchService.findMatchesForUser.mockResolvedValue(matches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.openBooster(amount, request);

      expect(matchService.findMatchesForUser).toHaveBeenCalledWith(
        userId,
        parsedAmount,
        undefined,
      );
      expect(matchService.findBroadMatches).not.toHaveBeenCalled();
      expect(matchService.createMatches).toHaveBeenCalledWith(matches, userId);

      const expectedResult: UserCardDto[] = [
        {
          id: 1,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          rarity: RarityEnum.COMMON,
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: matches[0].created_at,
          updated_at: matches[0].updated_at,
        },
        {
          id: 2,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.UNCOMMON,
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: matches[1].created_at,
          updated_at: matches[1].updated_at,
        },
        {
          id: 3,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.RARE,
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: matches[2].created_at,
          updated_at: matches[2].updated_at,
        },
      ];
      expect(result).toEqual(expectedResult);
    });

    it('falls back to broadMatches when there are not enough', async () => {
      const amount = 5;
      const userId = 'user-2';
      const request = { user: { userId } } as HttpRequestDto;

      const initialMatches = [
        {
          id: 1,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.COMMON,
          city: '',
          work: '',
          languages: [],
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          smoking: undefined,
          drinking: undefined,
          religion: undefined,
          politics: undefined,
          zodiac: undefined,
          images: [],
          avatarUrl: undefined,
          interests: [],
          reportCount: 0,
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.UNCOMMON,
          city: '',
          work: '',
          languages: [],
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          smoking: undefined,
          drinking: undefined,
          religion: undefined,
          politics: undefined,
          zodiac: undefined,
          images: [],
          avatarUrl: undefined,
          interests: [],
          reportCount: 0,
        },
      ];

      const extraMatches = Array.from({ length: 8 }, (_, i) => ({
        id: 3 + i,
        userProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
        rarity: RarityEnum.COMMON,
        city: '',
        work: '',
        languages: [],
        min_age: 18,
        max_age: 30,
        max_distance: 50,
        orientation: 1,
        relationship_type: 1,
        smoking: undefined,
        drinking: undefined,
        religion: undefined,
        politics: undefined,
        zodiac: undefined,
        images: [],
        avatarUrl: undefined,
        interests: [],
        reportCount: 0,
      }));

      const initialSnapshot = [...initialMatches];
      const seenIds = initialSnapshot.map((p) => p.id);
      const expectedBroadCount = amount - initialSnapshot.length;

      matchService.findMatchesForUser.mockResolvedValue(initialMatches);
      matchService.findBroadMatches.mockResolvedValue(extraMatches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.openBooster(amount, request);

      expect(matchService.findBroadMatches).toHaveBeenCalledWith(
        userId,
        seenIds,
        expectedBroadCount,
      );

      const expectedCreateMatchesArgs = [...initialSnapshot, ...extraMatches];
      expect(matchService.createMatches).toHaveBeenCalledWith(
        expectedCreateMatchesArgs,
        userId,
      );

      const expectedResult: UserCardDto[] = [
        {
          id: 1,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.COMMON,
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: initialMatches[0].created_at,
          updated_at: initialMatches[0].updated_at,
        },
        {
          id: 2,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.UNCOMMON,
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: initialMatches[1].created_at,
          updated_at: initialMatches[1].updated_at,
        },
        ...Array.from({ length: 8 }, (_, i) => ({
          id: 3 + i,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          avatarUrl: '/vintage.png',
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.COMMON,
          surname: '',
          min_age: 18,
          max_age: 30,
          max_distance: 50,
          orientation: 1,
          relationship_type: 1,
          religion: undefined,
          politics: undefined,
          created_at: extraMatches[i].created_at,
          updated_at: extraMatches[i].updated_at,
        })),
      ];
      expect(result).toEqual(expectedResult);
    });

    it('gracefully handles no matches by still calling broad with amount', async () => {
      const amount = 2;
      const parsedAmount = 2;
      const userId = 'user-3';
      const request = { user: { userId } } as HttpRequestDto;

      matchService.findMatchesForUser.mockResolvedValue([]);
      matchService.findBroadMatches.mockResolvedValue([]);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.openBooster(amount, request);

      expect(matchService.findMatchesForUser).toHaveBeenCalledWith(
        userId,
        parsedAmount,
        undefined,
      );
      // First call to findBroadMatches with amount (since profiles is empty)
      expect(matchService.findBroadMatches).toHaveBeenNthCalledWith(
        1,
        userId,
        [],
        amount,
      );
      // Second call to findBroadMatches in panic mode with excludeSeen: false
      expect(matchService.findBroadMatches).toHaveBeenNthCalledWith(
        2,
        userId,
        [],
        amount,
        false,
      );
      expect(matchService.createMatches).toHaveBeenCalledWith([], userId);
      expect(result).toEqual([]);
    });
  });
});
