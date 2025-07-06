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
import { AddReactionDto } from './dto/add-reaction.dto';
import { RemoveReactionDto } from './dto/remove-reaction.dto';
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

  private async validateConversationAccess(
    conversationId: string,
    userId: string,
    errorMessage: string
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(errorMessage);
    }

    return conversation;
  }

  private async validateConversationAccessWithRelations(
    conversationId: string,
    userId: string,
    errorMessage: string,
    relations: string[] = ['user1', 'user2']
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(errorMessage);
    }

    return conversation;
  }

  private getOtherUserId(conversation: Conversation, userId: string): string {
    return conversation.user1_id === userId
      ? conversation.user2_id
      : conversation.user1_id;
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

    const conversation = await this.validateConversationAccessWithRelations(
      dto.conversation_id,
      userId,
      "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation",
      ['user1', 'user2']
    );

    const message = this.messageRepository.create({
      conversation_id: conversation.id,
      sender_id: userId,
      content: dto.content,
      reply_to_id: dto.reply_to_id,
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
      relations: ['sender', 'conversation', 'replyTo'],
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

    await this.validateConversationAccess(
      conversationId,
      userId,
      "Vous n'êtes pas autorisé à voir les messages de cette conversation"
    );

    const messages = await this.messageRepository.find({
      where: { conversation_id: conversationId },
      relations: ['sender', 'replyTo'],
      order: { created_at: 'ASC' },
    });

    return messages.map((message) => formatMessageForFrontend(message, userId));
  }

  public async markMessagesAsRead(
    conversationId: string,
    req: RequestDto,
  ): Promise<void> {
    const userId = this.getUserId(req);

    const conversation = await this.validateConversationAccess(
      conversationId,
      userId,
      "Vous n'êtes pas autorisé à marquer les messages de cette conversation comme lus"
    );

    await this.messageRepository.update(
      {
        conversation_id: conversationId,
        sender_id: this.getOtherUserId(conversation, userId),
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

    await this.validateConversationAccessWithRelations(
      conversationId,
      userId,
      "Vous n'êtes pas autorisé à supprimer cette conversation",
      ['user1', 'user2']
    );

    // Supprimer tous les messages de la conversation
    await this.messageRepository.delete({ conversation_id: conversationId });

    // Supprimer la conversation
    await this.conversationRepository.delete({ id: conversationId });
  }

  public async addReaction(
    dto: AddReactionDto,
    req: RequestDto,
  ): Promise<any> {
    const userId = this.getUserId(req);

    const message = await this.messageRepository.findOne({
      where: { id: dto.message_id },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    await this.validateConversationAccess(
      message.conversation.id,
      userId,
      "Vous n'êtes pas autorisé à réagir à ce message"
    );

    // Récupérer les réactions actuelles
    const currentReactions = message.reactions ?? {};
    
    // Ajouter la réaction
    currentReactions[dto.emoji] ??= [];
    
    // Éviter les doublons
    if (!currentReactions[dto.emoji].includes(userId)) {
      currentReactions[dto.emoji].push(userId);
    }

    // Mettre à jour le message
    await this.messageRepository.update(
      { id: dto.message_id },
      { reactions: currentReactions },
    );

    // Récupérer le message mis à jour
    const updatedMessage = await this.messageRepository.findOne({
      where: { id: dto.message_id },
      relations: ['sender', 'conversation', 'replyTo'],
    });

    return formatMessageForFrontend(updatedMessage, userId);
  }

  public async removeReaction(
    dto: RemoveReactionDto,
    req: RequestDto,
  ): Promise<any> {
    const userId = this.getUserId(req);

    const message = await this.messageRepository.findOne({
      where: { id: dto.message_id },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    await this.validateConversationAccess(
      message.conversation.id,
      userId,
      "Vous n'êtes pas autorisé à supprimer cette réaction"
    );

    // Récupérer les réactions actuelles
    const currentReactions = message.reactions ?? {};
    
    // Supprimer la réaction
    if (currentReactions[dto.emoji]) {
      currentReactions[dto.emoji] = currentReactions[dto.emoji].filter(
        (id) => id !== userId,
      );
      
      // Supprimer l'emoji s'il n'y a plus de réactions
      if (currentReactions[dto.emoji].length === 0) {
        delete currentReactions[dto.emoji];
      }
    }

    // Mettre à jour le message
    await this.messageRepository.update(
      { id: dto.message_id },
      { reactions: currentReactions },
    );

    // Récupérer le message mis à jour
    const updatedMessage = await this.messageRepository.findOne({
      where: { id: dto.message_id },
      relations: ['sender', 'conversation', 'replyTo'],
    });

    return formatMessageForFrontend(updatedMessage, userId);
  }
}
