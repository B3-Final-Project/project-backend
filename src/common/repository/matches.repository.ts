import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMatches } from '../entities/user-matches.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchRepository {
  public constructor(
    @InjectRepository(UserMatches)
    private readonly userMatches: Repository<UserMatches>,
  ) {}

  public async getSeenRows(userId: string) {
    const seenRows = await this.userMatches.find({
      where: { user_id: userId },
    });

    return seenRows.map((row) => row.profile_id);
  }

  public async save(matches: UserMatches[]) {
    return await this.userMatches.save(matches);
  }

  public async getUserLikes(userId: string): Promise<UserMatches[]> {
    return await this.userMatches.find({
      where: {
        user_id: userId,
        action: 1, // BoosterAction.LIKE
      },
    });
  }

  public async isMatch(
    userId1: string,
    profileId1: number,
    userId2: string,
    profileId2: number,
  ): Promise<boolean> {
    const like1 = await this.userMatches.findOne({
      where: {
        user_id: userId1,
        profile_id: profileId2,
        action: 1, // BoosterAction.LIKE
      },
    });

    const like2 = await this.userMatches.findOne({
      where: {
        user_id: userId2,
        profile_id: profileId1,
        action: 1, // BoosterAction.LIKE
      },
    });

    return !!(like1 && like2);
  }

  public async getMatchRows(userId: string, profileId: number): Promise<UserMatches[]> {
    return await this.userMatches.find({
      where: {
        user_id: userId,
        profile_id: profileId,
      },
    });
  }

  public createQueryBuilder(alias: string) {
    return this.userMatches.createQueryBuilder(alias);
  }
}
