import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { GenderEnum } from '../../profile/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  surname: string;

  @Column({ type: 'int' })
  gender: GenderEnum;

  @Column({ type: 'int' })
  age: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ type: 'int', nullable: true })
  rarity: number;

  @Column({ type: 'int', nullable: true })
  currency: number;

  @OneToOne(() => Profile, { eager: true })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
