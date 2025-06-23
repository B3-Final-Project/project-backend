import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
<<<<<<< HEAD
=======

import { ApiProperty } from '@nestjs/swagger';
>>>>>>> main
import { RelationshipTypeEnum } from '../../modules/profile/enums';

@Entity()
export class BoosterPack {
<<<<<<< HEAD
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  imageUrl: string;

=======
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
  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @ApiProperty({
    enum: RelationshipTypeEnum,
    description: 'Type de relation du booster',
  })
>>>>>>> main
  @Column({ type: 'int' })
  type: RelationshipTypeEnum;
}
