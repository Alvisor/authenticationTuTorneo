import { APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import { AuthService } from './domain/auth/auth.service';
import { AUTH_CONSTANTS } from './shared/constants/auth.constants';
import { responseUtil } from './shared/utils/response.util';
import { cognitoClient } from './infrastructure/cognito/cognito.client';

const authService = new AuthService(cognitoClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event headers:', event.headers);
  try {
    const { grantType } = JSON.parse(event.body ?? '{}');
    console.log('Grant type:', grantType);
    switch (grantType) {
      case AUTH_CONSTANTS.GRANT_TYPE.AUTHENTICATION:
        const { userName, password } = JSON.parse(event.body ?? '{}');
        console.log('Username:', userName);
        const authResult = await authService.authenticate(userName, password);
        return responseUtil.success(authResult);
      case AUTH_CONSTANTS.GRANT_TYPE.REFRESH_TOKEN:
        const { refreshToken } = JSON.parse(event.body ?? '{}');
        const refreshTokenResult = await authService.refreshToken(refreshToken);
        return responseUtil.success(refreshTokenResult);
      case AUTH_CONSTANTS.GRANT_TYPE.SIGN_OUT:
        const { accessToken } = JSON.parse(event.body ?? '{}');
        await authService.signOut(accessToken);
        return responseUtil.success({ message: 'Sign out successful' });
        
      default:
        return responseUtil.badRequest('Invalid grant type');
    }
  } catch (error: unknown) {
    console.error('Error:', error);
    if (error instanceof Error) {
      return responseUtil.internalServerError(error.message);
    } else {
      return responseUtil.internalServerError('An unknown error occurred');
    }
  }
};