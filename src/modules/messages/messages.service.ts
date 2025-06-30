import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../common/entities/message.entity';
import { Conversation } from '../../common/entities/conversation.entity';
import { User } from '../../common/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { WsRequestDto } from '../../common/dto/ws-request.dto';

type RequestDto = HttpRequestDto | WsRequestDto;

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

  private getUserId(req: RequestDto): string {
    if ('user' in req && req.user && 'userId' in req.user) {
      return req.user.userId;
    }
    throw new Error('Invalid request object');
  }

  async createConversation(dto: CreateConversationDto, req: RequestDto): Promise<any> {
    const userId = this.getUserId(req);
    const user1 = await this.userRepository.findOne({ where: { user_id: userId } });
    const user2 = await this.userRepository.findOne({ where: { user_id: dto.user2_id } });

    if (!user1 || !user2) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('user1.profile', 'user1Profile')
      .leftJoinAndSelect('user2.profile', 'user2Profile')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where(
        '(conversation.user1_id = :user1Id AND conversation.user2_id = :user2Id) OR (conversation.user1_id = :user2Id AND conversation.user2_id = :user1Id)',
        { user1Id: user1.user_id, user2Id: user2.user_id },
      )
      .orderBy('messages.created_at', 'DESC')
      .getOne();

    if (existingConversation) {
      return this.formatConversationForFrontend(existingConversation, userId);
    }

    const conversation = this.conversationRepository.create({
      user1_id: user1.user_id,
      user2_id: user2.user_id,
      is_active: true,
    });

    const savedConversation = await this.conversationRepository.save(conversation);
    
    // Récupérer la conversation avec les relations
    const fullConversation = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['user1', 'user2', 'user1.profile', 'user2.profile', 'messages'],
    });

    return this.formatConversationForFrontend(fullConversation, userId);
  }

  async sendMessage(dto: CreateMessageDto, req: RequestDto): Promise<any> {
    const userId = this.getUserId(req);
    
    // Valider que l'ID de conversation est un UUID valide
    if (!this.isValidUUID(dto.conversation_id)) {
      throw new BadRequestException('ID de conversation invalide');
    }
    
    const conversation = await this.conversationRepository.findOne({
      where: { id: dto.conversation_id },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation');
    }

    const message = this.messageRepository.create({
      conversation_id: conversation.id,
      sender_id: userId,
      content: dto.content,
    });

    const savedMessage = await this.messageRepository.save(message);
    
    // Mettre à jour la date de mise à jour de la conversation
    await this.conversationRepository.update(
      { id: conversation.id },
      { updated_at: new Date() }
    );
    
    // Récupérer le message avec les relations
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });

    return this.formatMessageForFrontend(fullMessage, userId);
  }

  async getConversations(req: RequestDto): Promise<any[]> {
    const userId = this.getUserId(req);
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
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

    return conversations.map(conversation => 
      this.formatConversationForFrontend(conversation, userId)
    );
  }

  async getMessages(conversationId: string, req: RequestDto): Promise<any[]> {
    const userId = this.getUserId(req);
    
    // Valider que l'ID de conversation est un UUID valide
    if (!this.isValidUUID(conversationId)) {
      throw new BadRequestException('ID de conversation invalide');
    }
    
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à voir les messages de cette conversation');
    }

    const messages = await this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });

    return messages.map(message => 
      this.formatMessageForFrontend(message, userId)
    );
  }

  async markMessagesAsRead(conversationId: string, req: RequestDto): Promise<void> {
    const userId = this.getUserId(req);
    
    // Valider que l'ID de conversation est un UUID valide
    if (!this.isValidUUID(conversationId)) {
      throw new BadRequestException('ID de conversation invalide');
    }
    
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à marquer les messages de cette conversation comme lus');
    }

    await this.messageRepository.update(
      {
        conversation_id: conversationId,
        sender_id: conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id,
        is_read: false,
      },
      { is_read: true },
    );
  }

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    // Valider que l'ID de conversation est un UUID valide
    if (!this.isValidUUID(conversationId)) {
      return null;
    }
    
    return this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2'],
    });
  }

  private formatConversationForFrontend(conversation: Conversation, currentUserId: string): any {
    const otherUser = conversation.user1_id === currentUserId ? conversation.user2 : conversation.user1;
    const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;
    const lastMessage = conversation.messages && conversation.messages.length > 0 
      ? conversation.messages[0] 
      : null;

    const unreadCount = conversation.messages 
      ? conversation.messages.filter(msg => 
          msg.sender_id !== currentUserId && !msg.is_read
        ).length 
      : 0;

    return {
      id: conversation.id.toString(),
      name: otherUser?.name || 'Utilisateur inconnu',
      avatar: otherUser?.profile?.avatarUrl || otherUser?.profile?.images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.name || 'user'}`,
      otherUserId: otherUserId,
      lastMessage: lastMessage ? {
        id: lastMessage.id.toString(),
        content: lastMessage.content,
        timestamp: lastMessage.created_at,
        isMe: lastMessage.sender_id === currentUserId,
        isRead: lastMessage.is_read,
        conversationId: conversation.id.toString(),
      } : undefined,
      unread: unreadCount,
      isTyping: false, // À implémenter avec WebSocket si nécessaire
      lastActive: conversation.updated_at,
    };
  }

  private formatMessageForFrontend(message: Message, currentUserId: string): any {
    return {
      id: message.id.toString(),
      content: message.content,
      timestamp: message.created_at,
      isMe: message.sender_id === currentUserId,
      isRead: message.is_read,
      conversationId: message.conversation_id.toString(),
      sender_id: message.sender_id,
    };
  }

  private isValidUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(uuid);
  }
} 