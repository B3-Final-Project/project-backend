import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  DrinkingEnum,
  OrientationEnum,
  PoliticsEnum,
  RelationshipTypeEnum,
  ReligionEnum,
  SmokingEnum,
  ZodiacEnum,
} from '../../modules/profile/enums';

import { ApiProperty } from '@nestjs/swagger';
import { Interest } from './interest.entity';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @ApiProperty({ example: 1, description: 'Identifiant unique du profil' })
  @PrimaryGeneratedColumn()
  id: number;

  // Location and Work Info
  @ApiProperty({ example: 'Paris', required: false })
  @Column({ type: 'varchar', nullable: true })
  city?: string;

  @ApiProperty({ example: 'Développeur', required: false })
  @Column({ type: 'varchar', nullable: true })
  work?: string;

  @ApiProperty({ type: [String], required: false })
  @Column('simple-array', { nullable: true })
  languages?: string[];

  // Preference Info
  @ApiProperty({ example: 18, required: false })
  @Column({ type: 'int', nullable: true })
  min_age?: number;

  @ApiProperty({ example: 30, required: false })
  @Column({ type: 'int', nullable: true })
  max_age?: number;

  @ApiProperty({ example: 50, required: false })
  @Column({ type: 'float', nullable: true })
  max_distance?: number;

  @ApiProperty({ enum: OrientationEnum, required: false })
  @Column({ type: 'int', nullable: true })
  orientation?: OrientationEnum;

  @ApiProperty({ enum: RelationshipTypeEnum, required: false })
  @Column({ type: 'int', nullable: true })
  relationship_type?: RelationshipTypeEnum;

  // Lifestyle Info
  @ApiProperty({ enum: SmokingEnum, required: false })
  @Column({ type: 'int', nullable: true })
  smoking?: SmokingEnum;

  @ApiProperty({ enum: DrinkingEnum, required: false })
  @Column({ type: 'int', nullable: true })
  drinking?: DrinkingEnum;

  @ApiProperty({ enum: ReligionEnum, required: false })
  @Column({ type: 'int', nullable: true })
  religion?: ReligionEnum;

  @ApiProperty({ enum: PoliticsEnum, required: false })
  @Column({ type: 'int', nullable: true })
  politics?: PoliticsEnum;

  @ApiProperty({ enum: ZodiacEnum, required: false })
  @Column({ type: 'int', nullable: true })
  zodiac?: ZodiacEnum;

  // Images
  @ApiProperty({ type: [String], required: false })
  @Column('simple-array', { nullable: true })
  images?: (string | null)[];

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @ApiProperty({ type: () => [Interest], required: false })
  @ManyToMany(() => Interest, (interest) => interest.profiles)
  @JoinTable({
    name: 'profiles_interests',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests?: Interest[];

  @ApiProperty({ type: () => User, required: false })
  @OneToOne(() => User, (userProfile) => userProfile.profile)
  userProfile: User;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ApiProperty({ enum: RarityEnum, required: false })
  @Column({ type: 'int', nullable: true })
  rarity: RarityEnum;
}
