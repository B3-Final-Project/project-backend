import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  seedInterests,
  seedUsers,
  seedUsersAndInterests,
} from '../../seed/user.seed';
import { User } from '../../common/entities/user.entity';
import { Interest } from '../../common/entities/interest.entity';
import { Profile } from '../../common/entities/profile.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { BoosterPack } from '../../common/entities/booster.entity';
import { CreateBoosterDto } from '../booster/dto/create-booster.dto';
import { RelationshipTypeEnum } from '../profile/enums';

@Injectable()
export class SeedService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Seed interests in the database
   */
  async seedInterests(): Promise<number> {
    await seedInterests(this.dataSource);
    const interestRepo = this.dataSource.getRepository(Interest);
    return await interestRepo.count();
  }

  /**
   * Seed users in the database
   */
  async seedUsers(count: number = 50): Promise<number> {
    await seedUsers(this.dataSource, count);
    return count;
  }

  async seedBoosters(): Promise<{ message: string; count: number }> {
    const boosterRepo = this.dataSource.getRepository(BoosterPack);

    const boosters: CreateBoosterDto[] = [
      {
        name: 'Water Pack',
        type: RelationshipTypeEnum.CASUAL,
      },
      {
        name: 'Grass Pack',
        type: RelationshipTypeEnum.FRIENDSHIP,
      },
      {
        name: 'Rock Pack',
        type: RelationshipTypeEnum.LONG_TERM,
      },
      {
        name: 'Metal Pack',
        type: RelationshipTypeEnum.MARRIAGE,
      },
      {
        name: 'Random Pack',
        type: RelationshipTypeEnum.UNSURE,
      },
    ];

    await boosterRepo.save(boosters);
    console.log(`✅ Seeded ${boosters.length} booster packs`);

    return {
      message: 'Boosters seeded successfully',
      count: boosters.length,
    };
  }

  /**
   * Seed both interests and users in the database
   */
  async seedUsersAndInterests(userCount: number = 50): Promise<{
    interestCount: number;
    userCount: number;
  }> {
    await seedUsersAndInterests(this.dataSource, userCount);

    const interestRepo = this.dataSource.getRepository(Interest);
    const interestCount = await interestRepo.count();

    return {
      interestCount,
      userCount,
    };
  }

  /**
   * Clear all users and their related data from the database
   */
  async clearUsers(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear user matches first (foreign key constraint)
      await queryRunner.manager.delete(UserMatches, {});

      // Clear profiles (they have foreign key to users)
      await queryRunner.manager.delete(Profile, {});

      // Clear users
      await queryRunner.manager.delete(User, {});

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clear all interests from the database
   */
  async clearInterests(): Promise<void> {
    const interestRepo = this.dataSource.getRepository(Interest);
    await interestRepo.clear();
  }

  /**
   * Clear all boosters from the database
   */
  async clearBoosters(): Promise<void> {
    const boosterRepo = this.dataSource.getRepository(BoosterPack);
    await boosterRepo.clear();
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear in the correct order to respect foreign key constraints
      await queryRunner.manager.delete(UserMatches, {});
      await queryRunner.manager.delete(Profile, {});
      await queryRunner.manager.delete(User, {});
      await queryRunner.manager.delete(Interest, {});
      await queryRunner.manager.delete(BoosterPack, {});

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
