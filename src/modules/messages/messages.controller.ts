import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
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
    return this.messagesService.createConversation(dto, req);
  }

  @Post()
  async sendMessage(
    @Body() dto: CreateMessageDto,
    @Req() req: HttpRequestDto,
  ) {
    return this.messagesService.sendMessage(dto, req);
  }

  @Get('conversations')
  async getConversations(@Req() req: HttpRequestDto) {
    return this.messagesService.getConversations(req);
  }

  @Get('conversations/:id')
  async getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Req() req: HttpRequestDto,
  ) {
    return this.messagesService.getMessages(conversationId, req);
  }

  @Post('conversations/:id/read')
  async markMessagesAsRead(
    @Param('id', ParseIntPipe) conversationId: number,
    @Req() req: HttpRequestDto,
  ) {
    return this.messagesService.markMessagesAsRead(conversationId, req);
  }
} 