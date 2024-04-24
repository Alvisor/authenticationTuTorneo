import { AuthTypes } from './auth.types';
import {
  AdminInitiateAuthCommand,
  AuthFlowType,
  GlobalSignOutCommand,
  CognitoIdentityProvider
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CONFIG } from '../../infrastructure/cognito/cognito.config';

export class AuthService {
  constructor(private readonly cognitoClient: CognitoIdentityProvider) {}

  async authenticate(userName: string, password: string): Promise<AuthTypes.AuthResult> {
    const params = {
      AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
      ClientId: COGNITO_CONFIG.CLIENT_ID,
      UserPoolId: COGNITO_CONFIG.USER_POOL_ID,
      AuthParameters: {
        USERNAME: userName,
        PASSWORD: password,
      },
    };

    const command = new AdminInitiateAuthCommand(params);
    console.log('Command', command);
    try {
      const data = await this.cognitoClient.send(command);
      console.log('Data', data);
      if (data.ChallengeName === AuthTypes.ChallengeType.NEW_PASSWORD_REQUIRED) {
        throw new Error('New password is required');
      }

      const result: AuthTypes.AuthResult = {
        accessToken: data.AuthenticationResult?.AccessToken ?? '',
        refreshToken: data.AuthenticationResult?.RefreshToken ?? '',
        expiresIn: data.AuthenticationResult?.ExpiresIn ?? 0,
      };

      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTypes.RefreshTokenResult> {
    const params = {
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: COGNITO_CONFIG.CLIENT_ID,
      UserPoolId: COGNITO_CONFIG.USER_POOL_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    const command = new AdminInitiateAuthCommand(params);

    try {
      const data = await this.cognitoClient.send(command);

      const result: AuthTypes.RefreshTokenResult = {
        accessToken: data.AuthenticationResult?.AccessToken ?? '',
        expiresIn: data.AuthenticationResult?.ExpiresIn ?? 0,
      };

      return result;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new Error('Refresh token failed');
    }
  }

  async signOut(accessToken: string): Promise<void> {
    const params = {
      AccessToken: accessToken,
    };

    const command = new GlobalSignOutCommand(params);

    try {
      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Sign out failed');
    }
  }
}