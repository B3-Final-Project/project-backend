import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { RemoveReactionDto } from './dto/remove-reaction.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks, HateoasCollectionOnly } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth('jwt-auth')
@Controller('messages')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 201, description: 'Conversation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @HateoasLinks('conversation', AppLinkBuilders.conversationLinks())
  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: HttpRequestDto,
  ) {
    return this.messagesService.createConversation(dto, req);
  }

  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @HateoasLinks('message', AppLinkBuilders.messageLinks())
  @Post()
  async sendMessage(@Body() dto: CreateMessageDto, @Req() req: HttpRequestDto) {
    return this.messagesService.sendMessage(dto, req);
  }

  @ApiOperation({ summary: 'Récupérer toutes les conversations de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  @HateoasCollectionOnly('conversation', AppLinkBuilders.conversationCollectionLinks())
  @Get('conversations')
  async getConversations(@Req() req: HttpRequestDto) {
    return this.messagesService.getConversations(req);
  }

  @ApiOperation({ summary: 'Récupérer les messages d\'une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @HateoasCollectionOnly('message', AppLinkBuilders.messageCollectionLinks())
  @Get('conversations/:id')
  async getMessages(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    return this.messagesService.getMessages(conversationId, req);
  }

  @ApiOperation({ summary: 'Marquer les messages d\'une conversation comme lus' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Messages marqués comme lus' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @Post('conversations/:id/read')
  async markMessagesAsRead(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    await this.messagesService.markMessagesAsRead(conversationId, req);
    return { success: true };
  }

  @ApiOperation({ summary: 'Supprimer une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation supprimée' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    await this.messagesService.deleteConversation(conversationId, req);
    return { success: true };
  }

  @ApiOperation({ summary: 'Ajouter une réaction à un message' })
  @ApiBody({ type: AddReactionDto })
  @ApiResponse({ status: 201, description: 'Réaction ajoutée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @HateoasLinks('message', AppLinkBuilders.messageLinks())
  @Post('reactions')
  async addReaction(@Body() dto: AddReactionDto, @Req() req: HttpRequestDto) {
    return this.messagesService.addReaction(dto, req);
  }

  @ApiOperation({ summary: 'Supprimer une réaction d\'un message' })
  @ApiBody({ type: RemoveReactionDto })
  @ApiResponse({ status: 200, description: 'Réaction supprimée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @HateoasLinks('message', AppLinkBuilders.messageLinks())
  @Delete('reactions')
  async removeReaction(@Body() dto: RemoveReactionDto, @Req() req: HttpRequestDto) {
    return this.messagesService.removeReaction(dto, req);
  }
}
