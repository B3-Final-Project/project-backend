import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export interface WsUserDto {
  userId: string;
  groups: string[];
}

export interface WsRequestDto {
  user: WsUserDto;
}

export class WsRequestValidatorDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsArray()
  @IsString({ each: true })
  groups: string[];
}
