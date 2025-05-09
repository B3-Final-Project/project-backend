import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

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

  public async save(profile: Profile): Promise<Profile> {
    return await this.profileRepository.save(profile);
  }
}
