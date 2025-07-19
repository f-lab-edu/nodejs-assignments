export interface JwtPayload {
  sub: string; // userId
  email: string;
  deviceId?: string;
  iat?: number; // issued at - optional as JWT library will set this
  exp?: number; // expires at - optional as JWT library will set this
}

export interface JwtRefreshPayload {
  sub: string; // userId
  tokenId: string; // unique token identifier
  iat?: number; // optional as JWT library will set this
  exp?: number; // optional as JWT library will set this
}