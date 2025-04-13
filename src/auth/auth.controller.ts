import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth login
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    await this.authService.googleAuthRedirect(req, res);
    res.redirect(process.env.FRONTEND_URL || '/');
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

  @Get('me')
  async getMe(@Req() req: Request) {
    return await this.authService.refreshToken(req);
  }
}
