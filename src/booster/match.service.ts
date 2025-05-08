// src/match/match.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../common/entities/profile.entity';
import { User } from '../common/entities/user.entity';
import { GenderEnum, OrientationEnum } from '../profile/enums';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  /**
   * Find matching profiles for the given userId
   */
  async findMatchesForUser(
    userId: string,
    maxResults = 20,
  ): Promise<Profile[]> {
    // 1. Load user and their profile
    const user = await this.userRepo.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });
    if (!user || !user.profile) {
      throw new NotFoundException('User or profile not found');
    }
    const prefs = user.profile;

    // 2. Base query: other users
    const qb = this.profileRepo
      .createQueryBuilder('p')
      .innerJoin('p.userProfile', 'u')
      .where('u.user_id != :me', { me: userId });

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
        case OrientationEnum.STRAIGHT:
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
        default:
          // Bisexual, Pansexual, Asexual: match orientation only
          qb.andWhere('p.orientation = :orientation', {
            orientation: prefs.orientation,
          });
          break;
      }
    }

    // 5. Relationship type
    if (prefs.relationship_type != null) {
      qb.andWhere('p.relationship_type = :relType', {
        relType: prefs.relationship_type,
      });
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
          maxDist: prefs.max_distance || 100,
        })
        .orderBy('distance_km', 'ASC');
    }

    // 7. Limit
    qb.limit(maxResults);

    // 8. Execute
    return qb.getMany();
  }
}
