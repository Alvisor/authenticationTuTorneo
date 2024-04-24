import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProvider, AdminInitiateAuthCommand, AuthFlowType, GlobalSignOutCommand   } from '@aws-sdk/client-cognito-identity-provider';
const region = process.env.AWS_REGION;
const cognito = new CognitoIdentityProvider({ region});
// Const Definition for grant types
const GRANT_TYPE_SIGN_OUT = 'sign_out';
const GRANT_TYPE_REFRESH_TOKEN = 'refresh_token';
const GRANT_TYPE_AUTHENTICATION = 'authentication';
// Const Definition for challenge types
const CHALLENGE_TYPE_NEW_PASSWORD_REQUIRED = 'NEW_PASSWORD_REQUIRED'
/**
 * Access point for the lambda
 * @param APIGatewayProxyEvent 
 * @returns null
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Evento recibido: ", event.requestContext);
  const clientId = process.env.COGNITO_CLIENT_ID;
  const userPoolId = process.env.USER_POOL_ID;
  if (!clientId || !userPoolId) {
    console.error('ClientId o UserPoolId no están definidos en las variables de entorno');
    return response(500, 'Internal configuration error');     
  }
  
  if (!event.body) {
      return response(400, 'Request body is missing');
  }
  
  // Confirm operation
  const body = JSON.parse(event.body);
  if (body.grantType === GRANT_TYPE_REFRESH_TOKEN) {
    return handleRefreshToken(body, clientId, userPoolId);
  } else if (body.grantType === GRANT_TYPE_AUTHENTICATION) {
    return handleAuthentication(body, clientId, userPoolId);
  } else if (body.grantType === GRANT_TYPE_SIGN_OUT) {
    return handleSignOut(body);
  }
  else{
    return response(400, 'Invalid grant type');
  }
};
/**
 * Handler for authentication
 * @param body: { userName: any; password: any; }, clientId: string, userPoolId: string
 * @returns null
 */
async function handleAuthentication(body: { userName: any; password: any; }, clientId: string, userPoolId: string) {
  const { userName, password } = body;
  if (!userName || !password) {
    console.error('Username or password were not found in body');
    return response(400, 'Username or password were not found in body');
  }
  console.log("username: ", userName);
  const params = {
    AuthFlow:  AuthFlowType.ADMIN_NO_SRP_AUTH,
    ClientId: clientId,
    UserPoolId: userPoolId,
    AuthParameters: {
        USERNAME: userName,
        PASSWORD: password,
    },
  };

const command = new AdminInitiateAuthCommand(params);

  try {
      const data = await cognito.send(command);

      if (data.ChallengeName === CHALLENGE_TYPE_NEW_PASSWORD_REQUIRED) {
          return response(401, 'New password is required');
      }

      const result = {
          accessToken: data.AuthenticationResult?.AccessToken || '',
          refreshToken: data.AuthenticationResult?.RefreshToken || '',
          expiresIn: data.AuthenticationResult?.ExpiresIn || '',
      };
      return response(200, result);
  } catch (error) {
      console.error('Authentication error:', error);
      return response(502, error instanceof Error ? error.message : 'Unknown error');
  }
}
/**
 * Handler for refresh token
 * @param body: { refreshToken: any; }, clientId: string, userPoolId: string)
 * @returns null
 */
async function handleRefreshToken(body: { refreshToken: any; }, clientId: string, userPoolId: string) {
  const { refreshToken } = body;
  if (!refreshToken) {
    console.error('Refresh token not found in body');
    return response(400, 'Refresh token not found in body');
  }
  
  const params = {
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: clientId,
      UserPoolId: userPoolId,
      AuthParameters: {
          REFRESH_TOKEN: refreshToken,
      },
  };
  const command = new AdminInitiateAuthCommand(params);
  try {    
    const data = await cognito.send(command);
    console.log("Cognito Refresh Token Response: ", data);

    const result = {
        AccessToken: data.AuthenticationResult?.AccessToken || '',
        ExpiresIn: data.AuthenticationResult?.ExpiresIn || '',
    };
    return response(200, result);
  } catch (error) {
    console.error('Refresh token error:', error);
    return response(502, error instanceof Error ? error.message : 'Unknown error');
  }
}
/**
 * Handler for sign out
 * @param body: { accessToken: any; }, clientId: string, userPoolId: string
 * @returns null
 */
async function handleSignOut(body: { accessToken: any; }) {
  const { accessToken } = body;
  if (!accessToken) {
    console.error('Access token not found in body');
    return response(400, 'Access token not found in body');
  }
  
  const params = {
    AccessToken: accessToken,
  };
  const command = new GlobalSignOutCommand(params);
  
  try {
    const data = await cognito.send(command);
    console.log("Sign out successful", data);
    return response(200, { message: 'Sign out successful' });
  } catch (error) {
    console.error('Sign out error:', error);
    return response(502, error instanceof Error ? error.message : 'Unknown error');
  }
}
/**
 * Funtion for responses
 * @param (statusCode: number, body: any
 * @returns APIGatewayProxyResult
 */
function response(statusCode: number, body: any) {
    //Everything distinc to success response
    if(statusCode!=200){
      let message = body
      let code = statusCode
      return {
        statusCode,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
          error: {
            code,
            message
          },
        }),
      }
    }
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify(body),
    };
  }