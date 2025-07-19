import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProfileService } from '../../profiles/services/profile.service';
import { RegisterInput } from '../dto/register.input';
import { AuthResponse } from '../dto/auth-response.dto';

@Injectable()
export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. 사용자 생성
    const user = await this.userService.create({
      email: input.email,
      password: input.password,
    });

    // 2. 기본 프로필 생성
    await this.profileService.createDefault(user.id);

    // 3. JWT 토큰 생성 및 반환
    const tokens = await this.authService.login({
      email: user.email,
      password: input.password,
    });

    return tokens;
  }

  async registerWithProfile(
    input: RegisterInput,
    profileName?: string,
  ): Promise<AuthResponse> {
    // 1. 사용자 생성
    const user = await this.userService.create({
      email: input.email,
      password: input.password,
    });

    // 2. 커스텀 프로필 생성 또는 기본 프로필
    if (profileName) {
      await this.profileService.create(user.id, {
        name: profileName,
      });
    } else {
      await this.profileService.createDefault(user.id);
    }

    // 3. JWT 토큰 생성 및 반환
    const tokens = await this.authService.login({
      email: user.email,
      password: input.password,
    });

    return tokens;
  }
}