export const COGNITO_CONFIG = {
    REGION: process.env.AWS_REGION || 'us-east-1',
    USER_POOL_ID: process.env.USER_POOL_ID || '',
    CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
  };