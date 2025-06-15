import { GenderEnum, OrientationEnum } from '../profile/enums';
// match.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';

import { BoosterAction } from './enums/action.enum';
import { MatchRepository } from '../../common/repository/matches.repository';
import { MatchService } from './match.service';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';

describe('MatchService', () => {
  let svc: MatchService;
  let userRepo: jest.Mocked<UserRepository>;
  let matchRepo: jest.Mocked<MatchRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;

  // a fake QueryBuilder with chainable methods
  const makeQB = () => {
    const qb: any = {
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    return qb as typeof qb & { getMany(): Promise<any[]> };
  };

  beforeEach(async () => {
    userRepo = { findUserWithProfile: jest.fn() } as any;
    matchRepo = { getSeenRows: jest.fn(), save: jest.fn(), getUserLikes: jest.fn() } as any;
    profileRepo = { createUserMatchQueryBuilder: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: UserRepository, useValue: userRepo },
        { provide: MatchRepository, useValue: matchRepo },
        { provide: ProfileRepository, useValue: profileRepo },
      ],
    }).compile();

    svc = module.get(MatchService);
  });

  describe('findMatchesForUser', () => {
    it('applies prefs and relationship_type and returns profiles', async () => {
      // arrange
      const qb = makeQB();
      profileRepo.createUserMatchQueryBuilder.mockReturnValue(qb);
      const fakeUser = {
        gender: GenderEnum.MALE,
        location: null,
        profile: {
          id: 'profile123',
          min_age: 18,
          max_age: 30,
          orientation: OrientationEnum.STRAIGHT,
          relationship_type: 'casual',
          city: null,
          max_distance: null,
        },
      } as any;
      userRepo.findUserWithProfile.mockResolvedValue(fakeUser);
      matchRepo.getSeenRows.mockResolvedValue([42]);
      matchRepo.getUserLikes.mockResolvedValue([]);

      const expected: Profile[] = [{ id: 1 } as any];
      qb.getMany.mockResolvedValue(expected);

      // act
      const got = await svc.findMatchesForUser('u123', 7);

      // assert: user & prefs loaded
      expect(userRepo.findUserWithProfile).toHaveBeenCalledWith('u123');
      // getSeenRows should be called with profile ID instead of user ID
      expect(matchRepo.getSeenRows).toHaveBeenCalledWith('profile123');
      // age filters
      expect(qb.andWhere).toHaveBeenCalledWith('u.age >= :minAge', {
        minAge: 18,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('u.age <= :maxAge', {
        maxAge: 30,
      });
      // orientation=STRAIGHT -> opposite gender
      expect(qb.andWhere).toHaveBeenCalledWith('p.orientation = :orientation', {
        orientation: OrientationEnum.STRAIGHT,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('u.gender = :gender', {
        gender: GenderEnum.FEMALE,
      });
      // relationship_type filter
      expect(qb.andWhere).toHaveBeenCalledWith(
        'p.relationship_type = :relType',
        {
          relType: fakeUser.profile.relationship_type,
        },
      );
      // seen exclusion
      expect(qb.andWhere).toHaveBeenCalledWith('p.id NOT IN (:...seenIds)', {
        seenIds: [42],
      });
      // limit = 7
      expect(qb.limit).toHaveBeenCalledWith(7);
      // returns whatever getMany gives
      expect(got).toBe(expected);
    });
  });

  describe('findBroadMatches', () => {
    it('excludes given IDs and uses default limit', async () => {
      const qb = makeQB();
      profileRepo.createUserMatchQueryBuilder.mockReturnValue(qb);
      // stub baseQuery user/prefs
      const fakeUser = { profile: { id: 'profileX' } } as any;
      userRepo.findUserWithProfile.mockResolvedValue(fakeUser);
      matchRepo.getSeenRows.mockResolvedValue([]);
      matchRepo.getUserLikes.mockResolvedValue([]);

      const broad: Profile[] = [{ id: 99 } as any];
      qb.getMany.mockResolvedValue(broad);

      const got = await svc.findBroadMatches('uX', [5, 6], 4);

      expect(profileRepo.createUserMatchQueryBuilder).toHaveBeenCalledWith(
        'uX',
      );
      expect(qb.andWhere).toHaveBeenCalledWith('p.id NOT IN (:...excludeIds)', {
        excludeIds: [5, 6],
      });
      expect(qb.limit).toHaveBeenCalledWith(4);
      expect(got).toBe(broad);
    });

    it('skips exclude filter when no IDs', async () => {
      const qb = makeQB();
      profileRepo.createUserMatchQueryBuilder.mockReturnValue(qb);
      const fakeUser = { profile: { id: 'profileY' } } as any;
      userRepo.findUserWithProfile.mockResolvedValue(fakeUser);
      matchRepo.getSeenRows.mockResolvedValue([]);
      matchRepo.getUserLikes.mockResolvedValue([]);

      qb.getMany.mockResolvedValue([]);

      const got = await svc.findBroadMatches('uY', [], 10);

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'p.id NOT IN (:...excludeIds)',
        expect.anything(),
      );
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(got).toEqual([]);
    });
  });

  describe('createMatches', () => {
    it('maps profiles to UserMatches and calls save', async () => {
      const profiles: Profile[] = [{ id: 7 } as any, { id: 13 } as any];
      const saved: UserMatches[] = [];
      matchRepo.save.mockResolvedValue(saved);

      // Mock the user with profile
      const fakeUser = {
        profile: { id: 'profile123' },
      } as any;
      userRepo.findUserWithProfile.mockResolvedValue(fakeUser);

      const got = await svc.createMatches(profiles, 'USER42');

      // it should build two UserMatches with profile-based structure
      expect(matchRepo.save).toHaveBeenCalledTimes(1);
      const toSave = matchRepo.save.mock.calls[0][0];
      expect(toSave.length).toBe(2);
      expect(toSave[0]).toMatchObject({
        from_profile_id: 'profile123',
        to_profile_id: 7,
        action: BoosterAction.SEEN,
      });
      expect(toSave[1]).toMatchObject({
        from_profile_id: 'profile123',
        to_profile_id: 13,
        action: BoosterAction.SEEN,
      });
      // returns repository result
      expect(got).toBe(saved);
    });
  });
});
