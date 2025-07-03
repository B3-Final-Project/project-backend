import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: HttpRequestDto,
  ) {
    const conversation = await this.messagesService.createConversation(dto, req);
    return { data: conversation };
  }

  @Post()
  async sendMessage(@Body() dto: CreateMessageDto, @Req() req: HttpRequestDto) {
    const message = await this.messagesService.sendMessage(dto, req);
    return { data: message };
  }

  @Get('conversations')
  async getConversations(@Req() req: HttpRequestDto) {
    const conversations = await this.messagesService.getConversations(req);
    return { data: conversations };
  }

  @Get('conversations/:id')
  async getMessages(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    const messages = await this.messagesService.getMessages(conversationId, req);
    return { data: messages };
  }

  @Post('conversations/:id/read')
  async markMessagesAsRead(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    await this.messagesService.markMessagesAsRead(conversationId, req);
    return { success: true };
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') conversationId: string,
    @Req() req: HttpRequestDto,
  ) {
    await this.messagesService.deleteConversation(conversationId, req);
    return { success: true };
  }
}
