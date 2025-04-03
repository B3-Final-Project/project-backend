import { Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { AuthenticationResultType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Request, Response } from 'express';
import { serialize } from 'cookie';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;

  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({ region: 'eu-west-3' });
    this.clientId = process.env.COGNITO_CLIENT_ID;
  }

  async register(body: any): Promise<any> {
    const params = {
      ClientId: this.clientId,
      Username: body.email,
      Password: body.password,
      UserAttributes: [{ Name: 'custom:display_name', Value: body.username }],
    };

    try {
      return await this.cognito.signUp(params).promise();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async login(
    body: LoginDto,
    res: Response,
  ): Promise<AuthenticationResultType> {
    const { username, password } = body;

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    try {
      const result = await this.cognito.initiateAuth(params).promise();

      const refreshToken = result.AuthenticationResult.RefreshToken;

      if (refreshToken) {
        const serializedCookie = serialize('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
        res.setHeader('Set-Cookie', serializedCookie);
      }

      return result.AuthenticationResult; // Includes AccessToken, IdToken, RefreshToken
    } catch (error) {
      throw new Error(error);
    }
  }

  async confirmAccount(
    username: string,
    confirmationCode: string,
  ): Promise<any> {
    const params = {
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    };

    try {
      return await this.cognito.confirmSignUp(params).promise();
    } catch (error) {
      throw new Error(error);
    }
  }

  async refreshToken(req: Request): Promise<any> {
    const refreshToken = req.cookies.refreshToken;

    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    try {
      const result = await this.cognito.initiateAuth(params).promise();
      return result.AuthenticationResult; // Includes new ID and Access tokens
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
