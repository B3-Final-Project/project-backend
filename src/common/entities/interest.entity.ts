import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Profile } from './profile.entity';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ManyToMany(() => Profile, (profile) => profile.interests)
  profiles: Profile[];
}
