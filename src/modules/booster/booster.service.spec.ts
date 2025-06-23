import { Test, TestingModule } from '@nestjs/testing';

import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterService } from './booster.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchService } from './match.service';
import { NotFoundException } from '@nestjs/common';
<<<<<<< HEAD
=======
import { RarityEnum } from '../profile/enums/rarity.enum';
import { UserCardDto } from '../../common/dto/user-card.dto';
>>>>>>> main

describe('BoosterService', () => {
  let boosterService: BoosterService;
  let matchService: jest.Mocked<MatchService>;
  let boosterRepository: jest.Mocked<BoosterRepository>;

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
        BoosterService,
      ],
    }).compile();

    boosterService = module.get(BoosterService);
    matchService = module.get(MatchService);
    boosterRepository = module.get(BoosterRepository);
  });

  describe('getBooster', () => {
    it('throws if there is no user in the request', async () => {
      const amount = 5;
      const request = { user: null } as unknown as HttpRequestDto;
      await expect(boosterService.getBooster(amount, request)).rejects.toThrow(
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
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.UNCOMMON,
        },
        {
          id: 3,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.RARE,
        },
      ];

      matchService.findMatchesForUser.mockResolvedValue(matches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.getBooster(amount, request);

      expect(matchService.findMatchesForUser).toHaveBeenCalledWith(
        userId,
        parsedAmount,
<<<<<<< HEAD
        undefined, // relationship type parameter
=======
        undefined,
>>>>>>> main
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
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.COMMON,
        },
        {
          id: 2,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.UNCOMMON,
        },
        {
          id: 3,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.RARE,
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
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
          rarity: RarityEnum.UNCOMMON,
        },
      ];

      const extraMatches = Array.from({ length: 8 }, (_, i) => ({
        id: 3 + i,
        userProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
        rarity: RarityEnum.COMMON,
      }));

      const initialSnapshot = [...initialMatches];
      const seenIds = initialSnapshot.map((p) => p.id);
      const expectedBroadCount = amount - initialSnapshot.length;

      matchService.findMatchesForUser.mockResolvedValue(initialMatches);
      matchService.findBroadMatches.mockResolvedValue(extraMatches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.getBooster(amount, request);

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
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.COMMON,
        },
        {
          id: 2,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.UNCOMMON,
        },
        ...Array.from({ length: 8 }, (_, i) => ({
          id: 3 + i,
          name: '',
          age: 0,
          city: '',
          work: '',
          images: [],
          languages: [],
          smoking: undefined,
          drinking: undefined,
          zodiac: undefined,
          interests: [],
          rarity: RarityEnum.COMMON,
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

      const result = await boosterService.getBooster(amount, request);

      expect(matchService.findMatchesForUser).toHaveBeenCalledWith(
        userId,
        parsedAmount,
<<<<<<< HEAD
        undefined, // relationship type parameter
=======
        undefined,
>>>>>>> main
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
