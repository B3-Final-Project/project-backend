import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { serialize } from 'cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ) {
    const authResult = await this.authService.login(
      body.username,
      body.password,
    );

    const refreshToken = authResult.RefreshToken;

    if (refreshToken) {
      const serializedCookie = serialize('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // e.g., 30 days
        path: '/',
      });
      res.setHeader('Set-Cookie', serializedCookie);
    } // Set the cookie header on the response

    // Return the auth result (or a sanitized version)
    return authResult;
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
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.authService.refreshToken(body.refreshToken);
  }
}
