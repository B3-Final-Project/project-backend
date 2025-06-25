import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BoosterAction } from '../../modules/booster/enums/action.enum';

@Injectable()
export class ProfileRepository {
  public constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  public createUserMatchQueryBuilder(userId: string) {
    return this.profileRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.userProfile', 'u')
      .where('u.user_id != :me', { me: userId });
  }

  public async findByProfileId(
    id: number,
    extraRelations?: string[],
  ): Promise<Profile | null> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: extraRelations,
    });

    if (!profile) {
      // should never happen, but just in case
      throw new NotFoundException(`Profile #${id} disappeared`);
    }

    return profile;
  }

  public async findByProfileIds(profileIds: number[]): Promise<Profile[]> {
    return this.profileRepository
      .createQueryBuilder('p')
      .where('p.id IN (:...profileIds)', { profileIds })
      .getMany();
  }

  public async findByUserIds(userIds: string[]): Promise<Profile[]> {
    return await this.profileRepository
      .createQueryBuilder('p')
      .innerJoin('p.userProfile', 'u')
      .where('u.user_id IN (:...userIds)', { userIds })
      .getMany();
  }

  public async findByUserId(
    userId: string,
    extraRelations?: string[],
  ): Promise<Profile | null> {
    const profile = await this.profileRepository.findOne({
      where: { userProfile: { user_id: userId } },
      relations: extraRelations,
    });

    if (!profile) {
      // should never happen, but just in case
      throw new NotFoundException(`Profile #${userId} disappeared`);
    }

    return profile;
  }

  public async save(profile: Profile): Promise<Profile> {
    return await this.profileRepository.save(profile);
  }

  public async saveImageUrl(
    profile: Profile,
    imageUrl: string,
    index: number = 0,
  ): Promise<{ images: string[] }> {
    if (!profile.images) {
      profile.images = [];
    }
    if (index > profile.images.length) {
      index = profile.images.length;
    }
    if (profile.images[index]) {
      // If there's already an image at this index, replace it
      profile.images[index] = imageUrl;
    } else {
      // If the index is empty, just add the new image
      profile.images.push(imageUrl);
    }
    await this.save(profile);
    return { images: profile.images };
  }

  public async findMatchedProfiles(profileId: number): Promise<Profile[]> {
    // Find profiles where both profiles have liked each other
    return await this.profileRepository
      .createQueryBuilder('p')
      .innerJoin(
        'matches',
        'my_like',
        'my_like.to_profile_id = p.id AND my_like.from_profile_id = :profileId AND my_like.action = :likeAction',
      )
      .innerJoin(
        'matches',
        'their_like',
        'their_like.from_profile_id = p.id AND their_like.to_profile_id = :profileId AND their_like.action = :likeAction',
      )
      .setParameters({
        profileId,
        likeAction: BoosterAction.LIKE,
      })
      .getMany();
  }

  public async getLocations(): Promise<{ city: string; count: string }[]> {
    // Groups unique cities with count, ordered by count descending
    return this.profileRepository
      .createQueryBuilder('profile')
      .select('profile.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('profile.city IS NOT NULL')
      .andWhere('profile.city != :empty', { empty: '' })
      .groupBy('profile.city')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
