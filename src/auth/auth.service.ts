import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
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
      console.log(`Cognito Error: ${error.code} - ${error.message}`);

      switch (error.code) {
        case 'UsernameExistsException':
          throw new ConflictException(
            'This email address is already registered.',
          );
        case 'InvalidPasswordException':
          throw new BadRequestException(
            'Password does not meet complexity requirements.',
          );
        case 'InvalidParameterException':
          throw new BadRequestException('Invalid parameters provided.');
        default:
          throw new BadRequestException(
            'An error occurred during registration.',
          );
      }
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
      console.log(`Cognito Error: ${error.code} - ${error.message}`);

      switch (error.code) {
        case 'UserNotFoundException':
        case 'NotAuthorizedException':
          throw new UnauthorizedException('Incorrect username or password.');
        case 'UserNotConfirmedException':
          throw new UnauthorizedException(
            'User account has not been confirmed.',
          );
        case 'PasswordResetRequiredException':
          throw new UnauthorizedException('Password reset is required.');
        default:
          throw new BadRequestException('An error occurred during login.');
      }
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
      switch (error.code) {
        case 'UserNotFoundException':
          throw new BadRequestException('User does not exist.');
        case 'CodeMismatchException':
          throw new UnauthorizedException('Invalid confirmation code.');
        case 'ExpiredCodeException':
          throw new UnauthorizedException('Confirmation code has expired.');
        default:
          throw new BadRequestException(
            'An unknown error occurred during confirmation.',
          );
      }
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
