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

import { Interest } from './interest.entity';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  // Location and Work Info
  @Column({ type: 'varchar', nullable: true })
  city?: string;

  @Column({ type: 'varchar', nullable: true })
  work?: string;

  @Column('simple-array', { nullable: true })
  languages?: string[];

  // Preference Info
  @Column({ type: 'int', nullable: true })
  min_age?: number;

  @Column({ type: 'int', nullable: true })
  max_age?: number;

  @Column({ type: 'float', nullable: true })
  max_distance?: number;

  @Column({ type: 'int', nullable: true })
  orientation?: OrientationEnum;

  @Column({ type: 'int', nullable: true })
  relationship_type?: RelationshipTypeEnum;

  // Lifestyle Info
  @Column({ type: 'int', nullable: true })
  smoking?: SmokingEnum;

  @Column({ type: 'int', nullable: true })
  drinking?: DrinkingEnum;

  @Column({ type: 'int', nullable: true })
  religion?: ReligionEnum;

  @Column({ type: 'int', nullable: true })
  politics?: PoliticsEnum;

  @Column({ type: 'int', nullable: true })
  zodiac?: ZodiacEnum;

  // Images
  @Column('simple-array', { nullable: true })
  images?: (string | null)[];

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @ManyToMany(() => Interest, (interest) => interest.profiles)
  @JoinTable({
    name: 'profiles_interests',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests?: Interest[];

  @OneToOne(() => User, (userProfile) => userProfile.profile)
  userProfile: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  rarity: RarityEnum;

  @Column('simple-json', { nullable: true })
  rareMatchesCache?: { [key in RarityEnum]?: number[] };
}
