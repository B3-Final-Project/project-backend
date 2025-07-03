import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../common/entities/message.entity';
import { Conversation } from '../../common/entities/conversation.entity';
import { User } from '../../common/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { WsRequestDto } from '../../common/dto/ws-request.dto';
import {
  formatConversationForFrontend,
  formatMessageForFrontend,
} from '../../common/utils/message-utils';
import { ConversationRepository } from '../../common/repository/conversation.repository';

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
    private readonly conversationRepo: ConversationRepository,
  ) {}

  private getUserId(req: RequestDto): string {
    if ('user' in req && req.user && 'userId' in req.user) {
      return req.user.userId;
    }
    throw new Error('Invalid request object');
  }

  public async createConversation(
    dto: CreateConversationDto,
    req: RequestDto,
  ): Promise<any> {
    const userId = this.getUserId(req);
    const user1 = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    const user2 = await this.userRepository.findOne({
      where: { user_id: dto.user2_id },
    });

    if (!user1 || !user2) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si une conversation existe déjà
    const existingConversation =
      await this.conversationRepo.findExistingConversation(
        user1.user_id,
        user2.user_id,
      );

    if (existingConversation) {
      return formatConversationForFrontend(existingConversation, userId);
    }

    const conversation = this.conversationRepository.create({
      user1_id: user1.user_id,
      user2_id: user2.user_id,
      is_active: true,
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Récupérer la conversation avec les relations
    const fullConversation = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: [
        'user1',
        'user2',
        'user1.profile',
        'user2.profile',
        'messages',
      ],
    });

    return formatConversationForFrontend(fullConversation, userId);
  }

  public async sendMessage(
    dto: CreateMessageDto,
    req: RequestDto,
  ): Promise<any> {
    const userId = this.getUserId(req);

    const conversation = await this.conversationRepository.findOne({
      where: { id: dto.conversation_id },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation",
      );
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
      { updated_at: new Date() },
    );

    // Récupérer le message avec les relations
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });

    return formatMessageForFrontend(fullMessage, userId);
  }

  public async getConversations(req: RequestDto): Promise<any[]> {
    const userId = this.getUserId(req);
    const conversations =
      await this.conversationRepo.findConversationsByUserId(userId);

    return conversations.map((conversation) =>
      formatConversationForFrontend(conversation, userId),
    );
  }

  public async getMessages(
    conversationId: string,
    req: RequestDto,
  ): Promise<any[]> {
    const userId = this.getUserId(req);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        "Vous n'êtes pas autorisé à voir les messages de cette conversation",
      );
    }

    const messages = await this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });

    return messages.map((message) => formatMessageForFrontend(message, userId));
  }

  public async markMessagesAsRead(
    conversationId: string,
    req: RequestDto,
  ): Promise<void> {
    const userId = this.getUserId(req);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        "Vous n'êtes pas autorisé à marquer les messages de cette conversation comme lus",
      );
    }

    await this.messageRepository.update(
      {
        conversation_id: conversationId,
        sender_id:
          conversation.user1_id === userId
            ? conversation.user2_id
            : conversation.user1_id,
        is_read: false,
      },
      { is_read: true },
    );
  }

  public async getConversationById(
    conversationId: string,
  ): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2'],
    });
  }

  public async deleteConversation(
    conversationId: string,
    req: RequestDto,
  ): Promise<void> {
    const userId = this.getUserId(req);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        "Vous n'êtes pas autorisé à supprimer cette conversation",
      );
    }

    // Supprimer tous les messages de la conversation
    await this.messageRepository.delete({ conversation_id: conversationId });

    // Supprimer la conversation
    await this.conversationRepository.delete({ id: conversationId });
  }
}
