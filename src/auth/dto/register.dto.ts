import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(12)
  username: string;
}
