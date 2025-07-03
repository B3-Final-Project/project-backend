import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(private readonly dataSource: DataSource) {
    super(Conversation, dataSource.createEntityManager());
  }

  async findConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('user1.profile', 'user1Profile')
      .leftJoinAndSelect('user2.profile', 'user2Profile')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where('conversation.user1_id = :userId OR conversation.user2_id = :userId', {
        userId,
      })
      .orderBy('conversation.updated_at', 'DESC')
      .addOrderBy('messages.created_at', 'DESC')
      .getMany();
  }

  async findExistingConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
    return this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('user1.profile', 'user1Profile')
      .leftJoinAndSelect('user2.profile', 'user2Profile')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where(
        '(conversation.user1_id = :user1Id AND conversation.user2_id = :user2Id) OR (conversation.user1_id = :user2Id AND conversation.user2_id = :user1Id)',
        { user1Id, user2Id },
      )
      .orderBy('messages.created_at', 'DESC')
      .getOne();
  }
} 