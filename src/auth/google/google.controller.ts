import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { GoogleAuthService } from './google.service';

@Controller('auth')
export class GoogleAuthController {
  public constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth login
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    await this.googleAuthService.googleAuthRedirect(req, res);
    res.redirect(process.env.FRONTEND_URL || '/');
  }
}
