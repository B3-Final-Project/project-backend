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
        imageUrl: 'https://example.com/basic-booster.png',
        type: RelationshipTypeEnum.CASUAL,
      },
      {
        name: 'Grass Pack',
        imageUrl: 'https://example.com/advanced-booster.png',
        type: RelationshipTypeEnum.FRIENDSHIP,
      },
      {
        name: 'Rock Pack',
        imageUrl: 'https://example.com/premium-booster.png',
        type: RelationshipTypeEnum.LONG_TERM,
      },
      {
        name: 'Metal Pack',
        imageUrl: 'https://example.com/ultimate-booster.png',
        type: RelationshipTypeEnum.MARRIAGE,
      },
      {
        name: 'Random Pack',
        imageUrl: 'https://example.com/speed-booster.png',
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
