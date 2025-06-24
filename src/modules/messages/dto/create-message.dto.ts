import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsNumber()
  conversation_id: number;

  @IsNotEmpty()
  @IsString()
  content: string;
} 