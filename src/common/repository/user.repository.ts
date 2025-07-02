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

  public async findById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { user_id: userId } });
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

  public create(user: User): User {
    return this.userRepository.create(user);
  }

  public async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  public async count(options?: any): Promise<number> {
    return this.userRepository.count(options);
  }

  public async getAverageAge(): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.age)', 'averageAge')
      .getRawOne();

    return parseFloat(result?.averageAge) || 0;
  }

  public async getAgeDistribution(): Promise<Record<string, number>> {
    const ageRanges = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `SUM(CASE WHEN age BETWEEN 18 AND 25 THEN 1 ELSE 0 END) as "range18_25"`,
        `SUM(CASE WHEN age BETWEEN 26 AND 35 THEN 1 ELSE 0 END) as "range26_35"`,
        `SUM(CASE WHEN age BETWEEN 36 AND 45 THEN 1 ELSE 0 END) as "range36_45"`,
        `SUM(CASE WHEN age > 45 THEN 1 ELSE 0 END) as "range45Plus"`,
      ])
      .getRawOne();

    return {
      '18-25': parseInt(ageRanges?.range18_25) || 0,
      '26-35': parseInt(ageRanges?.range26_35) || 0,
      '36-45': parseInt(ageRanges?.range36_45) || 0,
      '45+': parseInt(ageRanges?.range45Plus) || 0,
    };
  }

  public async getBoosterUsageByRelationshipType(): Promise<any[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .leftJoin('booster_usage', 'usage', 'usage.userId = user.id')
      .select('profile.relationship_type', 'type')
      .addSelect('COUNT(usage.id)', 'timesOpened')
      .where('profile.relationship_type IS NOT NULL')
      .andWhere('usage.id IS NOT NULL')
      .groupBy('profile.relationship_type')
      .getRawMany();
  }

  public async getProfilesCountWithRelationshipType(): Promise<number> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .where('profile.id IS NOT NULL')
      .getCount();
  }

  public async getRelationshipTypeDistribution(): Promise<any> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .select([
        `SUM(CASE WHEN profile.relationship_type = 1 THEN 1 ELSE 0 END) as "casual"`,
        `SUM(CASE WHEN profile.relationship_type = 2 THEN 1 ELSE 0 END) as "longTerm"`,
        `SUM(CASE WHEN profile.relationship_type = 3 THEN 1 ELSE 0 END) as "marriage"`,
        `SUM(CASE WHEN profile.relationship_type = 4 THEN 1 ELSE 0 END) as "friendship"`,
        `SUM(CASE WHEN profile.relationship_type = 5 THEN 1 ELSE 0 END) as "unsure"`,
      ])
      .where('profile.id IS NOT NULL')
      .getRawOne();
  }

  public async updateBanStatus(
    userId: string,
    isBanned: boolean,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userRepository.update(
      { user_id: userId },
      {
        banned: isBanned,
        updated_at: new Date(),
      },
    );

    return await this.findById(userId);
  }

  public async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userRepository.delete({ user_id: userId });
  }

  /**
   * Delete user and profile in a transaction to handle foreign key constraints
   */
  public async deleteUserAndProfile(userId: string, profileId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Use a transaction to delete both user and profile atomically
    await this.userRepository.manager.transaction(async manager => {
      // First, set the profile_id to NULL in users table using raw SQL
      await manager.query('UPDATE users SET profile_id = NULL WHERE user_id = $1', [userId]);
      
      // Then delete the profile
      await manager.query('DELETE FROM profiles WHERE id = $1', [profileId]);
      
      // Finally delete the user
      await manager.query('DELETE FROM users WHERE user_id = $1', [userId]);
    });
  }
}
