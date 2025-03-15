import { Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { AuthenticationResultType } from 'aws-sdk/clients/cognitoidentityserviceprovider';

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
      Username: body.username,
      Password: body.password,
      UserAttributes: [{ Name: 'email', Value: body.email }],
    };

    try {
      return await this.cognito.signUp(params).promise();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async login(
    username: string,
    password: string,
  ): Promise<AuthenticationResultType> {
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
      return result.AuthenticationResult; // Includes AccessToken, IdToken, RefreshToken
    } catch (error) {
      throw new Error(error.message);
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
      throw new Error(error.message);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
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
