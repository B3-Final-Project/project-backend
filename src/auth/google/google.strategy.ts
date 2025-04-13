import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  Profile,
  GoogleCallbackParameters,
} from 'passport-google-oauth20';
import { GoogleAuthUser } from './dto/google-auth.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'http://localhost:8080/api/auth/google/redirect',
        scope: ['email', 'profile', 'openid'],
      },
      async (
        _accessToken: string,
        refreshToken: string,
        params: GoogleCallbackParameters,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        const { id_token } = params;
        const { name, emails, photos, id } = profile;
        const user: GoogleAuthUser = {
          email: emails[0].value,
          firstName: name.givenName,
          lastName: name.familyName,
          picture: photos[0].value,
          id_token,
          id,
        };
        console.log(user);
        done(null, user);
      },
    );
  }

  authorizationParams(): { [key: string]: string } {
    return {
      prompt: 'consent',
    };
  }
}
