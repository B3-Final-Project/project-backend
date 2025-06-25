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
import { UserRepository } from '../../common/repository/user.repository';

@Injectable()
export class StatsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly matchRepository: MatchRepository,
    private readonly boosterRepository: BoosterRepository,
    private readonly boosterUsageRepository: BoosterUsageRepository,
  ) {}

  async getAppStats(): Promise<AppStatsDto> {
    // Get total users count
    const [totalUsers, totalMatches, totalPasses, totalLikes] = await Promise.all([
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
    // Get all booster packs
    const boosterPacks = await this.boosterRepository.findAll();

    const boosterStats: BoosterStatsDto[] = [];

    for (const booster of boosterPacks) {
      // Count how many times this specific booster was used
      const timesOpened = await this.boosterUsageRepository.count({
        where: { boosterPackId: booster.id },
      });

      // Convert enum to string
      let boosterType: string;
      switch (booster.type) {
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

      boosterStats.push({
        boosterId: booster.id,
        boosterName: booster.name,
        boosterType,
        timesOpened,
      });
    }

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
    }); // Assuming 1 = male
    const femaleCount = await this.userRepository.count({
      where: { gender: GenderEnum.FEMALE },
    }); // Assuming 2 = female
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
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.age)', 'averageAge')
      .getRawOne();

    const averageAge = parseFloat(result?.averageAge) || 0;

    // Get age distribution
    const ageRanges = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `SUM(CASE WHEN age BETWEEN 18 AND 25 THEN 1 ELSE 0 END) as "range18_25"`,
        `SUM(CASE WHEN age BETWEEN 26 AND 35 THEN 1 ELSE 0 END) as "range26_35"`,
        `SUM(CASE WHEN age BETWEEN 36 AND 45 THEN 1 ELSE 0 END) as "range36_45"`,
        `SUM(CASE WHEN age > 45 THEN 1 ELSE 0 END) as "range45Plus"`,
      ])
      .getRawOne();

    const ageDistribution = {
      '18-25': parseInt(ageRanges?.range18_25) || 0,
      '26-35': parseInt(ageRanges?.range26_35) || 0,
      '36-45': parseInt(ageRanges?.range36_45) || 0,
      '45+': parseInt(ageRanges?.range45Plus) || 0,
    };

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

    const dailyActiveUsers = await this.matchRepository
      .createQueryBuilder('match')
      .select('COUNT(DISTINCT match.from_profile_id)', 'count')
      .where('match.created_at >= :yesterday', { yesterday })
      .getRawOne()
      .then((result) => parseInt(result?.count) || 0);

    const weeklyActiveUsers = await this.matchRepository
      .createQueryBuilder('match')
      .select('COUNT(DISTINCT match.from_profile_id)', 'count')
      .where('match.created_at >= :weekAgo', { weekAgo })
      .getRawOne()
      .then((result) => parseInt(result?.count) || 0);

    const monthlyActiveUsers = await this.matchRepository
      .createQueryBuilder('match')
      .select('COUNT(DISTINCT match.from_profile_id)', 'count')
      .where('match.created_at >= :monthAgo', { monthAgo })
      .getRawOne()
      .then((result) => parseInt(result?.count) || 0);

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
    const cityStats = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .select('profile.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('profile.city IS NOT NULL')
      .andWhere('profile.city != :empty', { empty: '' })
      .groupBy('profile.city')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

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
    const totalProfiles = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .where('profile.id IS NOT NULL')
      .getCount();

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
    const relationshipCounts = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.profile', 'profile')
      .select([
        `SUM(CASE WHEN profile.relationship_type = ${RelationshipTypeEnum.CASUAL} THEN 1 ELSE 0 END) as "casual"`,
        `SUM(CASE WHEN profile.relationship_type = ${RelationshipTypeEnum.LONG_TERM} THEN 1 ELSE 0 END) as "longTerm"`,
        `SUM(CASE WHEN profile.relationship_type = ${RelationshipTypeEnum.MARRIAGE} THEN 1 ELSE 0 END) as "marriage"`,
        `SUM(CASE WHEN profile.relationship_type = ${RelationshipTypeEnum.FRIENDSHIP} THEN 1 ELSE 0 END) as "friendship"`,
        `SUM(CASE WHEN profile.relationship_type = ${RelationshipTypeEnum.UNSURE} THEN 1 ELSE 0 END) as "unsure"`,
      ])
      .where('profile.id IS NOT NULL')
      .getRawOne();

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
