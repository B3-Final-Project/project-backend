import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  user1_id: string;

  @Column({ type: 'varchar' })
  user2_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user1_id', referencedColumnName: 'user_id' })
  user1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user2_id', referencedColumnName: 'user_id' })
  user2: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
