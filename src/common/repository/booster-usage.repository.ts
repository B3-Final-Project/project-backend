import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BoosterUsage } from '../entities/booster-usage.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BoosterUsageRepository {
  public constructor(
    @InjectRepository(BoosterUsage)
    private readonly boosterUsageRepo: Repository<BoosterUsage>,
  ) {}

  public async count(options?: any): Promise<number> {
    return this.boosterUsageRepo.count(options);
  }

  public async save(boosterUsage: BoosterUsage): Promise<BoosterUsage> {
    return this.boosterUsageRepo.save(boosterUsage);
  }

  public create(data: Partial<BoosterUsage>): BoosterUsage {
    return this.boosterUsageRepo.create(data);
  }

  /**
   * Delete all booster usages for a given userId
   */
  public async deleteByUserId(userId: number): Promise<void> {
    await this.boosterUsageRepo.delete({ userId });
  }
}
