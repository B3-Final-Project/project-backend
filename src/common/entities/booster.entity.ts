import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { RelationshipTypeEnum } from '../../modules/profile/enums';

@Entity()
export class BoosterPack {
  @ApiProperty({ example: 1, description: 'Identifiant unique du booster' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Super Pack', description: 'Nom du booster' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'https://example.com/image.png',
    description: "URL de l'image du booster",
  })
  @Column({ type: 'varchar', length: 255 })
  imageUrl: string;

  @ApiProperty({
    enum: RelationshipTypeEnum,
    description: 'Type de relation du booster',
  })
  @Column({ type: 'int' })
  type: RelationshipTypeEnum;
}
