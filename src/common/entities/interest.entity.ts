import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Profile } from './profile.entity';

@Entity('interests')
export class Interest {
  @ApiProperty({ example: 1, description: "Identifiant unique de l'intérêt" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'What do you enjoy doing in your free time?',
    description: "Question/prompt pour l'intérêt",
  })
  @Column({ type: 'varchar', length: 500 })
  prompt: string;

  @ApiProperty({
    example: 'Reading books',
    description: 'Réponse à la question',
  })
  @Column({ type: 'varchar', length: 500 })
  answer: string;

  @ApiProperty({ type: () => [Profile], required: false })
  @ManyToMany(() => Profile, (profile) => profile.interests)
  profiles: Profile[];

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
