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

  @Column({ type: 'int' })
  public from_profile_id: number;

  @Column({ type: 'int' })
  public to_profile_id: number;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'from_profile_id' })
  public fromProfile: Profile;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'to_profile_id' })
  public toProfile: Profile;

  @Column({ type: 'int', nullable: true })
  public action: BoosterAction;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: Date;
}
