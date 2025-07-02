import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { WsRequestDto } from '../../common/dto/ws-request.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  },
  namespace: '/api/ws/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<string, Socket>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly wsJwtGuard: WsJwtGuard
  ) {}

  async handleConnection(client: Socket) {
    console.log('🚀 handleConnection appelé !', {
      socketId: client.id,
      auth: client.handshake.auth,
      userId: client.handshake.auth.userId
    });
    
    try {
      // Appliquer le guard manuellement
      const context = {
        switchToWs: () => ({
          getClient: () => client
        })
      };
      
      const isAuthenticated = this.wsJwtGuard.canActivate(context);
      console.log('🔐 Résultat de l\'authentification:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.error('❌ Authentification échouée, déconnexion du client');
        client.disconnect();
        return;
      }
      
      const userId = client.handshake.auth.userId;
      console.log('🔌 Nouvelle connexion WebSocket:', { 
        socketId: client.id, 
        userId, 
        auth: client.handshake.auth 
      });
      
      if (userId) {
        this.connectedUsers.set(userId, client);
        client.join(`user:${userId}`);
        console.log(`✅ User ${userId} connecté à messages (${this.connectedUsers.size} utilisateurs connectés)`);
        
        // Notifier les autres utilisateurs que cet utilisateur est en ligne
        console.log(`📡 Émission userOnline pour ${userId}`);
        client.broadcast.emit('userOnline', { userId });
        
      } else {
        console.error('❌ Pas d\'userId dans l\'auth:', client.handshake.auth);
      }
    } catch (error) {
      console.error('❌ Erreur de connexion WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected from messages`);
      
      // Notifier les autres utilisateurs que cet utilisateur est hors ligne
      console.log(`📡 Émission userOffline pour ${userId}`);
      client.broadcast.emit('userOffline', { userId });
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    console.log('📨 Événement joinConversation reçu:', { socketId: client.id, conversationId });
    const userId = client.handshake.auth.userId;
    client.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    console.log('📨 Événement leaveConversation reçu:', { socketId: client.id, conversationId });
    const userId = client.handshake.auth.userId;
    client.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    console.log('📨 Événement sendMessage reçu:', { socketId: client.id, data });
    try {
      const userId = client.handshake.auth.userId;
      console.log('📤 Message reçu via WebSocket:', { 
        userId, 
        conversationId: data.conversation_id, 
        content: data.content,
        socketId: client.id 
      });
      
      const message = await this.messagesService.sendMessage(data, { 
        user: { 
          userId,
          groups: client.handshake.auth.groups ?? []
        } 
      } as WsRequestDto);
      
      console.log('✅ Message traité par le service:', message);
      
      // Émettre le message à tous les utilisateurs de la conversation
      this.server.to(`conversation:${data.conversation_id}`).emit('newMessage', message);
      console.log(`📡 Message émis à la conversation ${data.conversation_id}`);
      
      // Émettre une notification de nouveau message non lu
      const conversation = await this.messagesService.getConversationById(data.conversation_id);
      if (conversation) {
        const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
        console.log(`🔔 Envoi notification à l'utilisateur ${otherUserId}`);
        this.server.to(`user:${otherUserId}`).emit('unreadMessage', {
          conversationId: data.conversation_id,
          messageCount: 1,
          timestamp: new Date(),
        });
      }
      
      // Confirmer l'envoi au client
      client.emit('messageSent', { success: true, messageId: message.id });
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
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
          groups: client.handshake.auth.groups ?? []
        } 
      } as WsRequestDto);
      
      // Émettre la nouvelle conversation aux deux utilisateurs
      this.server.to(`user:${userId}`).emit('newConversation', conversation);
      this.server.to(`user:${data.user2_id}`).emit('newConversation', conversation);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
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
      console.log('🗑️ Suppression de conversation demandée:', { 
        userId, 
        conversationId,
        socketId: client.id 
      });
      
      // Récupérer les informations de la conversation avant suppression
      const conversation = await this.messagesService.getConversationById(conversationId);
      if (!conversation) {
        client.emit('error', { message: 'Conversation non trouvée' });
        return;
      }

      // Vérifier que l'utilisateur est autorisé à supprimer cette conversation
      if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
        client.emit('error', { message: 'Non autorisé à supprimer cette conversation' });
        return;
      }

      // Supprimer la conversation
      await this.messagesService.deleteConversation(conversationId, { 
        user: { 
          userId,
          groups: client.handshake.auth.groups ?? []
        } 
      } as WsRequestDto);
      
      // Notifier les deux utilisateurs de la suppression
      const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
      
      console.log(`🗑️ Notification de suppression envoyée aux utilisateurs:`, {
        deletedBy: userId,
        otherUser: otherUserId,
        conversationId
      });
      
      // Émettre l'événement de suppression aux deux utilisateurs
      this.server.to(`user:${userId}`).emit('conversationDeleted', {
        conversationId,
        deletedBy: userId,
        timestamp: new Date()
      });
      
      this.server.to(`user:${otherUserId}`).emit('conversationDeleted', {
        conversationId,
        deletedBy: userId,
        timestamp: new Date()
      });
      
      // Confirmer la suppression au client
      client.emit('conversationDeleted', { 
        success: true, 
        conversationId,
        deletedBy: userId
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la conversation:', error);
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
          groups: client.handshake.auth.groups ?? []
        } 
      } as WsRequestDto);
      
      // Notifier les autres utilisateurs que les messages ont été lus
      this.server.to(`conversation:${conversationId}`).emit('messagesRead', {
        conversationId,
        readBy: userId,
        timestamp: new Date(),
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.handshake.auth.userId;
    
    // Émettre l'événement de frappe aux autres utilisateurs de la conversation
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });

    // Si l'utilisateur arrête de taper, on peut nettoyer les timers
    if (!data.isTyping) {
      // Arrêter l'indicateur de frappe immédiatement
      client.to(`conversation:${data.conversationId}`).emit('userTyping', {
        userId,
        conversationId: data.conversationId,
        isTyping: false,
      });
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    console.log('📨 Événement getOnlineUsers reçu:', { socketId: client.id });
    const onlineUsers = Array.from(this.connectedUsers.keys());
    console.log('📋 Utilisateurs en ligne:', onlineUsers);
    client.emit('onlineUsers', { users: onlineUsers });
    console.log('📡 Liste des utilisateurs en ligne envoyée au client');
  }

  // Méthode pour émettre des messages depuis le service
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Méthode pour émettre à un utilisateur spécifique
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Méthode pour émettre une notification de nouveau message non lu
  emitUnreadNotification(userId: string, conversationId: string, messageCount: number) {
    this.server.to(`user:${userId}`).emit('unreadMessage', {
      conversationId,
      messageCount,
      timestamp: new Date(),
    });
  }

  // Méthode pour émettre une notification de nouvelle conversation
  emitNewConversationNotification(userId: string, conversation: any) {
    this.server.to(`user:${userId}`).emit('newConversation', conversation);
  }
} 