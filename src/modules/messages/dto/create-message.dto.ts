import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  conversation_id: string;

  @IsNotEmpty()
  @IsString()
  content: string;
} 