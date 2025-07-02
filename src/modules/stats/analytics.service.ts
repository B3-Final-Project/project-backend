import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoosterUsage } from '../../common/entities/booster-usage.entity';
import { BoosterAction } from '../booster/enums/action.enum';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(BoosterUsage)
    private readonly boosterUsageRepository: Repository<BoosterUsage>,
  ) {}

  /**
   * Track when a user opens a booster pack
   * This directly inserts to the database for immediate availability in stats
   */
  async trackBoosterUsage(
    userId: number,
    boosterPackId: number,
  ): Promise<void> {
    try {
      const boosterUsage = this.boosterUsageRepository.create({
        userId,
        boosterPackId,
        usedAt: new Date(),
      });

      await this.boosterUsageRepository.save(boosterUsage);

      this.logger.log('Booster usage tracked', {
        userId,
        boosterPackId,
      });
    } catch (error) {
      this.logger.error('Failed to track booster usage', {
        userId,
        boosterPackId,
        error: error.message,
      });
      // Don't throw - analytics failure shouldn't break user experience
    }
  }

  /**
   * Log user actions for monitoring (UserMatches table already handles persistence)
   * This is just for additional logging/monitoring, the actual data comes from UserMatches
   */
  async trackUserAction(
    fromProfileId: number,
    toProfileId: number,
    action: BoosterAction,
  ): Promise<void> {
    try {
      this.logger.log('User action', {
        fromProfileId,
        toProfileId,
        action: BoosterAction[action],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to log user action', {
        fromProfileId,
        toProfileId,
        action,
        error: error.message,
      });
      // Don't throw - logging failure shouldn't break user experience
    }
  }
}
