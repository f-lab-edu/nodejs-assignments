import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../users/services/user.service';
import { TokenService } from './token.service';
import { LoginInput } from '../dto/login.input';
import { RefreshTokenInput } from '../dto/refresh-token.input';
import { AuthResponse } from '../dto/auth-response.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async login(input: LoginInput): Promise<AuthResponse> {
    // 사용자 검증
    const user = await this.validateUser(input.email, input.password);

    if (!user.isAccountActive()) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // 토큰 생성
    const tokens = this.tokenService.generateTokens(user, input.deviceId);

    return new AuthResponse({
      user,
      ...tokens,
    });
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    try {
      // 리프레시 토큰 검증
      const payload = this.tokenService.verifyRefreshToken(input.refreshToken);

      // 사용자 조회
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isAccountActive()) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      // 새로운 토큰 생성
      const tokens = this.tokenService.generateTokens(user);

      return new AuthResponse({
        user,
        ...tokens,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return user;
  }

  async validateTokenPayload(payload: any): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isAccountActive()) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }

    return user;
  }
}