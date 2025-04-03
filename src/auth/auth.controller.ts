import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(@Body() body: LoginDto, @Res() res: Response) {
    return this.authService.login(body, res);
  }

  @Post('google')
  public async ssoGoogle(@Body() body: LoginDto, @Res() res: Response) {
    return this.authService.ssoGoogle(body, res);
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
