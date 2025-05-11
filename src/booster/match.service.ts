import { Injectable } from '@nestjs/common';
import { Profile } from '../common/entities/profile.entity';
import { GenderEnum, OrientationEnum } from '../profile/enums';
import { UserMatches } from '../common/entities/user-matches.entity';
import { BoosterAction } from './enums/action.enum';
import { MatchRepository } from '../common/repository/matches.repository';
import { ProfileRepository } from '../common/repository/profile.repository';
import { UserRepository } from '../common/repository/user.repository';

@Injectable()
export class MatchService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly matchRepository: MatchRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  private async baseQuery(userId: string) {
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
          lat: (user.location as any).coordinates[1],
          lng: (user.location as any).coordinates[0],
        })
        .having('distance_km <= :maxDist', {
          maxDist: prefs.max_distance ?? 100,
        })
        .orderBy('distance_km', 'ASC');
    }

    const seenIds = await this.matchRepository.getSeenRows(userId);

    // 7b. Exclude them
    if (seenIds.length > 0) {
      qb.andWhere('p.id NOT IN (:...seenIds)', { seenIds });
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
  ): Promise<Profile[]> {
    // 1. Load user and their profile
    const { qb, prefs } = await this.baseQuery(userId);

    // 5. Relationship type
    if (prefs.relationship_type != null) {
      qb.andWhere('p.relationship_type = :relType', {
        relType: prefs.relationship_type,
      });
    }

    // 7. Limit
    qb.limit(maxResults);

    // 8. Execute
    return qb.getMany();
  }

  public async findBroadMatches(
    userId: string,
    excludeIds: number[],
    maxResults = 10,
  ) {
    // 1. Load user and their profile
    const { qb } = await this.baseQuery(userId);

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
    const userMatches = profiles.map((profile) => {
      const match = new UserMatches();
      match.user_id = userId;
      match.profile_id = profile.id;
      match.action = BoosterAction.SEEN;
      return match;
    });

    return this.matchRepository.save(userMatches);
  }
}
