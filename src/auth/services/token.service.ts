import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtRefreshPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User, deviceId?: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getAccessTokenExpiresIn(),
      ...(deviceId && { deviceId }),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  generateRefreshToken(userId: string): string {
    const tokenId = this.generateTokenId();
    const payload: JwtRefreshPayload = {
      sub: userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getRefreshTokenExpiresIn(),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  generateTokens(user: User, deviceId?: string) {
    const accessToken = this.generateAccessToken(user, deviceId);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiresIn(),
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  private getAccessTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    return this.parseTimeToSeconds(expiresIn);
  }

  private getRefreshTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    return this.parseTimeToSeconds(expiresIn);
  }

  private parseTimeToSeconds(time: string): number {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // 15분 기본값
    }
  }

  private generateTokenId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}