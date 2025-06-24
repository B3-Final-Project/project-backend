import {
  GetMatchesResponse,
  GetPendingMatchesResponse,
  GetSentMatchesResponse,
  MatchActionResponseDto,
} from './dto/match-response.dto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { MatchRepository } from '../../common/repository/matches.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { BoosterAction } from '../booster/enums/action.enum';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get all mutual matches for a user
   */
  async getUserMatches(req: HttpRequestDto): Promise<GetMatchesResponse> {
    const userId = req.user.userId;
    this.logger.log('Fetching user matches', { userId });

    // Get the current user's profile ID
    let profileId: number;
    try {
      const currentUser = await this.userRepository.findUserWithProfile(userId);
      profileId = currentUser.profile.id;
    } catch (e) {
      this.logger.error('Error fetching user matches', {
        userId,
        error: e.message,
      });
      if (e instanceof NotFoundException) {
        return { matches: [] };
      }
      throw e;
    }

    const matches = await this.profileRepository.findMatchedProfiles(profileId);
    this.logger.log('User matches fetched', {
      userId,
      profileId,
      matchCount: matches.length,
    });

    return {
      matches,
    };
  }

  /**
   * Get profiles that liked you but you haven't responded to yet
   */
  async getPendingMatches(
    req: HttpRequestDto,
  ): Promise<GetPendingMatchesResponse> {
    const userId = req.user.userId;
    this.logger.log('Fetching pending matches', { userId });

    // Get the current user's profile ID
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Get profile IDs of profiles who liked us but we haven't responded to
    const profileIds =
      await this.matchRepository.getPendingLikeProfileIds(ourProfileId);

    if (profileIds.length === 0) {
      this.logger.log('No pending matches found', { userId, ourProfileId });
      return { matches: [] };
    }

    // Fetch the actual profiles
    const matches = await this.profileRepository.findByProfileIds(profileIds);
    this.logger.log('Pending matches fetched', {
      userId,
      ourProfileId,
      pendingCount: matches.length,
    });

    return {
      matches,
    };
  }

  /**
   * Get profiles you liked but haven't heard back from
   */
  async getSentLikes(req: HttpRequestDto): Promise<GetSentMatchesResponse> {
    const userId = req.user.userId;
    this.logger.log('Fetching sent likes', { userId });

    // Get the current user's profile ID
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const fromProfileId = currentUser.profile.id;

    // Get profile IDs of profiles we liked but they haven't liked us back
    const profileIds =
      await this.matchRepository.getSentLikeProfileIds(fromProfileId);

    if (profileIds.length === 0) {
      this.logger.log('No sent likes found', { userId, fromProfileId });
      return { matches: [] };
    }

    // Fetch the actual profiles
    const matches = await this.profileRepository.findByProfileIds(profileIds);
    this.logger.log('Sent likes fetched', {
      userId,
      fromProfileId,
      sentLikesCount: matches.length,
    });

    return {
      matches,
    };
  }

  /**
   * Get match details for a specific profile
   */
  async getMatchDetails(req: HttpRequestDto, profileId: number): Promise<any> {
    const userId = req.user.userId;
    this.logger.log('Fetching match details', {
      userId,
      targetProfileId: profileId,
    });

    // Get the current user's profile
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Get the target profile
    const targetProfile = await this.profileRepository.findByProfileId(
      profileId,
      ['userProfile'],
    );

    // Get our actions towards this profile
    const ourActions = await this.matchRepository.getMatchRows(
      ourProfileId,
      profileId,
    );

    // Get their actions towards our profile
    const theirActions = await this.matchRepository.getMatchRows(
      profileId,
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

    this.logger.log('Match details fetched', {
      userId,
      targetProfileId: profileId,
      ourProfileId,
      isMatch,
      weLikedThem,
      theyLikedUs,
    });

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
  ): Promise<MatchActionResponseDto> {
    const userId = req.user.userId;
    this.logger.log('User liking profile', {
      userId,
      targetProfileId: profileId,
    });

    // Get the current user's profile
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Check if already liked/matched
    if (
      await this.matchRepository.hasProcessedProfile(ourProfileId, profileId)
    ) {
      this.logger.log('Profile already processed', {
        userId,
        ourProfileId,
        targetProfileId: profileId,
      });
      return { matched: false }; // Already processed
    }

    // Create the like record
    const match = new UserMatches();
    match.from_profile_id = ourProfileId;
    match.to_profile_id = profileId;
    match.action = BoosterAction.LIKE;

    await this.matchRepository.save([match]);
    this.logger.log('Like action saved', {
      userId,
      ourProfileId,
      targetProfileId: profileId,
    });

    // Check if it's a mutual match
    const hasLikedUsBack = await this.matchRepository.checkMutualLike(
      ourProfileId,
      profileId,
    );

    if (hasLikedUsBack) {
      this.logger.log('Mutual match detected!', {
        userId,
        ourProfileId,
        targetProfileId: profileId,
      });

      const matchRecord1 = new UserMatches();
      matchRecord1.from_profile_id = ourProfileId;
      matchRecord1.to_profile_id = profileId;
      matchRecord1.action = BoosterAction.MATCH;

      const matchRecord2 = new UserMatches();
      matchRecord2.from_profile_id = profileId;
      matchRecord2.to_profile_id = ourProfileId;
      matchRecord2.action = BoosterAction.MATCH;

      await this.matchRepository.save([matchRecord1, matchRecord2]);
      this.logger.log('Match records created', {
        userId,
        ourProfileId,
        targetProfileId: profileId,
      });
      return { matched: true };
    }

    this.logger.log('Like sent, waiting for response', {
      userId,
      ourProfileId,
      targetProfileId: profileId,
    });
    return { matched: false };
  }

  /**
   * Pass/reject a profile
   */
  async passProfile(req: HttpRequestDto, profileId: number): Promise<void> {
    const userId = req.user.userId;
    this.logger.log('User passing profile', {
      userId,
      targetProfileId: profileId,
    });

    // Get the current user's profile
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const ourProfileId = currentUser.profile.id;

    // Check if already processed
    if (
      await this.matchRepository.hasProcessedProfile(ourProfileId, profileId)
    ) {
      this.logger.log('Profile already processed (pass)', {
        userId,
        ourProfileId,
        targetProfileId: profileId,
      });
      return;
    }

    // Create the seen record (pass = just mark as seen)
    const match = new UserMatches();
    match.from_profile_id = ourProfileId;
    match.to_profile_id = profileId;
    match.action = BoosterAction.SEEN;

    await this.matchRepository.save([match]);
    this.logger.log('Pass action saved', {
      userId,
      ourProfileId,
      targetProfileId: profileId,
    });
  }
}
