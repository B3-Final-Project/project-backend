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
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @ApiProperty({ example: 1, description: 'Identifiant unique du profil' })
  @PrimaryGeneratedColumn()
  id: number;

  // Location and Work Info
  @ApiProperty({ example: 'Paris' })
  @Column({ type: 'varchar' })
  city: string;

  @ApiProperty({ example: 'Développeur' })
  @Column({ type: 'varchar' })
  work: string;

  @ApiProperty({ type: [String] })
  @Column('simple-array')
  languages: string[];

  // Preference Info
  @ApiProperty({ example: 18 })
  @Column({ type: 'int' })
  min_age: number;

  @ApiProperty({ example: 30 })
  @Column({ type: 'int' })
  max_age: number;

  @ApiProperty({ example: 50 })
  @Column({ type: 'float' })
  max_distance: number;

  @ApiProperty({ enum: OrientationEnum })
  @Column({ type: 'int' })
  orientation: OrientationEnum;

  @ApiProperty({ enum: RelationshipTypeEnum })
  @Column({ type: 'int' })
  relationship_type: RelationshipTypeEnum;

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

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (userProfile) => userProfile.profile)
  userProfile: User;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
