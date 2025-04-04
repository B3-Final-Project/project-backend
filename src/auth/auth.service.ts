import { BadRequestException, Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider, CognitoIdentity } from 'aws-sdk';
import { AuthenticationResultType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Request, Response } from 'express';
import { serialize } from 'cookie';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import axios from 'axios';

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
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
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

  async googleAuthRedirect(req: Request, code: string) {
    const user = req.user;
    // @ts-ignore
    const { email, firstName, lastName, picture } = user;
    const idToken = await this.getIdToken(code);

    if (!idToken) {
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

    // Ensure the Cognito Identity Pool ID is set (separate from the User Pool Client ID)
    const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
    if (!identityPoolId) {
      throw new BadRequestException('Cognito Identity Pool ID is not set.');
    }

    // Initialize the CognitoIdentity client for Identity Pool operations
    const cognitoIdentity = new CognitoIdentity({
      region: process.env.AWS_REGION,
    });

    // Get the Cognito Identity ID by providing the Google id_token
    const getIdParams = {
      IdentityPoolId: identityPoolId,
      Logins: {
        'accounts.google.com': idToken,
      },
    };

    let identityIdResponse;
    try {
      identityIdResponse = await cognitoIdentity.getId(getIdParams).promise();
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
        'accounts.google.com': idToken,
      },
    };

    let credentialsResponse;
    try {
      credentialsResponse = await cognitoIdentity
        .getCredentialsForIdentity(credentialsParams)
        .promise();
    } catch (error: any) {
      throw new BadRequestException(
        `Error obtaining AWS credentials: ${error.message}`,
      );
    }

    return {
      identityId,
      credentials: credentialsResponse.Credentials,
      user,
    };
  }

  private async getIdToken(code: string): Promise<string> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    // Prepare the URL-encoded request body
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET!);
    params.append(
      'redirect_uri',
      'http://localhost:8080/api/auth/google/redirect',
    );
    params.append('grant_type', 'authorization_code');

    try {
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data && response.data.id_token) {
        return response.data.id_token;
      } else {
        console.log(response);
        throw new Error('id_token not found in token response');
      }
    } catch (error: any) {
      throw new Error(`Error fetching id_token: ${error.message} ${error}`);
    }
  }
}
