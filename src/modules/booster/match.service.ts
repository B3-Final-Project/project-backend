import {
  GenderEnum,
  OrientationEnum,
  RelationshipTypeEnum,
} from '../profile/enums';

import { Injectable } from '@nestjs/common';
import { shuffle } from 'lodash';
import { Profile } from '../../common/entities/profile.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { MatchRepository } from '../../common/repository/matches.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { RarityEnum } from '../profile/enums/rarity.enum';
import { BoosterAction } from './enums/action.enum';

@Injectable()
export class MatchService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly matchRepository: MatchRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  private async baseQuery(userId: string, excludeSeen?: boolean) {
    const user = await this.userRepo.findUserWithProfile(userId);
    const prefs = user.profile;

    // 2. Base query: other users
    const qb = this.profileRepository.createUserMatchQueryBuilder(userId);
    // 3. Age range
    if (prefs.min_age != null) {
      qb.andWhere('u.age >= :minAge', { minAge: prefs.min_age });
    }
    if (prefs.max_age != null) {
      qb.andWhere('u.age <= :maxAge', { maxAge: prefs.max_age });
    }

    // 4. Orientation & gender filtering
    if (prefs.orientation != null) {
      switch (prefs.orientation) {
        case OrientationEnum.GAY:
          // Gay users match same gender
          qb.andWhere('p.orientation = :orientation', {
            orientation: prefs.orientation,
          }).andWhere('u.gender = :gender', { gender: user.gender });
          break;
        case OrientationEnum.LESBIAN:
          // Lesbian users match female
          qb.andWhere('p.orientation = :orientation', {
            orientation: prefs.orientation,
          }).andWhere('u.gender = :gender', { gender: GenderEnum.FEMALE });
          break;
        case OrientationEnum.STRAIGHT: {
          // Straight users match opposite gender
          qb.andWhere('p.orientation = :orientation', {
            orientation: prefs.orientation,
          });
          const opposite =
            user.gender === GenderEnum.MALE
              ? GenderEnum.FEMALE
              : GenderEnum.MALE;
          qb.andWhere('u.gender = :gender', { gender: opposite });
          break;
        }
        default:
          // Bisexual, Pansexual, Asexual: match nothing
          break;
      }
    }

    // 6. Distance (PostGIS)
    if (prefs.city && user.location) {
      qb.addSelect(
        `
        ST_Distance(
          u.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) / 1000
      `,
        'distance_km',
      )
        .setParameters({
          lat: user.location.coordinates[1],
          lng: user.location.coordinates[0],
        })
        .having('ST_Distance(u.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000 <= :maxDist', {
          maxDist: prefs.max_distance ?? 100,
        })
        .groupBy('p.id, u.id')
        .orderBy('distance_km', 'ASC');
    }

    const seenIds = await this.matchRepository.getSeenRows(user.profile.id);

    const matchedIds = await this.matchRepository.getUserLikes(user.profile.id);

    // 7. Exclude already matched users
    if (matchedIds.length > 0) {
      qb.andWhere('p.id NOT IN (:...matchedIds)', {
        matchedIds: matchedIds.map((m) => m.to_profile_id),
      });
    }

    // 7b. Exclude them
    if (excludeSeen) {
      if (seenIds.length > 0) {
        qb.andWhere('p.id NOT IN (:...seenIds)', { seenIds });
      }
    }

