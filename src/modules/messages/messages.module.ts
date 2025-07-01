import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Message } from '../../common/entities/message.entity';
import { Conversation } from '../../common/entities/conversation.entity';
import { User } from '../../common/entities/user.entity';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, WsJwtGuard],
  exports: [MessagesService],
})
export class MessagesModule {} 