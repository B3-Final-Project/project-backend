import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BoosterPack } from '../entities/booster.entity';
import { Repository } from 'typeorm';
import { CreateBoosterDto } from '../../modules/booster/dto/create-booster.dto';

@Injectable()
export class BoosterRepository {
  public constructor(
    @InjectRepository(BoosterPack)
    private readonly boosters: Repository<BoosterPack>,
  ) {}

  public async getAvailablePacks(): Promise<BoosterPack[]> {
    return this.boosters.find();
  }

  public async createBooster(booster: CreateBoosterDto): Promise<BoosterPack> {
    return this.boosters.save(booster);
  }
}