    return {
      qb,
      prefs,
      user,
    };
  }

  /**
   * Find matching profiles for the given userId
   */
  async findMatchesForUser(
    userId: string,
    maxResults = 10,
    relationshipType?: RelationshipTypeEnum,
  ): Promise<(Profile & { rarity: RarityEnum })[]> {
    // 1. Load user and their profile
    const { qb, prefs, user } = await this.baseQuery(userId);
    const profile = user.profile;

    // 5. Relationship type
    if (relationshipType || prefs.relationship_type != null) {
      qb.andWhere('p.relationship_type = :relType', {
        relType: relationshipType ?? prefs.relationship_type,
      });
    }

    // 7. Limit (fetch more to allow for rarity selection)
    qb.limit(maxResults * 3);

    // 8. Execute
    const matches: Profile[] = await qb.getMany();

    // Calculate rarity for each match
    const matchesWithRarity = matches.map((m) => ({
      ...m,
      rarity: this.calculateRarity(profile, m),
    }));

    // Prioritize rare users, but always fill up to maxResults
    const rare = matchesWithRarity.filter((m) =>
      [RarityEnum.RARE, RarityEnum.EPIC, RarityEnum.LEGENDARY].includes(
        m.rarity,
      ),
    );
    const common = matchesWithRarity.filter(
      (m) =>
        ![RarityEnum.RARE, RarityEnum.EPIC, RarityEnum.LEGENDARY].includes(
          m.rarity,
        ),
    );

    // Always include at least 2 rare users if possible
    const result: (Profile & { rarity: RarityEnum })[] = [];
    result.push(...rare.slice(0, 2 - result.length));
    // Fill the rest with common/uncommon, then more rare if needed
    result.push(...common.slice(0, maxResults - result.length));
    if (result.length < maxResults) {
      result.push(...rare.slice(2, maxResults - result.length + 2));
    }
    // Shuffle the result for randomness
    return shuffle(result.slice(0, maxResults));
  }

  public async findBroadMatches(
    userId: string,
    excludeIds: number[],
    maxResults = 10,
    excludeSeen = true,
  ) {
    // 1. Load user and their profile
    const { qb } = await this.baseQuery(userId, excludeSeen);

    if (excludeIds.length > 0) {
      qb.andWhere('p.id NOT IN (:...excludeIds)', { excludeIds });
    }

    // 7. Limit
    qb.limit(maxResults);

    // 8. Execute
    return qb.getMany();
  }

  public async createMatches(
    profiles: Profile[],
    userId: string,
  ): Promise<UserMatches[]> {
    // Get the user's profile ID
    const user = await this.userRepo.findUserWithProfile(userId);
    const fromProfileId = user.profile.id;

    const userMatches = profiles.map((profile) => {
      const match = new UserMatches();
      match.from_profile_id = fromProfileId;
      match.to_profile_id = profile.id;
      match.action = BoosterAction.SEEN;
      return match;
    });

    return this.matchRepository.save(userMatches);
  }

  /**
   * Calculate rarity score based on shared attributes
   */
  private calculateRarity(user: Profile, match: Profile): RarityEnum {
    let score = 0;
    // City
    if (user.city && match.city && user.city === match.city) score += 2;
    // Orientation
    if (
      user.orientation != null &&
      match.orientation != null &&
      user.orientation === match.orientation
    )
      score += 2;
    // Relationship type
    if (
      user.relationship_type != null &&
      match.relationship_type != null &&
      user.relationship_type === match.relationship_type
    )
      score += 1;
    // Zodiac
    if (
      user.zodiac != null &&
      match.zodiac != null &&
      user.zodiac === match.zodiac
    )
      score += 1;
    // Religion
    if (
      user.religion != null &&
      match.religion != null &&
      user.religion === match.religion
    )
      score += 1;
    // Politics
    if (
      user.politics != null &&
      match.politics != null &&
      user.politics === match.politics
    )
      score += 1;
    // Smoking
    if (
      user.smoking != null &&
      match.smoking != null &&
      user.smoking === match.smoking
    )
      score += 1;
    // Drinking
    if (
      user.drinking != null &&
      match.drinking != null &&
      user.drinking === match.drinking
    )
      score += 1;
    // Languages (intersection count)
    if (user.languages && match.languages) {
      const sharedLangs = user.languages.filter((l) =>
        match.languages.includes(l),
      );
      score += Math.min(sharedLangs.length, 2); // up to 2 points for shared languages
    }
    // Interests (intersection count)
    if (user.interests && match.interests) {
      const userInterests = user.interests.map((i) => i.id);
      const matchInterests = match.interests.map((i) => i.id);
      const shared = userInterests.filter((id) => matchInterests.includes(id));
      score += Math.min(shared.length, 3); // up to 3 points for shared interests
    }
    // Scale score to rarity
    if (score >= 8) return RarityEnum.LEGENDARY;
    if (score >= 6) return RarityEnum.EPIC;
    if (score >= 4) return RarityEnum.RARE;
    if (score >= 2) return RarityEnum.UNCOMMON;
    return RarityEnum.COMMON;
  }
}
