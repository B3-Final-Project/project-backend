import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMatches } from '../entities/user-matches.entity';
import { Injectable } from '@nestjs/common';
import { BoosterAction } from '../../modules/booster/enums/action.enum';

@Injectable()
export class MatchRepository {
  public constructor(
    @InjectRepository(UserMatches)
    private readonly userMatches: Repository<UserMatches>,
  ) {}

  public async getSeenRows(fromProfileId: number) {
    const seenRows = await this.userMatches.find({
      where: { from_profile_id: fromProfileId },
    });

    return seenRows.map((row) => row.to_profile_id);
  }

  public async save(matches: UserMatches[]) {
    return await this.userMatches.save(matches);
  }

  public async getUserLikes(fromProfileId: number): Promise<UserMatches[]> {
    return await this.userMatches.find({
      where: {
        from_profile_id: fromProfileId,
        action: BoosterAction.LIKE,
      },
    });
  }

  public async isMatch(
    profileId1: number,
    profileId2: number,
  ): Promise<boolean> {
    const like1 = await this.userMatches.findOne({
      where: {
        from_profile_id: profileId1,
        to_profile_id: profileId2,
        action: 1, // BoosterAction.LIKE
      },
    });

    const like2 = await this.userMatches.findOne({
      where: {
        from_profile_id: profileId2,
        to_profile_id: profileId1,
        action: 1, // BoosterAction.LIKE
      },
    });

    return !!(like1 && like2);
  }

  public async getMatchRows(
    fromProfileId: number,
    toProfileId: number,
  ): Promise<UserMatches[]> {
    return await this.userMatches.find({
      where: {
        from_profile_id: fromProfileId,
        to_profile_id: toProfileId,
      },
    });
  }

  /**
   * Get profile IDs of profiles who liked our profile but we haven't responded to
   */
  public async getPendingLikeProfileIds(
    ourProfileId: number,
  ): Promise<number[]> {
    const pendingLikes = await this.userMatches
      .createQueryBuilder('um')
      .leftJoin(
        'matches',
        'our_response',
        'our_response.from_profile_id = :ourProfileId AND our_response.to_profile_id = um.from_profile_id',
      )
      .where('um.to_profile_id = :ourProfileId')
      .andWhere('um.action = :likeAction')
      .andWhere('our_response.id IS NULL')
      .setParameters({
        ourProfileId,
        likeAction: BoosterAction.LIKE,
      })
      .getRawMany();

    return pendingLikes.map((like) => like.um_from_profile_id);
  }

  /**
   * Get profile IDs of profiles we liked but they haven't liked us back
   */
  public async getSentLikeProfileIds(fromProfileId: number): Promise<number[]> {
    const sentLikes = await this.userMatches
      .createQueryBuilder('um')
      .leftJoin(
        'matches',
        'their_response',
        'their_response.from_profile_id = um.to_profile_id AND their_response.to_profile_id = :fromProfileId AND their_response.action = :likeAction',
      )
      .where('um.from_profile_id = :fromProfileId')
      .andWhere('um.action = :likeAction')
      .andWhere('their_response.id IS NULL')
      .setParameters({
        fromProfileId,
        likeAction: BoosterAction.LIKE,
      })
      .getRawMany();

    return sentLikes.map((like) => like.um_to_profile_id);
  }

  /**
   * Check if a profile has already processed another profile (liked, passed, etc.)
   */
  public async hasProcessedProfile(
    fromProfileId: number,
    toProfileId: number,
  ): Promise<boolean> {
    const existingMatch = await this.getMatchRows(fromProfileId, toProfileId);
    return existingMatch.length > 0;
  }

  /**
   * Check if there's a mutual like between two profiles
   */
  public async checkMutualLike(
    profileId1: number,
    profileId2: number,
  ): Promise<boolean> {
    const theirMatch = await this.getMatchRows(profileId2, profileId1);
    return theirMatch.some((m) => m.action === BoosterAction.LIKE);
  }
}
