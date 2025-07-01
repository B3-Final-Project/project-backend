import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Profile } from './profile.entity';
import { ReportReason } from '../../modules/profile/dto/report.dto';

@Entity('reports')
export class Report {
  @ApiProperty({ example: 1, description: 'Identifiant unique du rapport' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    enum: ReportReason,
    description: 'Raison du signalement',
  })
  @Column({ type: 'int' })
  reason: ReportReason;

  @ApiProperty({
    example: 'Contenu inapproprié détecté',
    description: 'Message descriptif du signalement',
  })
  @Column({ type: 'varchar', length: 500 })
  message: string;

  @ApiProperty({
    example: 'user-123',
    description: "ID de l'utilisateur qui fait le signalement",
  })
  @Column({ type: 'varchar', length: 255 })
  reporterUserId: string;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile, (profile) => profile.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reported_profile_id' })
  reportedProfile: Profile;

  @ApiProperty({
    example: 1,
    description: 'ID du profil signalé',
  })
  @Column({ type: 'int' })
  reported_profile_id: number;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
