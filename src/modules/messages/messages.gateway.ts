import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { WsRequestDto } from '../../common/dto/ws-request.dto';
import { UserRepository } from '../../common/repository/user.repository';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/api/ws/messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<string, Socket>();
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly wsJwtGuard: WsJwtGuard,
    private readonly userRepository: UserRepository,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Appliquer le guard manuellement
      const context = {
        switchToWs: () => ({
          getClient: () => client,
        }),
      };

      const isAuthenticated = this.wsJwtGuard.canActivate(context);

      if (!isAuthenticated) {
        this.logger.error('❌ Authentification échouée, déconnexion du client');
        client.disconnect();
        return;
      }

      const userId = client.handshake.auth.userId;

      if (userId) {
        this.connectedUsers.set(userId, client);
        client.join(`user:${userId}`);
        this.logger.log(
          `✅ User ${userId} connecté à messages (${this.connectedUsers.size} utilisateurs connectés)`,
        );

        // Notifier les autres utilisateurs que cet utilisateur est en ligne
        client.broadcast.emit('userOnline', { userId });
      } else {
        this.logger.error(
          `❌ Pas d'userId dans l'auth: ${JSON.stringify(client.handshake.auth)}`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Erreur de connexion WebSocket: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected from messages`);

      // Notifier les autres utilisateurs que cet utilisateur est hors ligne
      client.broadcast.emit('userOffline', { userId });
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.handshake.auth.userId;
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.handshake.auth.userId;
    client.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      const userId = client.handshake.auth.userId;

      const message = await this.messagesService.sendMessage(data, {
        user: {
          userId,
          groups: client.handshake.auth.groups ?? [],
        },
      } as WsRequestDto);

      this.logger.log(
        `✅ Message traité par le service - messageId: ${message.id}`,
      );

      // Récupérer la conversation avec les informations de l'expéditeur
      const conversation = await this.messagesService.getConversationById(
        data.conversation_id,
      );

      if (conversation) {
        // Récupérer les informations de l'expéditeur depuis le UserRepository
        const sender = await this.userRepository.findById(userId);
        const senderName = sender ? `${sender.name} ${sender.surname}`.trim() : 'Quelqu\'un';

        // Créer un objet message enrichi avec les informations de l'expéditeur
        const enrichedMessage = {
          ...message,
          senderName,
        };

        // Émettre le message enrichi à tous les utilisateurs de la conversation
        this.server
          .to(`conversation:${data.conversation_id}`)
          .emit('newMessage', enrichedMessage);

        // Émettre aussi une notification spécifique à l'autre utilisateur
        const otherUserId =
          conversation.user1_id === userId
            ? conversation.user2_id
            : conversation.user1_id;
        
        this.server.to(`user:${otherUserId}`).emit('newMessage', enrichedMessage);
      } else {
        // Fallback si la conversation n'est pas trouvée
        this.server
          .to(`conversation:${data.conversation_id}`)
          .emit('newMessage', message);
      }

      // Confirmer l'envoi au client
      client.emit('messageSent', { success: true, messageId: message.id });
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de l'envoi du message: ${error.message}`,
      );
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateConversationDto,
  ) {
    try {
      const userId = client.handshake.auth.userId;
      const conversation = await this.messagesService.createConversation(data, {
        user: {
          userId,
          groups: client.handshake.auth.groups ?? [],
        },
      } as WsRequestDto);


    } catch (error) {
      this.logger.error(`Error creating conversation: ${error.message}`);
      client.emit('error', { message: 'Failed to create conversation' });
    }
  }

  @SubscribeMessage('deleteConversation')
  async handleDeleteConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const userId = client.handshake.auth.userId;
      this.logger.log(
        `🗑️ Suppression de conversation demandée - userId: ${userId}, conversationId: ${conversationId}`,
      );

      // Récupérer la conversation AVANT de la supprimer pour obtenir l'autre utilisateur
      const conversation =
        await this.messagesService.getConversationById(conversationId);
      
      if (!conversation) {
        this.logger.error(`❌ Conversation ${conversationId} non trouvée`);
        client.emit('error', { message: 'Conversation not found' });
        return;
      }

      const otherUserId =
        conversation.user1_id === userId
          ? conversation.user2_id
          : conversation.user1_id;

      // Supprimer la conversation
      await this.messagesService.deleteConversation(conversationId, {
        user: {
          userId,
          groups: client.handshake.auth.groups ?? [],
        },
      } as WsRequestDto);

      this.logger.debug(
        `🗑️ Notification de suppression envoyée aux utilisateurs - deletedBy: ${userId}, otherUser: ${otherUserId}`,
      );

      // Émettre l'événement de suppression aux deux utilisateurs
      this.server
        .to(`user:${userId}`)
        .emit('conversationDeleted', { conversationId });
      this.server
        .to(`user:${otherUserId}`)
        .emit('conversationDeleted', { conversationId });

      // Confirmer la suppression au client
      client.emit('conversationDeleted', { success: true, conversationId });
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la suppression de la conversation: ${error.message}`,
      );
      client.emit('error', { message: 'Failed to delete conversation' });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const userId = client.handshake.auth.userId;

      await this.messagesService.markMessagesAsRead(conversationId, {
        user: {
          userId,
          groups: client.handshake.auth.groups ?? [],
        },
      } as WsRequestDto);

      // Notifier les autres utilisateurs que les messages ont été lus
      const conversation =
        await this.messagesService.getConversationById(conversationId);
      if (conversation) {
        const otherUserId =
          conversation.user1_id === userId
            ? conversation.user2_id
            : conversation.user1_id;
        this.server
          .to(`user:${otherUserId}`)
          .emit('messagesRead', { conversationId });
      }

      // Confirmer le marquage au client
      client.emit('messagesMarkedAsRead', { success: true, conversationId });
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors du marquage comme lu: ${error.message}`,
      );
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      const userId = client.handshake.auth.userId;

      // Émettre l'état de frappe aux autres utilisateurs de la conversation (exclure l'utilisateur actuel)
      client.to(`conversation:${data.conversationId}`).emit('userTyping', {
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la gestion de l'état de frappe: ${error.message}`,
      );
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', { users: onlineUsers });
  }

  // Méthode pour émettre des messages depuis le service
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Méthode pour émettre à un utilisateur spécifique
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }




}
