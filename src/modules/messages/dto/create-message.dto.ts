import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'ID de conversation doit être un UUID valide'
  })
  conversation_id: string;

  @IsNotEmpty()
  @IsString()
  content: string;
} 