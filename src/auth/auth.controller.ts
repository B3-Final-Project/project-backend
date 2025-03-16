import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ) {
    return await this.authService.login(body, res);
  }

  @Post('register')
  public async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('confirm')
  async confirm(@Body() body: ConfirmAccountDto) {
    return await this.authService.confirmAccount(body.username, body.code);
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    return await this.authService.refreshToken(req);
  }
}
