import { BadRequestException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { PromiseResult } from 'aws-sdk/lib/request';
import { InitiateAuthResponse } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
import { serialize } from 'cookie';
import { GoogleAuthUser } from './dto/google-auth.dto';

@Injectable()
export class GoogleAuthService {
  private readonly cognito: CognitoIdentityServiceProvider;
  private readonly clientId: string;

  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION,
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
  }

  async googleAuthRedirect(req: Request, res: Response) {
    const user = req.user as GoogleAuthUser;
    const { email, id } = user;

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const cognitoUsername = email;
    const password = process.env.DEFAULT_GOOGLE_USER_PASSWORD;

    if (!password) {
      throw new BadRequestException(
        'No stored password for existing Google user.',
      );
    }

    await this.createFullUser(user, password);

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
            ProviderAttributeValue: id,
          },
        })
        .promise();
    } catch (error: any) {
      // If the error indicates that the provider is already linked, log and continue.
      if (
        error.code === 'InvalidParameterException' &&
        error.message?.includes('already linked')
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

  private async createFullUser(user: GoogleAuthUser, password: string) {
    const { email, firstName, lastName, picture } = user;
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

    if (!userExists) {
      // password = Math.random().toString(36).slice(-14) + 'Aa1!'; // Or use a fixed default for all Google users
      // TODO make the password random and set in database

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
    }
  }
}
