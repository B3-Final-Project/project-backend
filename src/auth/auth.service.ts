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
import { GoogleAuthUser } from './dto/google-auth.dto';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;
  private googleUserPasswords = new Map<string, string>();

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

  async googleAuthRedirect(req: Request, res: Response) {
    const user = req.user as GoogleAuthUser;
    const { email, firstName, lastName, picture, id_token, id } = user;
    if (!id_token) {
      throw new BadRequestException('Google ID token not found.');
    }

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const cognitoUsername = email; // We use email as the username

    // Step 1: Check if the user already exists in Cognito.
    let userExists = true;
    try {
      await this.cognito
        .adminGetUser({
          UserPoolId: userPoolId,
          Username: cognitoUsername,
        })
        .promise();
    } catch (error: any) {
      if (error.code === 'UserNotFoundException') {
        userExists = false;
      } else {
        throw new BadRequestException(error.message);
      }
    }

    // Step 2: If the user doesn't exist, create one.
    // We'll generate a random password (or use a fixed one in production for Google users)
    let password: string;
    if (!userExists) {
      password = Math.random().toString(36).slice(-8) + 'Aa1!'; // Or use a fixed default for all Google users
      // Store this password for later use (this is crucial if you generate a random one)
      this.googleUserPasswords.set(email, password);

      console.log(this.googleUserPasswords);
      const signUpParams = {
        UserPoolId: userPoolId,
        Username: cognitoUsername,
        TemporaryPassword: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          { Name: 'picture', Value: picture },
        ],
        MessageAction: 'SUPPRESS', // Do not send invitation
      };

      try {
        await this.cognito.adminCreateUser(signUpParams).promise();
        await this.cognito
          .adminSetUserPassword({
            UserPoolId: userPoolId,
            Username: cognitoUsername,
            Password: password,
            Permanent: true,
          })
          .promise();
      } catch (error: any) {
        throw new BadRequestException(`Error creating user: ${error.message}`);
      }
    } else {
      // If user exists, we need to have the stored password.
      // If using a fixed password for all Google users, use that fixed string.
      if (this.googleUserPasswords.has(email)) {
        password = this.googleUserPasswords.get(email);
      } else {
        // Alternatively, assign a default known password (ensure it's secure and consistent)
        password = process.env.DEFAULT_GOOGLE_USER_PASSWORD;
        if (!password) {
          throw new BadRequestException(
            'No stored password for existing Google user.',
          );
        }
      }
    }

    // Step 3: Link the Google identity to the Cognito user.
    // This will link the external provider so that Cognito can later
    // recognize this user as coming from Google.
    const providerName = 'Google';
    try {
      await this.cognito
        .adminLinkProviderForUser({
          UserPoolId: userPoolId,
          DestinationUser: {
            ProviderName: 'Cognito',
            ProviderAttributeValue: cognitoUsername,
          },
          SourceUser: {
            ProviderName: providerName,
            ProviderAttributeName: 'Cognito_Subject',
            ProviderAttributeValue: id || '', // Use Google user unique ID if available
          },
        })
        .promise();
    } catch (error: any) {
      // If error indicates the user is already linked, you can ignore it.
      // If the error indicates that the provider is already linked, log and continue.
      if (
        error.code === 'InvalidParameterException' &&
        error.message &&
        error.message.includes('already linked')
      ) {
        console.warn(
          'Google identity already linked to Cognito user. Continuing...',
        );
      } else {
        throw new BadRequestException(
          `Error linking provider: ${error.message}`,
        );
      }
    }

    // Step 4: Authenticate the user via Cognito to get Cognito tokens.
    // We use the ADMIN_NO_SRP_AUTH flow which allows you to pass the username/password directly.
    const authParams = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      ClientId: this.clientId,
      UserPoolId: userPoolId,
      AuthParameters: {
        USERNAME: cognitoUsername,
        PASSWORD: password,
      },
    };

    let authResult: PromiseResult<InitiateAuthResponse, AWSError>;
    try {
      authResult = await this.cognito.adminInitiateAuth(authParams).promise();
      // Optionally, store the Cognito refresh token in a cookie.
      const cognitoRefreshToken = authResult.AuthenticationResult.RefreshToken;
      if (cognitoRefreshToken) {
        const serializedCookie = serialize(
          'refreshToken',
          cognitoRefreshToken,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
          },
        );
        res.setHeader('Set-Cookie', serializedCookie);
      }
    } catch (error: any) {
      throw new BadRequestException(`Error initiating auth: ${error.message}`);
    }

    // Return the Cognito ID token as the access token.
    return {
      AccessToken: authResult.AuthenticationResult.IdToken,
    };
  }
}
