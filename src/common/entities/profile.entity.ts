import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Interest } from './interest.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  user_id: string;

  // Personal Info
  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', nullable: true })
  surname?: string;

  @Column({ type: 'varchar', nullable: true })
  gender?: string;

  @Column({ type: 'varchar', nullable: true })
  orientation?: string;

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
  gender_preference?: number;

  @Column({ type: 'varchar', nullable: true })
  relationship_type?: string;

  // Lifestyle Info
  @Column({ type: 'varchar', nullable: true })
  smoking?: string;

  @Column({ type: 'varchar', nullable: true })
  drinking?: string;

  @Column({ type: 'varchar', nullable: true })
  religion?: string;

  @Column({ type: 'varchar', nullable: true })
  politics?: string;

  @Column({ type: 'varchar', nullable: true })
  zodiac?: string;

  @ManyToMany(() => Interest, (interest) => interest.profiles)
  @JoinTable({
    name: 'profiles_interests',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests?: Interest[];
}
