export class HttpRequestDto extends Request {
  user: UserCredentialsDto;
}

export class UserCredentialsDto {
  userId: string;
  groups: string[];
}
