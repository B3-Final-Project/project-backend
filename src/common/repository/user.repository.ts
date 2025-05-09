import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class UserRepository {
  public constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly profileRepository: ProfileRepository,
  ) {}

  public async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  public async findProfileOrThrowByUserId(
    userId: string,
    relations: string[] = [],
  ): Promise<Profile> {
    const user = await this.findUserWithProfile(userId);

    if (relations.length === 0) {
      return user.profile;
    }

    return await this.profileRepository.findByProfileId(
      user.profile.id,
      relations,
    );
  }

  public async findUserWithProfile(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });
    if (!user?.profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }
    return user;
  }

  public async create(user: User): Promise<User> {
    return this.userRepository.create(user);
  }

  public async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}
