import { BoosterAction } from '../booster/enums/action.enum';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { Injectable } from '@nestjs/common';
import { MatchRepository } from '../../common/repository/matches.repository';
import { MatchResponseDto } from './dto/match-response.dto';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get all mutual matches for a user
   */
  async getUserMatches(req: HttpRequestDto): Promise<Profile[]> {
    const userId = req.user.userId;
    return this.profileRepository.findMatchedProfiles(userId);
  }

  /**
   * Get profiles that liked you but you haven't responded to yet
   */
  async getPendingMatches(req: HttpRequestDto): Promise<Profile[]> {
    const userId = req.user.userId;

    // Get the current user's profile ID
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Find profiles of users who liked us but we haven't responded to
    const pendingLikes = await this.matchRepository
      .createQueryBuilder('um')
      .innerJoin('profiles', 'p', 'p.id = um.profile_id')
      .innerJoin('users', 'u', 'u.profile_id = p.id')
      .leftJoin(
        'user_matches',
        'our_response',
        'our_response.user_id = :userId AND our_response.profile_id = p.id',
      )
      .where('um.profile_id = :ourProfileId')
      .andWhere('um.action = :likeAction')
      .andWhere('our_response.id IS NULL') // We haven't responded
      .setParameters({
        userId,
        ourProfileId,
        likeAction: BoosterAction.LIKE,
      })
      .getRawMany();

    // Get the profile IDs of users who liked us
    const profileIds = pendingLikes.map((like) => like.um_profile_id);

    if (profileIds.length === 0) {
      return [];
    }

    // Fetch the actual profiles
    return await this.profileRepository
      .createQueryBuilder('p')
      .innerJoin('p.userProfile', 'u')
      .where('u.user_id IN (:...userIds)', {
        userIds: pendingLikes.map((like) => like.u_user_id),
      })
      .getMany();
  }

  /**
   * Get profiles you liked but haven't heard back from
   */
  async getSentLikes(req: HttpRequestDto): Promise<Profile[]> {
    const userId = req.user.userId;

    // Find profiles we liked but they haven't liked us back
    const sentLikes = await this.matchRepository
      .createQueryBuilder('um')
      .innerJoin('profiles', 'p', 'p.id = um.profile_id')
      .innerJoin('users', 'u', 'u.profile_id = p.id')
      .leftJoin(
        'user_matches',
        'their_response',
        'their_response.user_id = u.user_id AND their_response.action = :likeAction',
      )
      .leftJoin('users', 'our_user', 'our_user.user_id = :userId')
      .leftJoin(
        'profiles',
        'our_profile',
        'our_profile.id = our_user.profile_id',
      )
      .where('um.user_id = :userId')
      .andWhere('um.action = :likeAction')
      .andWhere(
        '(their_response.profile_id IS NULL OR their_response.profile_id != our_profile.id)',
      )
      .setParameters({
        userId,
        likeAction: BoosterAction.LIKE,
      })
      .getRawMany();

    const profileIds = sentLikes.map((like) => like.um_profile_id);

    if (profileIds.length === 0) {
      return [];
    }

    // Fetch the actual profiles
    return await this.profileRepository
      .createQueryBuilder('p')
      .where('p.id IN (:...profileIds)', { profileIds })
      .getMany();
  }

  /**
   * Get match details for a specific profile
   */
  async getMatchDetails(req: HttpRequestDto, profileId: number): Promise<any> {
    const userId = req.user.userId;

    // Get the current user's profile
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Get the target profile
    const targetProfile = await this.profileRepository.findByProfileId(
      profileId,
      ['userProfile'],
    );
    const targetUserId = targetProfile.userProfile.user_id;

    // Get our actions towards this profile
    const ourActions = await this.matchRepository.getMatchRows(
      userId,
      profileId,
    );

    // Get their actions towards our profile
    const theirActions = await this.matchRepository.getMatchRows(
      targetUserId,
      ourProfileId,
    );

    // Determine match status
    const weLikedThem = ourActions.some(
      (action) => action.action === BoosterAction.LIKE,
    );
    const theyLikedUs = theirActions.some(
      (action) => action.action === BoosterAction.LIKE,
    );
    const isMatch = weLikedThem && theyLikedUs;

    return {
      profile: targetProfile,
      matchStatus: {
        isMatch,
        weLikedThem,
        theyLikedUs,
        ourActions: ourActions.map((action) => action.action),
        theirActions: theirActions.map((action) => action.action),
      },
    };
  }

  /**
   * Like a profile
   */
  async likeProfile(
    req: HttpRequestDto,
    profileId: number,
  ): Promise<MatchResponseDto> {
    const userId = req.user.userId;

    // Check if already liked/matched
    const existingMatch = await this.matchRepository.getMatchRows(
      userId,
      profileId,
    );
    if (existingMatch.length > 0) {
      return { matched: false }; // Already processed
    }

    // Create the like record
    const match = new UserMatches();
    match.user_id = userId;
    match.profile_id = profileId;
    match.action = BoosterAction.LIKE;

    await this.matchRepository.save([match]);

    // Check if it's a mutual match
    const targetProfile =
      await this.profileRepository.findByProfileId(profileId);
    const targetUserId = targetProfile?.userProfile?.user_id;

    if (targetUserId) {
      // Get the current user's profile to check if the target user liked us back
      const currentUser = await this.userRepository.findUserWithProfile(userId);
      const ourProfileId = currentUser.profile.id;

      const theirMatch = await this.matchRepository.getMatchRows(
        targetUserId,
        ourProfileId,
      );
      const hasLikedUsBack = theirMatch.some(
        (m) => m.action === BoosterAction.LIKE,
      );

      if (hasLikedUsBack) {
        // It's a match! Optionally create MATCH records for both users
        const matchRecord1 = new UserMatches();
        matchRecord1.user_id = userId;
        matchRecord1.profile_id = profileId;
        matchRecord1.action = BoosterAction.MATCH;

        const matchRecord2 = new UserMatches();
        matchRecord2.user_id = targetUserId;
        matchRecord2.profile_id = ourProfileId;
        matchRecord2.action = BoosterAction.MATCH;

        await this.matchRepository.save([matchRecord1, matchRecord2]);
        return { matched: true };
      }
    }

    return { matched: false };
  }

  /**
   * Pass/reject a profile
   */
  async passProfile(req: HttpRequestDto, profileId: number): Promise<void> {
    const userId = req.user.userId;

    // Check if already processed
    const existingMatch = await this.matchRepository.getMatchRows(
      userId,
      profileId,
    );
    if (existingMatch.length > 0) {
      return; // Already processed
    }

    // Create the seen record (pass = just mark as seen)
    const match = new UserMatches();
    match.user_id = userId;
    match.profile_id = profileId;
    match.action = BoosterAction.SEEN;

    await this.matchRepository.save([match]);
  }
}
