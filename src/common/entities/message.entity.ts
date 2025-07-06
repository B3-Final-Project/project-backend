import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  sender_id: string;

  @Column({ type: 'varchar' })
  conversation_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'varchar', nullable: true })
  reply_to_id: string;

  @Column({ type: 'jsonb', default: '{}' })
  reactions: Record<string, string[]>; // emoji -> array of user IDs

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'user_id' })
  sender: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: Message;

  @CreateDateColumn()
  created_at: Date;
}
