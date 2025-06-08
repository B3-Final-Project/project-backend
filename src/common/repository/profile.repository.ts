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
      .innerJoin('p.userProfile', 'u')
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

  public createQueryBuilder(alias: string) {
    return this.profileRepository.createQueryBuilder(alias);
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

  public async findMatchedProfiles(userId: string): Promise<Profile[]> {
    // Find profiles where both users have liked each other
    return await this.profileRepository
      .createQueryBuilder('p')
      .innerJoin('p.userProfile', 'u')
      .innerJoin(
        'matches',
        'my_like',
        'my_like.profile_id = p.id AND my_like.user_id = :userId AND my_like.action = :likeAction',
      )
      .innerJoin(
        'matches',
        'their_like',
        'their_like.user_id = u.user_id AND their_like.action = :likeAction',
      )
      .innerJoin('users', 'my_user', 'my_user.user_id = :userId')
      .innerJoin('profiles', 'my_profile', 'my_profile.id = my_user.profile_id')
      .where('their_like.profile_id = my_profile.id')
      .setParameters({
        userId,
        likeAction: BoosterAction.LIKE,
      })
      .getMany();
  }
}
