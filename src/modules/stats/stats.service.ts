import {
  ActivityStatsDto,
  AppStatsDto,
  BoosterStatsDto,
  ComprehensiveStatsDto,
  DetailedStatsDto,
  EngagementStatsDto,
  GeographicStatsDto,
  RelationshipGoalsStatsDto,
  SuccessMetricsDto,
  UserDemographicsDto,
} from './dto/stats.dto';
import { GenderEnum, RelationshipTypeEnum } from '../profile/enums';

import { BoosterAction } from '../booster/enums/action.enum';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterUsageRepository } from '../../common/repository/booster-usage.repository';
import { Injectable } from '@nestjs/common';
import { MatchRepository } from '../../common/repository/matches.repository';
import { MoreThanOrEqual } from 'typeorm';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { UserRepository } from '../../common/repository/user.repository';

@Injectable()
export class StatsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly matchRepository: MatchRepository,
    private readonly boosterRepository: BoosterRepository,
    private readonly boosterUsageRepository: BoosterUsageRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async getAppStats(): Promise<AppStatsDto> {
    // Get total users count
    const [totalUsers, totalMatches, totalPasses, totalLikes] =
      await Promise.all([
        this.userRepository.count(),
        this.matchRepository.count({ where: { action: BoosterAction.MATCH } }),
        this.matchRepository.count({ where: { action: BoosterAction.SEEN } }),
        this.matchRepository.count({ where: { action: BoosterAction.LIKE } }),
      ]);
    return {
      totalUsers,
      totalMatches,
      totalPasses,
      totalLikes,
    };
  }

  async getBoosterStats(): Promise<BoosterStatsDto[]> {
    // Get booster usage stats by relationship type from user profiles
    const relationshipStats =
      await this.userRepository.getBoosterUsageByRelationshipType();

    const boosterStats: BoosterStatsDto[] = [
      RelationshipTypeEnum.CASUAL,
      RelationshipTypeEnum.LONG_TERM,
      RelationshipTypeEnum.MARRIAGE,
      RelationshipTypeEnum.FRIENDSHIP,
      RelationshipTypeEnum.UNSURE,
    ].map((type) => {
      const stat = relationshipStats.find((s) => parseInt(s.type) === type);
      const timesOpened = stat ? parseInt(stat.timesOpened) : 0;

      let boosterType: string;
      switch (type) {
        case RelationshipTypeEnum.CASUAL:
          boosterType = 'CASUAL';
          break;
        case RelationshipTypeEnum.LONG_TERM:
          boosterType = 'LONG_TERM';
          break;
        case RelationshipTypeEnum.MARRIAGE:
          boosterType = 'MARRIAGE';
          break;
        case RelationshipTypeEnum.FRIENDSHIP:
          boosterType = 'FRIENDSHIP';
          break;
        case RelationshipTypeEnum.UNSURE:
          boosterType = 'UNSURE';
          break;
        default:
          boosterType = 'UNKNOWN';
      }

      return {
        boosterId: type, // Use the enum value as ID
        boosterName: boosterType,
        boosterType,
        timesOpened,
      };
    });

    return boosterStats;
  }

  async getDetailedStats(): Promise<DetailedStatsDto> {
    const appStats = await this.getAppStats();
    const boosterStats = await this.getBoosterStats();

    return {
      appStats,
      boosterStats,
    };
  }

  async getUsersCount(): Promise<number> {
    return this.userRepository.count();
  }

  async getMatchesCount(): Promise<number> {
    return this.matchRepository.count({
      where: { action: BoosterAction.MATCH },
    });
  }

  async getPassesCount(): Promise<number> {
    return this.matchRepository.count({
      where: { action: BoosterAction.SEEN },
    });
  }

  async getLikesCount(): Promise<number> {
    return this.matchRepository.count({
      where: { action: BoosterAction.LIKE },
    });
  }

  async getTotalBoosterUsage(): Promise<number> {
    return this.boosterUsageRepository.count();
  }

  async getUserDemographics(): Promise<UserDemographicsDto> {
    const totalUsers = await this.userRepository.count();

    // Get gender distribution
    const maleCount = await this.userRepository.count({
      where: { gender: GenderEnum.MALE },
    });
    const femaleCount = await this.userRepository.count({
      where: { gender: GenderEnum.FEMALE },
    });
    const nonBinaryCount = await this.userRepository.count({
      where: { gender: GenderEnum.NON_BINARY },
    });
    const otherCount = await this.userRepository.count({
      where: { gender: GenderEnum.OTHER },
    });

    const malePercentage =
      totalUsers > 0 ? Math.round((maleCount / totalUsers) * 100) : 0;
    const femalePercentage =
      totalUsers > 0 ? Math.round((femaleCount / totalUsers) * 100) : 0;
    const nonBinaryPercentage =
      totalUsers > 0 ? Math.round((nonBinaryCount / totalUsers) * 100) : 0;
    const otherPercentage =
      totalUsers > 0 ? Math.round((otherCount / totalUsers) * 100) : 0;

    // Get average age
    const averageAge = await this.userRepository.getAverageAge();

    // Get age distribution
    const ageDistribution = await this.userRepository.getAgeDistribution();

    return {
      malePercentage,
      femalePercentage,
      nonBinaryPercentage,
      otherPercentage,
      averageAge: Math.round(averageAge * 100) / 100,
      ageDistribution,
    };
  }

  async getEngagementStats(): Promise<EngagementStatsDto> {
    const totalUsers = await this.userRepository.count();
    const totalLikes = await this.matchRepository.count({
      where: { action: BoosterAction.LIKE },
    });
    const totalMatches = await this.matchRepository.count({
      where: { action: BoosterAction.MATCH },
    });

    const averageLikesPerUser =
      totalUsers > 0 ? Math.round((totalLikes / totalUsers) * 100) / 100 : 0;
    const averageMatchesPerUser =
      totalUsers > 0 ? Math.round((totalMatches / totalUsers) * 100) / 100 : 0;
    const matchRate =
      totalLikes > 0
        ? Math.round((totalMatches / totalLikes) * 10000) / 10000
        : 0;

    // Calculate active users (users with recent activity)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyActiveUsers =
      await this.matchRepository.getActiveUsersCount(yesterday);
    const weeklyActiveUsers =
      await this.matchRepository.getActiveUsersCount(weekAgo);
    const monthlyActiveUsers =
      await this.matchRepository.getActiveUsersCount(monthAgo);

    return {
      averageLikesPerUser,
      averageMatchesPerUser,
      matchRate,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
    };
  }

  async getActivityStats(): Promise<ActivityStatsDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // New users using MoreThanOrEqual for cleaner syntax
    const newUsersToday = await this.userRepository.count({
      where: { created_at: MoreThanOrEqual(today) },
    });

    const newUsersThisWeek = await this.userRepository.count({
      where: { created_at: MoreThanOrEqual(weekAgo) },
    });

    const newUsersThisMonth = await this.userRepository.count({
      where: { created_at: MoreThanOrEqual(monthAgo) },
    });

    // Profile views (using matches as proxy for views)
    const profileViewsToday = await this.matchRepository.count({
      where: { created_at: MoreThanOrEqual(today) },
    });

    const profileViewsThisWeek = await this.matchRepository.count({
      where: { created_at: MoreThanOrEqual(weekAgo) },
    });

    const profileViewsThisMonth = await this.matchRepository.count({
      where: { created_at: MoreThanOrEqual(monthAgo) },
    });

    return {
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      profileViewsToday,
      profileViewsThisWeek,
      profileViewsThisMonth,
    };
  }

  async getGeographicStats(): Promise<GeographicStatsDto> {
    // Get city statistics from user profiles
    const cityStats = await this.profileRepository.getLocations();

    if (cityStats.length === 0) {
      return {
        topCity: 'Data not available',
        topCityUserCount: 0,
        topCities: [],
      };
    }

    const topCity = cityStats[0].city;
    const topCityUserCount = parseInt(cityStats[0].count);
    const topCities = cityStats.map((stat) => ({
      city: stat.city,
      count: parseInt(stat.count),
    }));

    return {
      topCity,
      topCityUserCount,
      topCities,
    };
  }

  async getComprehensiveStats(): Promise<ComprehensiveStatsDto> {
    const [
      appStats,
      boosterStats,
      demographics,
      engagement,
      activity,
      geographic,
    ] = await Promise.all([
      this.getAppStats(),
      this.getBoosterStats(),
      this.getUserDemographics(),
      this.getEngagementStats(),
      this.getActivityStats(),
      this.getGeographicStats(),
    ]);

    // Get actual relationship goals distribution from user profiles
    const relationshipGoals: RelationshipGoalsStatsDto = {
      relationshipGoalsDistribution:
        await this.getRelationshipGoalsDistribution(),
    };

    // Calculate success metrics from actual database data
    const successMetrics: SuccessMetricsDto = {
      matchSuccessRate: engagement.matchRate, // Reuse the calculated match rate
      averageMatchesPerActiveUser: engagement.averageMatchesPerUser, // Reuse from engagement stats
    };

    return {
      appStats,
      boosterStats,
      demographics,
      engagement,
      geographic,
      relationshipGoals,
      activity,
      successMetrics,
    };
  }

  /**
   * Get relationship goals distribution from actual user profiles
   */
  private async getRelationshipGoalsDistribution(): Promise<
    Record<string, number>
  > {
    const totalProfiles =
      await this.userRepository.getProfilesCountWithRelationshipType();

    if (totalProfiles === 0) {
      return {
        CASUAL: 0,
        LONG_TERM: 0,
        MARRIAGE: 0,
        FRIENDSHIP: 0,
        UNSURE: 0,
      };
    }

    // Get counts for each relationship type
    const relationshipCounts =
      await this.userRepository.getRelationshipTypeDistribution();

    return {
      CASUAL: Math.round(
        ((parseInt(relationshipCounts?.casual) || 0) / totalProfiles) * 100,
      ),
      LONG_TERM: Math.round(
        ((parseInt(relationshipCounts?.longTerm) || 0) / totalProfiles) * 100,
      ),
      MARRIAGE: Math.round(
        ((parseInt(relationshipCounts?.marriage) || 0) / totalProfiles) * 100,
      ),
      FRIENDSHIP: Math.round(
        ((parseInt(relationshipCounts?.friendship) || 0) / totalProfiles) * 100,
      ),
      UNSURE: Math.round(
        ((parseInt(relationshipCounts?.unsure) || 0) / totalProfiles) * 100,
      ),
    };
  }
}
