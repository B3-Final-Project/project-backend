import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BoosterAction } from '../../booster/enums/action.enum';

@Entity('matches')
export class UserMatches {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public user_id: string;

  @Column({ type: 'varchar' })
  public profile_id: string;

  @Column({ type: 'int', nullable: true })
  public action: BoosterAction;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: Date;
}
