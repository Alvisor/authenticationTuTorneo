import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CONFIG } from './cognito.config';

export const cognitoClient = new CognitoIdentityProvider({ region: COGNITO_CONFIG.REGION });