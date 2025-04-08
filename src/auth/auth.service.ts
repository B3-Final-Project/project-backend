import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CognitoIdentityServiceProvider,
  CognitoIdentity,
  AWSError,
} from 'aws-sdk';
import { InitiateAuthResponse } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Request, Response } from 'express';
import { serialize } from 'cookie';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PromiseResult } from 'aws-sdk/lib/request';
import { GoogleAuthUser } from './dto/google-auth.dto';
import { GetCredentialsForIdentityResponse } from 'aws-sdk/clients/cognitoidentity';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityServiceProvider;
  private cognitoIdentity: CognitoIdentity;
  private identityPoolId: string;
  private identityId: string;
  private clientId: string;

  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION,
    });
    this.cognitoIdentity = new CognitoIdentity({
      region: process.env.AWS_REGION,
    });
    this.identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
    this.identityId = process.env.COGNITO_IDENTITY_PROVIDER_ID;
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

    const { identityId, credentialsResponse } =
      await this.getCredentialsFromIdentity(
        result.AuthenticationResult.IdToken,
        this.identityId,
      );

    return {
      identityId,
      result: result.AuthenticationResult,
      credentialsResponse,
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
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }
  }

  async googleAuthRedirect(req: Request) {
    const user = req.user as GoogleAuthUser;
    const { email, firstName, lastName, picture, id_token } = user;

    if (!id_token) {
      throw new BadRequestException('Google ID token not found.');
    }

    // Register (or add) the user in the Cognito User Pool
    // Generate a random password that meets Cognito's complexity requirements
    const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    const signUpParams = {
      ClientId: this.clientId,
      Username: email,
      Password: randomPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'picture', Value: picture },
      ],
    };

    try {
      await this.cognito.signUp(signUpParams).promise();
    } catch (error: any) {
      // If the user already exists, continue; otherwise, throw an error
      if (error.code !== 'UsernameExistsException') {
        throw new BadRequestException(
          `Error signing up user: ${error.message}`,
        );
      }
    }

    const { identityId, credentialsResponse } =
      await this.getCredentialsFromIdentity(id_token, 'accounts.google.com');

    return {
      identityId,
      credentials: credentialsResponse.Credentials,
      user,
    };
  }

  private async getCredentialsFromIdentity(
    id_token: string,
    identityProvider: string,
  ): Promise<{
    identityId: string;
    credentialsResponse: GetCredentialsForIdentityResponse;
  }> {
    // Get the Cognito Identity ID by providing the Google id_token
    const getIdParams = {
      IdentityPoolId: this.identityPoolId,
      Logins: {
        [identityProvider]: id_token,
      },
    };

    let identityIdResponse;
    try {
      identityIdResponse = await this.cognitoIdentity
        .getId(getIdParams)
        .promise();
    } catch (error: any) {
      throw new BadRequestException(
        `Error obtaining Cognito Identity ID: ${error.message}`,
      );
    }

    const identityId = identityIdResponse.IdentityId;
    if (!identityId) {
      throw new BadRequestException(
        'Failed to obtain IdentityId from Cognito.',
      );
    }

    // Exchange the identity ID and Google token for AWS credentials
    const credentialsParams = {
      IdentityId: identityId,
      Logins: {
        [identityProvider]: id_token,
      },
    };

    let credentialsResponse;
    try {
      credentialsResponse = await this.cognitoIdentity
        .getCredentialsForIdentity(credentialsParams)
        .promise();
    } catch (error: any) {
      throw new BadRequestException(
        `Error obtaining AWS credentials: ${error.message}`,
      );
    }

    return {
      identityId,
      credentialsResponse,
    };
  }
}
