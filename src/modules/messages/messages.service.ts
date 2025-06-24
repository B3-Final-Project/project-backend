import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../common/entities/message.entity';
import { Conversation } from '../../common/entities/conversation.entity';
import { User } from '../../common/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createConversation(dto: CreateConversationDto, req: HttpRequestDto): Promise<Conversation> {
    const user1 = await this.userRepository.findOne({ where: { user_id: req.user.userId } });
    const user2 = await this.userRepository.findOne({ where: { user_id: dto.user2_id } });

    if (!user1 || !user2) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(
        '(conversation.user1_id = :user1Id AND conversation.user2_id = :user2Id) OR (conversation.user1_id = :user2Id AND conversation.user2_id = :user1Id)',
        { user1Id: user1.user_id, user2Id: user2.user_id },
      )
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = this.conversationRepository.create({
      user1_id: user1.user_id,
      user2_id: user2.user_id,
      is_active: true,
    });

    return this.conversationRepository.save(conversation);
  }

  async sendMessage(dto: CreateMessageDto, req: HttpRequestDto): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: dto.conversation_id },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== req.user.userId && conversation.user2_id !== req.user.userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation');
    }

    const message = this.messageRepository.create({
      conversation_id: conversation.id,
      sender_id: req.user.userId,
      content: dto.content,
    });

    return this.messageRepository.save(message);
  }

  async getConversations(req: HttpRequestDto): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where('conversation.user1_id = :userId OR conversation.user2_id = :userId', {
        userId: req.user.userId,
      })
      .orderBy('conversation.updated_at', 'DESC')
      .getMany();
  }

  async getMessages(conversationId: number, req: HttpRequestDto): Promise<Message[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== req.user.userId && conversation.user2_id !== req.user.userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à voir les messages de cette conversation');
    }

    return this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  async markMessagesAsRead(conversationId: number, req: HttpRequestDto): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== req.user.userId && conversation.user2_id !== req.user.userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à marquer les messages de cette conversation comme lus');
    }

    await this.messageRepository.update(
      {
        conversation_id: conversationId,
        sender_id: conversation.user1_id === req.user.userId ? conversation.user2_id : conversation.user1_id,
        is_read: false,
      },
      { is_read: true },
    );
  }
} 