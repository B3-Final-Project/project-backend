import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoosterService } from './booster.service';
import { MatchService } from './match.service';
import { HttpRequestDto } from '../common/dto/http-request.dto';

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
        BoosterService,
      ],
    }).compile();

    boosterService = module.get(BoosterService);
    matchService = module.get(MatchService);
  });

  describe('getBooster', () => {
    it('throws if there is no user in the request', async () => {
      const amount = '5';
      const request = { user: null } as unknown as HttpRequestDto;
      await expect(boosterService.getBooster(amount, request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the exact matches when there are enough', async () => {
      const amount = '3';
      const parsedAmount = 3;
      const userId = 'user-1';
      const request = { user: { userId } } as HttpRequestDto;
      const matches = [
        {
          id: 1,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      matchService.findMatchesForUser.mockResolvedValue(matches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.getBooster(amount, request);

      expect(matchService.findMatchesForUser).toHaveBeenCalledWith(
        userId,
        parsedAmount,
      );
      expect(matchService.findBroadMatches).not.toHaveBeenCalled();
      expect(matchService.createMatches).toHaveBeenCalledWith(matches, userId);
      expect(result).toEqual(matches);
    });

    it('falls back to broadMatches when there aren’t enough', async () => {
      const amount = '5';
      const userId = 'user-2';
      const request = { user: { userId } } as HttpRequestDto;

      // initial 2 profiles
      const initialMatches = [
        {
          id: 1,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          userProfile: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      // extra 8 profiles
      const extraMatches = Array.from({ length: 8 }, (_, i) => ({
        id: 3 + i,
        userProfile: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // snapshot before any mutation
      const initialSnapshot = [...initialMatches];
      const seenIds = initialSnapshot.map((p) => p.id);
      const expectedBroadCount = 10 - initialSnapshot.length; // 8

      matchService.findMatchesForUser.mockResolvedValue(initialMatches);
      matchService.findBroadMatches.mockResolvedValue(extraMatches);
      matchService.createMatches.mockResolvedValue(undefined as any);

      const result = await boosterService.getBooster(amount, request);

      // it should ask for exactly 8 extra
      expect(matchService.findBroadMatches).toHaveBeenCalledWith(
        userId,
        seenIds,
        expectedBroadCount,
      );

      // createMatches is called with the final returned array
      expect(matchService.createMatches).toHaveBeenCalledWith(result, userId);

      // and the result is the two + eight = ten profiles
      expect(result).toEqual([...initialSnapshot, ...extraMatches]);
    });

    it('gracefully handles “no matches” by still calling broad with 10', async () => {
      const amount = '2';
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
      );
      expect(matchService.findBroadMatches).toHaveBeenCalledWith(
        userId,
        [],
        10,
      );
      expect(matchService.createMatches).toHaveBeenCalledWith([], userId);
      expect(result).toEqual([]);
    });
  });
});
