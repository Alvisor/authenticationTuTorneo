export namespace AuthTypes {
    export interface AuthResult {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }
  
    export interface RefreshTokenResult {
      accessToken: string;
      expiresIn: number;
    }
  
    export enum ChallengeType {
      NEW_PASSWORD_REQUIRED = 'NEW_PASSWORD_REQUIRED',
      // Agrega otros tipos de desafío si los necesitas
    }
  }