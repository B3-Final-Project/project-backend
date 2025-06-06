import { InjectRepository } from '@nestjs/typeorm';
import { BoosterPack } from '../entities/booster.entity';
import { Repository } from 'typeorm';
import { AvailablePackDto } from '../../modules/booster/dto/available-pack.dto';
import { CreateBoosterDto } from '../../modules/booster/dto/create-booster.dto';

export class BoosterRepository {
  public constructor(
    @InjectRepository(BoosterPack)
    private readonly boosters: Repository<BoosterPack>,
  ) {}

  public async getAvailablePacks(): Promise<AvailablePackDto> {
    return {
      data: await this.boosters.find(),
    };
  }

  public async createBooster(booster: CreateBoosterDto): Promise<BoosterPack> {
    return this.boosters.save(booster);
  }
}
