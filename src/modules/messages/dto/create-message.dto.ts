import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsUUID()
  conversation_id: string;

  @IsNotEmpty()
  @IsString()
  content: string;
} 