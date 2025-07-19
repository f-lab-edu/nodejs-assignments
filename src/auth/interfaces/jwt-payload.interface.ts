export interface JwtPayload {
  sub: string; // userId
  email: string;
  iat: number; // issued at
  exp: number; // expires at
  deviceId?: string;
}

export interface JwtRefreshPayload {
  sub: string; // userId
  tokenId: string; // unique token identifier
  iat: number;
  exp: number;
}