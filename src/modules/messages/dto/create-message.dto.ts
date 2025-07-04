import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  conversation_id: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  reply_to_id?: string;
}
