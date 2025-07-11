import { MatchActionResponseDto } from './dto/match-response.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AnalyticsService } from '../stats/analytics.service';
import { BoosterAction } from '../booster/enums/action.enum';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchRepository } from '../../common/repository/matches.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { Profile } from '../../common/entities/profile.entity';
import { User } from '../../common/entities/user.entity';
import { MessagesService } from '../messages/messages.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CreateConversationDto } from '../messages/dto/create-conversation.dto';

// Constantes pour éliminer les magic strings
const MATCH_ACTION_TYPES = {
  LIKE: 'like',
  PASS: 'pass',
} as const;

const MATCH_ERROR_TYPES = {
  LIKE: 'like',
  PASS: 'pass',
} as const;

const MATCH_MESSAGES = {
  MATCH_SUCCESS: "It's a match! Both users liked each other.",
  LIKE_SENT: 'Like sent, waiting for response.',
  PROFILE_ALREADY_PROCESSED_PASS: 'Profile already processed (pass)',
  PROFILE_PASSED: 'Profile passed/seen.',
  LIKE_ERROR: "Une erreur s'est produite lors de l'envoi du like.",
  PASS_ERROR: "Une erreur s'est produite lors du passage du profil.",
} as const;

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly userRepository: UserRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  /**
   * Helper method to convert profiles to Users
   */
  private convertProfilesToUsers(profiles: Profile[]): User[] {
    return profiles
      .map((profile) => profile.userProfile)
      .filter((user): user is User => user !== null && user !== undefined);
  }

  /**
   * Helper method to get users from profile IDs
   */
  private async getProfilesAsUsers(profileIds: number[]): Promise<User[]> {
    if (profileIds.length === 0) {
      return [];
    }

    // Get profiles with userProfile relation in one query
    const profiles =
      await this.profileRepository.findByProfileIdsWithUsers(profileIds);

    return this.convertProfilesToUsers(profiles);
  }

  /**
   * Get all mutual matches for a user
   */
  async getUserMatches(req: HttpRequestDto): Promise<User[]> {
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
        return [];
      }
      throw e;
    }

    const matches =
      await this.profileRepository.findMatchedProfilesWithUsers(profileId);
    this.logger.log('User matches fetched', {
      userId,
      profileId,
      matchCount: matches.length,
    });

    return this.convertProfilesToUsers(matches);
  }

  /**
   * Get profiles that liked you but you haven't responded to yet
   */
  async getPendingMatches(req: HttpRequestDto): Promise<User[]> {
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
      return [];
    }

    // Fetch the actual users from the profiles
    const matches = await this.getProfilesAsUsers(profileIds);
    this.logger.log('Pending matches fetched', {
      userId,
      ourProfileId,
      pendingCount: matches.length,
    });

    return matches;
  }

  /**
   * Get profiles you liked but haven't heard back from
   */
  async getSentLikes(req: HttpRequestDto): Promise<User[]> {
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
      return [];
    }

    // Fetch the actual users from the profiles
    const matches = await this.getProfilesAsUsers(profileIds);
    this.logger.log('Sent likes fetched', {
      userId,
      fromProfileId,
      sentLikesCount: matches.length,
    });

    return matches;
  }

  /**
   * Create a conversation between two users when they match
   */
  private async createMatchConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<any> {
    try {
      const createConversationDto: CreateConversationDto = {
        user2_id: user2Id,
      };

      // Create conversation using the first user's context
      const conversation = await this.messagesService.createConversation(
        createConversationDto,
        {
          user: {
            userId: user1Id,
            groups: [],
          },
        },
      );

      this.logger.log('Conversation created for match', {
        user1Id,
        user2Id,
        conversationId: conversation.id,
      });

      return conversation;
    } catch (error) {
      this.logger.error('Error creating conversation for match', {
        user1Id,
        user2Id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Notify users about a new match via WebSocket
   */
  private async notifyUsersAboutMatch(
    user1Id: string,
    user2Id: string,
    conversation: any,
  ): Promise<void> {
    try {
      // Récupérer les informations des profils pour enrichir les données du match
      const user1Profile =
        await this.userRepository.findUserWithProfile(user1Id);
      const user2Profile =
        await this.userRepository.findUserWithProfile(user2Id);

      // Créer les données enrichies pour chaque utilisateur
      const matchDataForUser1 = {
        type: 'match',
        conversation,
        matchedWith: {
          userId: user2Id,
          name: user2Profile.name || "Quelqu'un",
          avatar:
            user2Profile.profile.images?.[0] ||
            user2Profile.profile.avatarUrl ||
            '/vintage.png',
          age: user2Profile.age || null,
        },
        timestamp: new Date(),
      };

      const matchDataForUser2 = {
        type: 'match',
        conversation,
        matchedWith: {
          userId: user1Id,
          name: user1Profile.name || "Quelqu'un",
          avatar:
            user1Profile.profile.images?.[0] ||
            user1Profile.profile.avatarUrl ||
            '/vintage.png',
          age: user1Profile.age || null,
        },
        timestamp: new Date(),
      };

      // Notify both users about the new match
      this.messagesGateway.emitToUser(user1Id, 'newMatch', matchDataForUser1);
      this.messagesGateway.emitToUser(user2Id, 'newMatch', matchDataForUser2);

      this.logger.log('Match notifications sent via WebSocket', {
        user1Id,
        user2Id,
        conversationId: conversation.id,
        user1Name: user1Profile.name,
        user2Name: user2Profile.name,
      });
    } catch (error) {
      this.logger.error('Error sending match notifications', {
        user1Id,
        user2Id,
        error: error.message,
      });
    }
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

    try {
      this.logger.log('User liking profile', {
        userId,
        targetProfileId: profileId,
      });

      // Get the current user's profile
      const currentUser = await this.userRepository.findUserWithProfile(userId);
      const ourProfileId = currentUser.profile.id;

      // Check for existing match (SEEN or LIKE)
      let match = await this.matchRepository.getMatchRow(
        ourProfileId,
        profileId,
      );
      // Always delete previous LIKE logs from this user to the target before saving a new LIKE
      await this.matchRepository.deleteLikesFromTo(ourProfileId, profileId);
      if (match) {
        if (match.action === BoosterAction.LIKE) {
          this.logger.log('Profile already liked', {
            userId,
            ourProfileId,
            targetProfileId: profileId,
          });
          return {
            success: false,
            message: 'Profile already liked',
            isMatch: false,
          };
        } else {
          // Update SEEN to LIKE
          match.action = BoosterAction.LIKE;
          match = (await this.matchRepository.save([match]))[0];
          this.logger.log('SEEN updated to LIKE', {
            userId,
            ourProfileId,
            targetProfileId: profileId,
          });
        }
      } else {
        // No match exists, create a LIKE match
        const newMatch = new UserMatches();
        newMatch.from_profile_id = ourProfileId;
        newMatch.to_profile_id = profileId;
        newMatch.action = BoosterAction.LIKE;
        await this.matchRepository.save([newMatch]);
        this.logger.log('Like action saved', {
          userId,
          ourProfileId,
          targetProfileId: profileId,
        });
      }

      // Track the like action for analytics
      await this.analyticsService.trackUserAction(
        ourProfileId,
        profileId,
        BoosterAction.LIKE,
      );

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

        // Remove previous LIKE logs for both users (cleanup)
        await this.matchRepository.deleteLikesFromTo(ourProfileId, profileId);
        await this.matchRepository.deleteLikesFromTo(profileId, ourProfileId);

        // Track the match actions for analytics
        await this.analyticsService.trackUserAction(
          ourProfileId,
          profileId,
          BoosterAction.MATCH,
        );
        await this.analyticsService.trackUserAction(
          profileId,
          ourProfileId,
          BoosterAction.MATCH,
        );

        // Création de la conversation et notification WebSocket
        const targetProfile = await this.profileRepository.findByProfileId(
          profileId,
          ['userProfile'],
        );
        const targetUserId = targetProfile.userProfile.user_id;

        let conversation;
        try {
          conversation = await this.createMatchConversation(
            userId,
            targetUserId,
          );
          await this.notifyUsersAboutMatch(userId, targetUserId, conversation);
          this.logger.log('Match conversation created and notifications sent', {
            userId,
            targetUserId,
            conversationId: conversation.id,
          });
        } catch (conversationError) {
          this.logger.error(
            'Error creating conversation or sending notifications',
            {
              userId,
              targetUserId,
              error: conversationError.message,
            },
          );
        }

        return {
          success: true,
          message: MATCH_MESSAGES.MATCH_SUCCESS,
          isMatch: true,
          matchId: undefined, // You can set a real matchId if you have one
          conversationId: conversation?.id,
        };
      }

      this.logger.log('Like sent, waiting for response', {
        userId,
        ourProfileId,
        targetProfileId: profileId,
      });

      // Émettre la notification d'action de match
      this.emitMatchActionNotification(userId, {
        type: MATCH_ACTION_TYPES.LIKE,
        matchId: profileId.toString(),
        isMatch: false,
      });

      return {
        success: true,
        message: MATCH_MESSAGES.LIKE_SENT,
        isMatch: false,
      };
    } catch (error) {
      this.logger.error('Error in likeProfile', {
        userId,
        profileId,
        error: error.message,
      });

      // Émettre la notification d'erreur
      this.emitMatchErrorNotification(userId, {
        type: MATCH_ERROR_TYPES.LIKE,
        message: MATCH_MESSAGES.LIKE_ERROR,
        matchId: profileId.toString(),
      });

      throw error;
    }
  }

  /**
   * Pass/reject a profile
   */
  async passProfile(
    req: HttpRequestDto,
    profileId: number,
  ): Promise<MatchActionResponseDto> {
    const userId = req.user.userId;

    try {
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

        // Émettre la notification d'action de match même si déjà traité
        this.emitMatchActionNotification(userId, {
          type: MATCH_ACTION_TYPES.PASS,
          matchId: profileId.toString(),
        });

        return {
          success: false,
          message: MATCH_MESSAGES.PROFILE_ALREADY_PROCESSED_PASS,
        };
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

      // Track the pass action for analytics
      await this.analyticsService.trackUserAction(
        ourProfileId,
        profileId,
        BoosterAction.SEEN,
      );

      // Émettre la notification d'action de match
      this.emitMatchActionNotification(userId, {
        type: MATCH_ACTION_TYPES.PASS,
        matchId: profileId.toString(),
      });

      return { success: true, message: MATCH_MESSAGES.PROFILE_PASSED };
    } catch (error) {
      this.logger.error('Error in passProfile', {
        userId,
        profileId,
        error: error.message,
      });

      // Émettre la notification d'erreur
      this.emitMatchErrorNotification(userId, {
        type: MATCH_ERROR_TYPES.PASS,
        message: MATCH_MESSAGES.PASS_ERROR,
        matchId: profileId.toString(),
      });

      throw error;
    }
  }

  // Méthode pour émettre une notification d'action de match
  emitMatchActionNotification(
    userId: string,
    actionData: { type: 'like' | 'pass'; matchId: string; isMatch?: boolean },
  ) {
    this.messagesGateway.emitToUser(userId, 'matchAction', actionData);
  }

  // Méthode pour émettre une notification d'erreur de match
  emitMatchErrorNotification(
    userId: string,
    errorData: { type: string; message: string; matchId?: string },
  ) {
    this.messagesGateway.emitToUser(userId, 'matchError', errorData);
  }
}
