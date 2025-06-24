import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Profile } from './profile.entity';

@Entity('interests')
export class Interest {
  @ApiProperty({ example: 1, description: "Identifiant unique de l'intérêt" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Musique', description: "Description de l'intérêt" })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({ type: () => [Profile], required: false })
  @ManyToMany(() => Profile, (profile) => profile.interests)
  profiles: Profile[];
}
