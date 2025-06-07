import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BoosterAction } from '../../modules/booster/enums/action.enum';
import { Profile } from './profile.entity';

@Entity('matches')
export class UserMatches {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public user_id: string;

  @Column({ type: 'int' })
  public profile_id: number;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'profile_id' })
  public profile: Profile;

  @Column({ type: 'int', nullable: true })
  public action: BoosterAction;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: Date;
}
