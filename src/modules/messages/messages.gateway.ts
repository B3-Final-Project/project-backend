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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { WsRequestDto } from '../../common/dto/ws-request.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: '/messages',
})
@UseGuards(WsJwtGuard)
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  constructor(private readonly messagesService: MessagesService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (userId) {
        this.connectedUsers.set(userId, client);
        client.join(`user:${userId}`);
        console.log(`User ${userId} connected to messages`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected from messages`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.handshake.auth.userId;
    client.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.handshake.auth.userId;
    client.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);
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
          groups: client.handshake.auth.groups || []
        } 
      } as WsRequestDto);
      
      // Émettre le message à tous les utilisateurs de la conversation
      this.server.to(`conversation:${data.conversation_id}`).emit('newMessage', message);
      
      // Émettre une notification de nouvelle conversation si c'est le premier message
      const conversation = await this.messagesService.getConversationById(data.conversation_id);
      if (conversation) {
        const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
        this.server.to(`user:${otherUserId}`).emit('conversationUpdated', {
          conversationId: data.conversation_id,
          lastMessage: message,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
          groups: client.handshake.auth.groups || []
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
          groups: client.handshake.auth.groups || []
        } 
      } as WsRequestDto);
      
      // Notifier les autres utilisateurs que les messages ont été lus
      this.server.to(`conversation:${conversationId}`).emit('messagesRead', {
        conversationId,
        readBy: userId,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.handshake.auth.userId;
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
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