import { BadRequestException, Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider, AWSError } from 'aws-sdk';
import {
  AuthenticationResultType,
  InitiateAuthResponse,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Request, Response } from 'express';
import { serialize } from 'cookie';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PromiseResult } from 'aws-sdk/lib/request';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;

  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION,
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
  }

  async register(body: RegisterDto): Promise<any> {
    const params = {
      ClientId: this.clientId,
      Username: body.email,
      Password: body.password,
      UserAttributes: [{ Name: 'custom:display_name', Value: body.username }],
    };

    try {
      return await this.cognito.signUp(params).promise();
    } catch (error) {
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }
  }

  public async login(body: LoginDto, res: Response) {
    const { email, password } = body;

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    let result: PromiseResult<InitiateAuthResponse, AWSError>;
    try {
      result = await this.cognito.initiateAuth(params).promise();

      // Store the Cognito refresh token in a cookie.
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
    } catch (error) {
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }

    // Return the Cognito ID token as the access token.
    return {
      AccessToken: result.AuthenticationResult.IdToken,
    };
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
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }
  }

  async refreshToken(req: Request): Promise<AuthenticationResultType> {
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
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }
  }

  async getUserInfo(req: Request): Promise<any> {
    // Step 1: Use the refresh token to get new tokens.
    const authResult = await this.refreshToken(req);
    if (!authResult || !authResult.IdToken) {
      throw new BadRequestException('Unable to refresh token');
    }
    const idToken = authResult.IdToken;

    // Step 2: Decode the ID token to get the username.
    const decodedToken: any = jwt.decode(idToken);
    if (!decodedToken || !decodedToken.sub) {
      throw new BadRequestException('Failed to decode token');
    }
    // Assume that the Cognito username equals the subject (or you could use email if that's stored)
    const username = decodedToken.sub;

    // Step 3: Retrieve user details from Cognito.
    let userInfo;
    try {
      const userResult = await this.cognito
        .adminGetUser({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: username,
        })
        .promise();

      // Convert Cognito UserAttributes array to an object.
      userInfo = userResult.UserAttributes?.reduce((acc, attribute) => {
        acc[attribute.Name] = attribute.Value;
        return acc;
      }, {});
    } catch (error) {
      throw new BadRequestException(
        `Failed to get user info: ${error.message}`,
      );
    }

    // Step 4: Return the token and user data.
    return {
      accessToken: idToken,
      user: {
        email: userInfo.email,
        surname: userInfo.family_name,
        name: userInfo.given_name,
        picture: userInfo.picture,
      },
    };
  }
}
