import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

export function formatConversationForFrontend(
  conversation: Conversation,
  currentUserId: string,
): any {
  const otherUser =
    conversation.user1_id === currentUserId
      ? conversation.user2
      : conversation.user1;
  const otherUserId =
    conversation.user1_id === currentUserId
      ? conversation.user2_id
      : conversation.user1_id;
  const lastMessage =
    conversation.messages && conversation.messages.length > 0
      ? conversation.messages[0]
      : null;

  const unreadCount = conversation.messages
    ? conversation.messages.filter(
        (msg) => msg.sender_id !== currentUserId && !msg.is_read,
      ).length
    : 0;

  return {
    id: conversation.id.toString(),
    name: otherUser?.name || 'Utilisateur inconnu',
    avatar:
      otherUser?.profile?.avatarUrl ||
      otherUser?.profile?.images?.[0] ||
      '/vintage.png',
    otherUserId: otherUserId,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id.toString(),
          content: lastMessage.content,
          timestamp: lastMessage.created_at,
          isMe: lastMessage.sender_id === currentUserId,
          isRead: lastMessage.is_read,
          conversationId: conversation.id.toString(),
        }
      : undefined,
    unread: unreadCount,
    isTyping: false, // À implémenter avec WebSocket si nécessaire
    lastActive: conversation.updated_at,
  };
}

export function formatMessageForFrontend(
  message: Message,
  currentUserId: string,
): any {
  return {
    id: message.id.toString(),
    content: message.content,
    timestamp: message.created_at,
    isMe: message.sender_id === currentUserId,
    isRead: message.is_read,
    conversationId: message.conversation_id.toString(),
    sender_id: message.sender_id,
    replyTo: message.replyTo ? {
      id: message.replyTo.id.toString(),
      content: message.replyTo.content,
      sender_id: message.replyTo.sender_id,
    } : null,
    reactions: message.reactions || {},
  };
}
