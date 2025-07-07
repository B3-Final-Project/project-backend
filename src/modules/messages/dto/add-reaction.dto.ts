import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddReactionDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  message_id: string;

  @IsNotEmpty()
  @IsString()
  emoji: string;
}
