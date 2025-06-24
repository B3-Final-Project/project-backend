import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { BoosterAction } from '../../modules/booster/enums/action.enum';
import { Profile } from './profile.entity';

@Entity('matches')
export class UserMatches {
  @ApiProperty({ example: 1, description: 'Identifiant unique du match' })
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiProperty({
    example: 2,
    description: "ID du profil qui a initié l'action",
  })
  @Column({ type: 'int' })
  public from_profile_id: number;

  @ApiProperty({ example: 3, description: 'ID du profil cible' })
  @Column({ type: 'int' })
  public to_profile_id: number;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'from_profile_id' })
  public fromProfile: Profile;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'to_profile_id' })
  public toProfile: Profile;

  @ApiProperty({ enum: BoosterAction })
  @Column({ type: 'int', nullable: true })
  public action: BoosterAction;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: Date;
}
