import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
  }

  /**
   * Delete a user from Cognito User Pool
   * @param userId - The Cognito user ID (sub)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Successfully deleted Cognito user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Cognito user ${userId}:`, error);
      throw new Error(`Failed to delete user from Cognito: ${error.message}`);
    }
  }
}
