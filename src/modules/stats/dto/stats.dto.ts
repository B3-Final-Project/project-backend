import { ApiProperty } from '@nestjs/swagger';

export class AppStatsDto {
  @ApiProperty({ example: 1250, description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ example: 3450, description: 'Total number of matches' })
  totalMatches: number;

  @ApiProperty({
    example: 15680,
    description: 'Total number of passes (seen but not liked)',
  })
  totalPasses: number;

  @ApiProperty({ example: 8920, description: 'Total number of likes' })
  totalLikes: number;
}

export class BoosterStatsDto {
  @ApiProperty({ example: 1, description: 'Booster pack ID' })
  boosterId: number;

  @ApiProperty({ example: 'Super Pack', description: 'Booster pack name' })
  boosterName: string;

  @ApiProperty({ example: 'CASUAL', description: 'Booster pack type' })
  boosterType: string;

  @ApiProperty({
    example: 45,
    description: 'Number of times this booster was opened',
  })
  timesOpened: number;
}

export class DetailedStatsDto {
  @ApiProperty({
    type: AppStatsDto,
    description: 'General application statistics',
  })
  appStats: AppStatsDto;

  @ApiProperty({
    type: [BoosterStatsDto],
    description: 'Statistics per booster pack type',
  })
  boosterStats: BoosterStatsDto[];
}

export class UserDemographicsDto {
  @ApiProperty({ example: 65, description: 'Percentage of male users' })
  malePercentage: number;

  @ApiProperty({ example: 35, description: 'Percentage of female users' })
  femalePercentage: number;

  @ApiProperty({ example: 5, description: 'Percentage of non-binary users' })
  nonBinaryPercentage: number;

  @ApiProperty({
    example: 1000,
    description: 'Total number of users in demographics',
  })
  otherPercentage: number;

  @ApiProperty({ example: 25.5, description: 'Average age of all users' })
  averageAge: number;

  @ApiProperty({
    example: { '18-25': 45, '26-35': 35, '36-45': 15, '45+': 5 },
    description: 'Age distribution by ranges',
  })
  ageDistribution: Record<string, number>;
}

export class EngagementStatsDto {
  @ApiProperty({ example: 15.5, description: 'Average likes per user' })
  averageLikesPerUser: number;

  @ApiProperty({ example: 8.2, description: 'Average matches per user' })
  averageMatchesPerUser: number;

  @ApiProperty({
    example: 0.24,
    description: 'Match rate (matches/likes ratio)',
  })
  matchRate: number;

  @ApiProperty({
    example: 1250,
    description: 'Daily active users (users with activity in last 24h)',
  })
  dailyActiveUsers: number;

  @ApiProperty({
    example: 3450,
    description: 'Weekly active users (users with activity in last 7 days)',
  })
  weeklyActiveUsers: number;

  @ApiProperty({
    example: 8500,
    description: 'Monthly active users (users with activity in last 30 days)',
  })
  monthlyActiveUsers: number;
}

export class GeographicStatsDto {
  @ApiProperty({ example: 'Paris', description: 'City with most users' })
  topCity: string;

  @ApiProperty({ example: 450, description: 'Number of users in top city' })
  topCityUserCount: number;

  @ApiProperty({
    example: [
      { city: 'Paris', count: 450 },
      { city: 'Lyon', count: 320 },
    ],
    description: 'Top 10 cities by user count',
  })
  topCities: Array<{ city: string; count: number }>;
}

export class RelationshipGoalsStatsDto {
  @ApiProperty({
    example: {
      CASUAL: 35,
      LONG_TERM: 40,
      MARRIAGE: 15,
      FRIENDSHIP: 8,
      UNSURE: 2,
    },
    description: 'Distribution of relationship goals',
  })
  relationshipGoalsDistribution: Record<string, number>;
}

export class ActivityStatsDto {
  @ApiProperty({ example: 125, description: 'New users registered today' })
  newUsersToday: number;

  @ApiProperty({ example: 850, description: 'New users registered this week' })
  newUsersThisWeek: number;

  @ApiProperty({
    example: 3200,
    description: 'New users registered this month',
  })
  newUsersThisMonth: number;

  @ApiProperty({ example: 2500, description: 'Profiles viewed today' })
  profileViewsToday: number;

  @ApiProperty({ example: 18500, description: 'Profiles viewed this week' })
  profileViewsThisWeek: number;

  @ApiProperty({ example: 78000, description: 'Profiles viewed this month' })
  profileViewsThisMonth: number;
}

export class SuccessMetricsDto {
  @ApiProperty({
    example: 0.24,
    description: 'Match success rate (matches/likes ratio)',
  })
  matchSuccessRate: number;

  @ApiProperty({
    example: 15.5,
    description: 'Average matches per active user',
  })
  averageMatchesPerActiveUser: number;
}

export class ComprehensiveStatsDto {
  @ApiProperty({ type: AppStatsDto })
  appStats: AppStatsDto;

  @ApiProperty({ type: [BoosterStatsDto] })
  boosterStats: BoosterStatsDto[];

  @ApiProperty({ type: UserDemographicsDto })
  demographics: UserDemographicsDto;

  @ApiProperty({ type: EngagementStatsDto })
  engagement: EngagementStatsDto;

  @ApiProperty({ type: GeographicStatsDto })
  geographic: GeographicStatsDto;

  @ApiProperty({ type: RelationshipGoalsStatsDto })
  relationshipGoals: RelationshipGoalsStatsDto;

  @ApiProperty({ type: ActivityStatsDto })
  activity: ActivityStatsDto;

  @ApiProperty({ type: SuccessMetricsDto })
  successMetrics: SuccessMetricsDto;
}
