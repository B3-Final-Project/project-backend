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
        imageUrl:
          'https://tf--holomatch-images.s3.eu-west-3.amazonaws.com/users/7159708e-6051-70a3-ad59-f44a2f3d4d23/1748851953562-9s960sc7x2u.jpg',
        type: RelationshipTypeEnum.CASUAL,
      },
      {
        name: 'Grass Pack',
        imageUrl:
          'https://tf--holomatch-images.s3.eu-west-3.amazonaws.com/users/7159708e-6051-70a3-ad59-f44a2f3d4d23/1748851953562-9s960sc7x2u.jpg',
        type: RelationshipTypeEnum.FRIENDSHIP,
      },
      {
        name: 'Rock Pack',
        imageUrl:
          'https://tf--holomatch-images.s3.eu-west-3.amazonaws.com/users/7159708e-6051-70a3-ad59-f44a2f3d4d23/1748851953562-9s960sc7x2u.jpg',
        type: RelationshipTypeEnum.LONG_TERM,
      },
      {
        name: 'Metal Pack',
        imageUrl:
          'https://tf--holomatch-images.s3.eu-west-3.amazonaws.com/users/7159708e-6051-70a3-ad59-f44a2f3d4d23/1748851953562-9s960sc7x2u.jpg',
        type: RelationshipTypeEnum.MARRIAGE,
      },
      {
        name: 'Random Pack',
        imageUrl:
          'https://tf--holomatch-images.s3.eu-west-3.amazonaws.com/users/7159708e-6051-70a3-ad59-f44a2f3d4d23/1748851953562-9s960sc7x2u.jpg',
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
