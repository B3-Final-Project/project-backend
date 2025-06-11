// creates basic boosters for the game with a request to the database using the RelationshipTypeEnum

import { BoosterRepository } from '../common/repository/booster.repository';
import { CreateBoosterDto } from '../modules/booster/dto/create-booster.dto';
import { Injectable } from '@nestjs/common';
import { RelationshipTypeEnum } from '../modules/profile/enums';

@Injectable()
export class BoosterSeed {
  constructor(private readonly boosterRepository: BoosterRepository) {}

  public async seed() {
    console.log('🚀 Starting booster seed...');

    const boosters: CreateBoosterDto[] = [
      {
        name: 'Water Pack',
        type: RelationshipTypeEnum.CASUAL,
      },
      {
        name: 'Grass Pack',
        type: RelationshipTypeEnum.FRIENDSHIP,
      },
      {
        name: 'Rock Pack',
        type: RelationshipTypeEnum.LONG_TERM,
      },
      {
        name: 'Metal Pack',
        type: RelationshipTypeEnum.MARRIAGE,
      },
      {
        name: 'Random Pack',
        type: RelationshipTypeEnum.UNSURE,
      },
    ];

    for (const booster of boosters) {
      await this.boosterRepository.createBooster(booster);
      console.log(`✅ Created booster: ${booster.name}`);
    }

    console.log(`✅ Seeded ${boosters.length} booster packs`);
  }
}
