import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '../../modules/profile/enums';
import { Point } from 'geojson';
import { Profile } from './profile.entity';

@Entity('users')
export class User {
  @ApiProperty({
    example: 1,
    description: "Identifiant unique de l'utilisateur",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'uuid-123',
    description: 'Identifiant externe unique (auth)',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  user_id: string;

  @ApiProperty({ example: 'Jean', description: "Prénom de l'utilisateur" })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Dupont',
    description: "Nom de famille de l'utilisateur",
  })
  @Column({ type: 'varchar', length: 255 })
  surname: string;

  @ApiProperty({ enum: GenderEnum, description: "Genre de l'utilisateur" })
  @Column({ type: 'int' })
  gender: GenderEnum;

  @ApiProperty({ example: 25, description: "Âge de l'utilisateur" })
  @Column({ type: 'int' })
  age: number;

  @ApiProperty({
    type: 'object',
    required: false,
    description: 'Coordonnées géographiques (GeoJSON Point)',
    example: { type: 'Point', coordinates: [2.3522, 48.8566] },
  })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: Point;

  @ApiProperty({ example: 2, required: false })
  @Column({ type: 'int', nullable: true })
  rarity: number;

  @ApiProperty({ example: 100, required: false })
  @Column({ type: 'int', nullable: true })
  currency: number;

  @ApiProperty({ type: () => Profile, required: false })
  @OneToOne(() => Profile, { eager: true })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
